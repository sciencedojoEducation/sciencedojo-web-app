"use server"

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { getMeaningfulTutorSubjects } from "@/lib/tutors/subjects";
import { sendTrackedEmail } from "@/lib/communications";

function isRecord(value: unknown): value is Record<string, any> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

const DEFAULT_CHECKLIST = {
  identity_verified: false,
  qualifications_uploaded: false,
  qualifications_reviewed: false,
  references_submitted: false,
  references_checked: false,
  background_check_submitted: false,
  background_check_approved: false,
  safeguarding_accepted: false,
  safeguarding_training_completed: false,
  interview_completed: false,
  teaching_demo_reviewed: false,
  profile_completed: false,
};

function buildApplicationChecklist(applicationData: Record<string, any>) {
  const education = Array.isArray(applicationData.education) ? applicationData.education : [];
  const hasTranscript = education.some((entry) => isRecord(entry) && Boolean(entry.transcript_url));

  return {
    ...DEFAULT_CHECKLIST,
    identity_verified: Boolean(applicationData.government_id_url),
    qualifications_uploaded: hasTranscript,
    background_check_submitted: Boolean(applicationData.background_check_url),
    safeguarding_accepted: applicationData.terms_accepted === "true" && applicationData.gdpr_accepted === "true",
    teaching_demo_reviewed: Boolean(applicationData.demo_video_url),
    profile_completed: Boolean(applicationData.full_name && applicationData.subjects && applicationData.hourly_rate),
  };
}

function canAwardVerifiedBadge(tutor: Record<string, any>) {
  const checklist = {
    ...DEFAULT_CHECKLIST,
    ...(isRecord(tutor.verification_checklist) ? tutor.verification_checklist : {}),
  };
  const backgroundOk =
    tutor.background_check_type === "not_required" ||
    tutor.background_check_status === "approved" ||
    checklist.background_check_approved === true ||
    checklist.background_check_submitted === true;

  return Boolean(
    checklist.identity_verified &&
    checklist.qualifications_uploaded &&
    checklist.safeguarding_accepted &&
    checklist.profile_completed &&
    backgroundOk
  );
}

function revalidateTutorAdminPaths(tutorId: string) {
  revalidatePath("/dashboard/admin/tutors");
  revalidatePath("/dashboard/tutor");
  revalidatePath("/dashboard/tutor/settings");
  revalidatePath("/");
  revalidatePath(`/tutor/${tutorId}`);
}

async function getApplicationAndSubjects(adminClient: any, tutorId: string) {
  const { data: existingApplication } = await adminClient
    .from("applications")
    .select("status, data, subjects")
    .eq("user_id", tutorId)
    .maybeSingle();

  const { data: existingTutor } = await adminClient
    .from("tutors")
    .select("subjects")
    .eq("id", tutorId)
    .maybeSingle();

  const applicationData = isRecord(existingApplication?.data) ? existingApplication.data : {};
  const existingTutorSubjects = getMeaningfulTutorSubjects(existingTutor?.subjects);
  const stagedApplicationSubjects = getMeaningfulTutorSubjects(applicationData.subjects);
  const legacyApplicationSubjects = getMeaningfulTutorSubjects(existingApplication?.subjects);
  const resolvedSubjects = existingTutorSubjects.length > 0
    ? existingTutorSubjects
    : stagedApplicationSubjects.length > 0
      ? stagedApplicationSubjects
      : legacyApplicationSubjects;

  return { existingApplication, applicationData, resolvedSubjects };
}

export async function approveTutorForListing(tutorId: string) {
  const context = await requireAdminContext();
  if ("error" in context) return { error: context.error };

  const { existingApplication, applicationData, resolvedSubjects } = await getApplicationAndSubjects(context.adminClient, tutorId);
  const shouldSendAcceptanceEmail =
    existingApplication?.status !== "approved" &&
    !applicationData.welcome_email_sent_at;

  const tutorUpsert: Record<string, unknown> = {
    id: tutorId,
    is_verified: false,
    is_publicly_listed: true,
    tutor_status: "approved_listed",
    approved_at: new Date().toISOString(),
    approved_by_admin_id: context.user.id,
    verification_checklist: buildApplicationChecklist(applicationData),
    background_check_status: applicationData.background_check_url ? "submitted" : "not_started",
    hourly_rate: 30, // Default if not existing
    rating: 0
  };

  tutorUpsert.subjects = resolvedSubjects;

  // Use upsert to handle cases where the tutors record might be missing
  const { error } = await context.adminClient
    .from("tutors")
    .upsert(tutorUpsert, { onConflict: 'id' });

  if (error) {
    console.error("🚨 Admin Approval Error for Tutor", tutorId, ":", error.message);
    return { error: error.message };
  }

  await context.adminClient
    .from("applications")
    .update({ status: "approved" })
    .eq("user_id", tutorId);

  if (shouldSendAcceptanceEmail) {
    const { data: tutorProfile } = await context.adminClient
      .from("profiles")
      .select("full_name, email")
      .eq("id", tutorId)
      .maybeSingle();

    if (tutorProfile?.email) {
        const result = await sendTrackedEmail({
          userId: tutorId,
          recipientEmail: tutorProfile.email,
          recipientName: tutorProfile.full_name || "Tutor",
          category: "account",
          audience: "tutor",
          templateKey: "tutor_profile_approved_listed",
          dedupeHours: 720,
        });

      if ("sent" in result || "skipped" in result) {
        await context.adminClient
          .from("applications")
          .update({
            data: {
              ...applicationData,
              welcome_email_sent_at: new Date().toISOString(),
            },
          })
          .eq("user_id", tutorId);
      } else {
        console.error("🚨 Tutor acceptance email failed for", tutorId, "error" in result ? result.error : result);
      }
    } else {
      console.warn("⚠️ Tutor acceptance email skipped; missing profile email for", tutorId);
    }
  }

  revalidateTutorAdminPaths(tutorId);
  return { success: true };
}

