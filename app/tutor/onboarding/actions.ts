"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMeaningfulTutorSubjects } from "@/lib/tutors/subjects";
import { sendTrackedEmail } from "@/lib/communications";

type ApplicationStageData = Record<string, unknown>;

function isRecord(value: unknown): value is ApplicationStageData {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Automated scoring based on tutor input
 */
function calculateAutomatedScore(data: ApplicationStageData): number {
  let score = 0;
  const yearsExperience = String(data.years_experience || "");
  const levels = String(data.levels || "");
  const successStory = String(data.success_story || "");
  
  // Experience points
  if (yearsExperience === "5+ Years") score += 20;
  else if (yearsExperience === "3-5 Years") score += 15;
  else if (yearsExperience === "1-2 Years") score += 10;

  // Level of instruction
  if (levels.includes("University")) score += 15;
  if (levels.includes("A-Level") || levels.includes("IB")) score += 10;

  // Success story points (length based heuristic for MVP)
  if (successStory.length > 100) score += 10;

  // Tech points
  if (data.has_mic === "true" && data.has_camera === "true") score += 10;

  return score;
}

export async function saveApplicationStage(
  stage: number,
  dataPayload: unknown,
  options: { advance?: boolean } = {}
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to apply.");
  }

  // UPSERT the application record incrementally
  const updateData: ApplicationStageData = {};
  
  // Get existing data if any
  const { data: existingApp } = await supabase
    .from("applications")
    .select("data")
    .eq("user_id", user.id)
    .single();
    
  const currentData = isRecord(existingApp?.data) ? existingApp.data : {};
  
  // Check if dataPayload is a FormData object, if so parse it to object (for fallback)
  let payloadObject: ApplicationStageData = isRecord(dataPayload) ? dataPayload : {};
  if (dataPayload instanceof FormData) {
    payloadObject = Object.fromEntries(dataPayload.entries());
  }

  const newData: ApplicationStageData = { ...currentData, ...payloadObject };

  const shouldAdvance = options.advance !== false;

  // Track progress stage. Draft saves persist data without moving the applicant forward.
  newData.current_stage = shouldAdvance
    ? stage + 1
    : Math.max(Number(currentData.current_stage || stage), stage);

  updateData.data = newData;

  // Synchronize critical top-level columns from the JSONB blob to satisfy DB constraints
  if (newData.full_name) updateData.full_name = newData.full_name;
  if (newData.university) updateData.university = newData.university;
  if (newData.user_type) updateData.user_type = newData.user_type;
  const meaningfulSubjects = getMeaningfulTutorSubjects(newData.subjects);
  if (meaningfulSubjects.length > 0) updateData.subjects = meaningfulSubjects;

  // Logic based on Stage Completion
  if (stage === 1) {
    // Online tutoring is mandatory for this application flow.
    if (newData.online_available === "false") {
      newData.is_knocked_out = true;
      newData.onboarding_status = 'rejected';
    } else {
      newData.onboarding_status = 'screening';
    }
    // Sync to top-level if mapping exists, otherwise JSONB handles it
    updateData.user_type = newData.user_type;
  }

  if (stage === 3) {
    // Scoring logic triggered after Style & Fit is completed
    newData.score = calculateAutomatedScore(newData);
  }

  if (stage === 4) {
    newData.onboarding_status = newData.demo_video_url ? 'demo_submitted' : 'demo_skipped';
  }

  if (stage === 6 && shouldAdvance) {
    const gdprAccepted = String(newData.gdpr_accepted) === "true";
    const termsAccepted = String(newData.terms_accepted) === "true";
    if (!gdprAccepted || !termsAccepted) throw new Error("Both agreements must be accepted to submit your application.");
    
    updateData.status = 'pending'; // Ready for final human review
    newData.onboarding_status = 'under_review';
    
    // Final check: Ensure they are marked as a tutor in metadata AND profiles table
    await supabase.auth.updateUser({
      data: { ...user.user_metadata, role: 'tutor' }
    });

    // CRITICAL: Sync role to profiles table (the single source of truth for dashboard)
    await supabase
      .from('profiles')
      .update({ role: 'tutor' })
      .eq('id', user.id);

    const tutorUpsert: Record<string, unknown> = {
      id: user.id,
      is_verified: false,
      tutor_status: 'under_review',
      is_publicly_listed: false,
      is_featured: false,
      background_check_status: newData.background_check_url ? 'submitted' : 'not_started',
      verification_checklist: {
        identity_verified: Boolean(newData.government_id_url),
        qualifications_uploaded: Array.isArray(newData.education)
          ? newData.education.some((entry) => isRecord(entry) && Boolean(entry.transcript_url))
          : false,
        qualifications_reviewed: false,
        references_submitted: false,
        references_checked: false,
        background_check_submitted: Boolean(newData.background_check_url),
        background_check_approved: false,
        safeguarding_accepted: termsAccepted,
        safeguarding_training_completed: false,
        interview_completed: false,
        teaching_demo_reviewed: false,
        profile_completed: true,
      },
      is_available_now: true,
      bio: '',
      hourly_rate: 0
    };

    if (meaningfulSubjects.length > 0) {
      tutorUpsert.subjects = meaningfulSubjects;
    }

    // Ensure tutor row exists
    await supabase.from('tutors').upsert(tutorUpsert, { onConflict: 'id' });
    if (user.email) {
      await sendTrackedEmail({
        userId: user.id,
        recipientEmail: user.email.toLowerCase(),
        recipientName: String(newData.full_name || user.user_metadata?.full_name || "Tutor"),
        category: "onboarding",
        audience: "tutor",
        templateKey: "application_submitted",
        dedupeHours: 720,
      });
    }
    // We store specific timestamps within the JSONB data object via VerificationStage
  }

  // Final sync of the JSONB blob
  updateData.data = newData;

  // Perform Upsert
  const { error } = await supabase
    .from("applications")
    .upsert(
      { user_id: user.id, ...updateData },
      { onConflict: 'user_id' }
    );

  if (error) {
    console.error(`Failed to save Stage ${stage}:`, error.message);
    throw new Error(`Database error: ${error.message}`);
  }

  revalidatePath("/tutor/onboarding");
  return { success: true };
}

export async function submitTutorApplication(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to apply.");
  }

  const bio = formData.get("bio") as string;
  const hourly_rate = formData.get("hourly_rate") as string;
  const subjectsStr = formData.get("subjects") as string;
  const education_level = formData.get("education_level") as string;
  const university = formData.get("university") as string;
  const experience_summary = formData.get("experience_summary") as string;
  const has_teaching_license = formData.get("has_teaching_license") === "on";
  const cv_url = formData.get("cv_url") as string;

  const subjects = getMeaningfulTutorSubjects(subjectsStr);

  const { error } = await supabase
    .from("applications")
    .upsert(
      { 
        user_id: user.id,
        bio,
        hourly_rate: Number(hourly_rate),
        subjects,
        education_level,
        university,
        experience_summary,
        has_teaching_license,
        cv_url,
        status: "pending"
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    console.error("Failed to submit tutor application:", error.message);
    throw new Error("Database error while submitting your application.");
  }

  revalidatePath("/tutor/onboarding");
  redirect("/dashboard/tutor");
}

export async function generatePrivateUploadUrl() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Create signed URL for direct client upload (or we can just upload directly heavily relying on RLS)
  // Since we have RLS policies set to bucket_id = 'private_docs' AND auth.uid()::text = foldername,
  // the client using Supabase JS with their session can just upload directly to `user.id/fileName`!
  // No server action needed for the upload itself.
  return { folderPath: `${user.id}` };
}
