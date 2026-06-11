"use server"

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { sendTutorAcceptedEmail } from "@/lib/email";

function isRecord(value: unknown): value is Record<string, any> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export async function toggleTutorVerification(tutorId: string, currentStatus: boolean) {
  const supabase = await createClient();
  
  // Verify Admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Unauthorized" };

  const adminClient = await import("@/utils/supabase/admin").then(m => m.createAdminClient());
  const { data: existingApplication } = await adminClient
    .from("applications")
    .select("status, data")
    .eq("user_id", tutorId)
    .maybeSingle();

  const applicationData = isRecord(existingApplication?.data) ? existingApplication.data : {};
  const shouldSendAcceptanceEmail =
    !currentStatus &&
    existingApplication?.status !== "approved" &&
    !applicationData.welcome_email_sent_at;

  // Use upsert to handle cases where the tutors record might be missing
  const { error } = await adminClient
    .from("tutors")
    .upsert({ 
      id: tutorId, 
      is_verified: !currentStatus,
      hourly_rate: 30, // Default if not existing
      subjects: ['General'], // Default if not existing
      rating: 0
    }, { onConflict: 'id' });

  if (error) {
    console.error("🚨 Admin Verification Error for Tutor", tutorId, ":", error.message);
    return { error: error.message };
  }

  // Update application status to approved
  if (!currentStatus) {
    await adminClient
      .from("applications")
      .update({ status: "approved" })
      .eq("user_id", tutorId);

    if (shouldSendAcceptanceEmail) {
      const { data: tutorProfile } = await adminClient
        .from("profiles")
        .select("full_name, email")
        .eq("id", tutorId)
        .maybeSingle();

      if (tutorProfile?.email) {
        const result = await sendTutorAcceptedEmail(
          tutorProfile.email,
          tutorProfile.full_name || "Tutor"
        );

        if (result.success) {
          await adminClient
            .from("applications")
            .update({
              data: {
                ...applicationData,
                welcome_email_sent_at: new Date().toISOString(),
              },
            })
            .eq("user_id", tutorId);
        } else {
          console.error("🚨 Tutor acceptance email failed for", tutorId, result.error);
        }
      } else {
        console.warn("⚠️ Tutor acceptance email skipped; missing profile email for", tutorId);
      }
    }
  } else {
    await adminClient
      .from("applications")
      .update({ status: "pending" })
      .eq("user_id", tutorId);
  }

  console.log("✅ Tutor", tutorId, "verification toggled to:", !currentStatus);
  revalidatePath("/dashboard/admin/tutors");
  revalidatePath("/dashboard/tutor");
  revalidatePath("/dashboard/tutor/settings");
  revalidatePath("/"); // Update the public directory
  revalidatePath(`/tutor/${tutorId}`);
  return { success: true };
}

export async function getSignedDocumentUrl(filePath: string) {
  const supabase = await createClient();
  
  // Verify Admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Unauthorized" };

  const adminClient = await import("@/utils/supabase/admin").then(m => m.createAdminClient());
  
  const { data, error } = await adminClient.storage
    .from("private_docs")
    .createSignedUrl(filePath, 60 * 60); // 1 hour expiry

  if (error || !data) {
    console.error("Failed to generate signed URL:", error);
    return { error: "Failed to generate document link" };
  }

  return { url: data.signedUrl };
}

async function requireAdminContext() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" as const };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Unauthorized" as const };

  const adminClient = await import("@/utils/supabase/admin").then(m => m.createAdminClient());
  return { user, adminClient };
}

async function refreshTutorRating(adminClient: any, tutorId: string) {
  const { error } = await adminClient.rpc("recalculate_tutor_rating", {
    target_tutor_id: tutorId,
  });

  if (error) {
    console.error("🚨 Tutor rating refresh error:", error.message);
  }
}

export async function moderateTutorReview(
  reviewId: string,
  status: "approved" | "rejected",
  adminNote?: string,
) {
  const context = await requireAdminContext();
  if ("error" in context) return { error: context.error };

  const { data: review, error: fetchError } = await context.adminClient
    .from("reviews")
    .select("id, tutor_id")
    .eq("id", reviewId)
    .maybeSingle();

  if (fetchError || !review) {
    return { error: fetchError?.message || "Review not found" };
  }

  const { error } = await context.adminClient
    .from("reviews")
    .update({
      status,
      admin_note: adminNote?.trim() || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: context.user.id,
    })
    .eq("id", reviewId);

  if (error) {
    console.error("🚨 Review moderation error:", error.message);
    return { error: error.message };
  }

  await refreshTutorRating(context.adminClient, review.tutor_id);

  revalidatePath("/dashboard/admin/tutors");
  revalidatePath("/");
  revalidatePath(`/tutor/${review.tutor_id}`);
  return { success: true };
}

export async function deleteTutorReview(reviewId: string) {
  const context = await requireAdminContext();
  if ("error" in context) return { error: context.error };

  const { data: review, error: fetchError } = await context.adminClient
    .from("reviews")
    .select("id, tutor_id")
    .eq("id", reviewId)
    .maybeSingle();

  if (fetchError || !review) {
    return { error: fetchError?.message || "Review not found" };
  }

  const { error } = await context.adminClient
    .from("reviews")
    .delete()
    .eq("id", reviewId);

  if (error) {
    console.error("🚨 Review deletion error:", error.message);
    return { error: error.message };
  }

  await refreshTutorRating(context.adminClient, review.tutor_id);

  revalidatePath("/dashboard/admin/tutors");
  revalidatePath("/");
  revalidatePath(`/tutor/${review.tutor_id}`);
  return { success: true };
}