export async function awardVerifiedBadge(tutorId: string) {
  const context = await requireAdminContext();
  if ("error" in context) return { error: context.error };

  const { data: tutor, error: fetchError } = await context.adminClient
    .from("tutors")
    .select("verification_checklist, background_check_type, background_check_status")
    .eq("id", tutorId)
    .maybeSingle();

  if (fetchError || !tutor) return { error: fetchError?.message || "Tutor not found" };
  if (!canAwardVerifiedBadge(tutor)) {
    return { error: "Complete identity, qualifications, safeguarding, profile, and background clearance checks before awarding Verified Tutor." };
  }
  const checklist = {
    ...DEFAULT_CHECKLIST,
    ...(isRecord(tutor.verification_checklist) ? tutor.verification_checklist : {}),
    identity_verified: true,
    qualifications_reviewed: true,
    background_check_approved: tutor.background_check_type === "not_required" ? false : true,
    profile_completed: true,
  };

  const { error } = await context.adminClient
    .from("tutors")
    .update({
      is_verified: true,
      is_publicly_listed: true,
      tutor_status: "verified",
      verified_at: new Date().toISOString(),
      verified_by_admin_id: context.user.id,
      verification_checklist: checklist,
      background_check_status: tutor.background_check_type === "not_required" ? "approved" : "approved",
    })
    .eq("id", tutorId);

  if (error) return { error: error.message };
  revalidateTutorAdminPaths(tutorId);
  return { success: true };
}

export async function removeVerifiedBadge(tutorId: string) {
  const context = await requireAdminContext();
  if ("error" in context) return { error: context.error };

  const { error } = await context.adminClient
    .from("tutors")
    .update({
      is_verified: false,
      tutor_status: "approved_listed",
      verified_at: null,
      verified_by_admin_id: null,
    })
    .eq("id", tutorId);

  if (error) return { error: error.message };
  revalidateTutorAdminPaths(tutorId);
  return { success: true };
}

export async function rejectTutor(tutorId: string) {
  const context = await requireAdminContext();
  if ("error" in context) return { error: context.error };

  const { error } = await context.adminClient
    .from("tutors")
    .update({ tutor_status: "rejected", is_publicly_listed: false, is_verified: false, is_featured: false })
    .eq("id", tutorId);

  await context.adminClient.from("applications").update({ status: "rejected" }).eq("user_id", tutorId);
  if (error) return { error: error.message };
  revalidateTutorAdminPaths(tutorId);
  return { success: true };
}

export async function suspendTutor(tutorId: string) {
  const context = await requireAdminContext();
  if ("error" in context) return { error: context.error };

  const { error } = await context.adminClient
    .from("tutors")
    .update({ tutor_status: "suspended", is_publicly_listed: false, is_featured: false })
    .eq("id", tutorId);

  if (error) return { error: error.message };
  revalidateTutorAdminPaths(tutorId);
  return { success: true };
}

export async function toggleTutorFeature(tutorId: string, isFeatured: boolean) {
  const context = await requireAdminContext();
  if ("error" in context) return { error: context.error };

  const { data: tutor } = await context.adminClient
    .from("tutors")
    .select("is_verified")
    .eq("id", tutorId)
    .maybeSingle();

  const { error } = await context.adminClient
    .from("tutors")
    .update({
      is_featured: !isFeatured,
      tutor_status: !isFeatured ? "featured" : tutor?.is_verified ? "verified" : "approved_listed",
      is_publicly_listed: true,
    })
    .eq("id", tutorId);

  if (error) return { error: error.message };
  revalidateTutorAdminPaths(tutorId);
  return { success: true };
}

export async function updateTutorVerificationChecklist(
  tutorId: string,
  checklist: Record<string, boolean>,
  background: { type?: "dbs" | "police_clearance" | "not_required" | null; status?: "not_started" | "submitted" | "approved" | "rejected" } = {},
) {
  const context = await requireAdminContext();
  if ("error" in context) return { error: context.error };

  const { error } = await context.adminClient
    .from("tutors")
    .update({
      verification_checklist: checklist,
      background_check_type: background.type ?? null,
      background_check_status: background.status || "not_started",
    })
    .eq("id", tutorId);

  if (error) return { error: error.message };
  revalidateTutorAdminPaths(tutorId);
  return { success: true };
}

export async function toggleTutorVerification(tutorId: string, currentStatus: boolean) {
  return currentStatus ? removeVerifiedBadge(tutorId) : awardVerifiedBadge(tutorId);
}

export async function updateTutorStatus(tutorId: string, action: "approve" | "verify" | "remove_verified" | "reject" | "suspend" | "feature" | "unfeature") {
  if (action === "approve") return approveTutorForListing(tutorId);
  if (action === "verify") return awardVerifiedBadge(tutorId);
  if (action === "remove_verified") return removeVerifiedBadge(tutorId);
  if (action === "reject") return rejectTutor(tutorId);
  if (action === "suspend") return suspendTutor(tutorId);
  if (action === "feature") return toggleTutorFeature(tutorId, false);
  if (action === "unfeature") return toggleTutorFeature(tutorId, true);
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
