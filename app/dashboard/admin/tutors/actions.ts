"use server"

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleTutorVerification(tutorId: string, currentStatus: boolean) {
  const supabase = await createClient();
  
  // Verify Admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Unauthorized" };

  const adminClient = await import("@/utils/supabase/admin").then(m => m.createAdminClient());

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
  } else {
    await adminClient
      .from("applications")
      .update({ status: "pending" })
      .eq("user_id", tutorId);
  }

  console.log("✅ Tutor", tutorId, "verification toggled to:", !currentStatus);
  revalidatePath("/dashboard/admin/tutors");
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
