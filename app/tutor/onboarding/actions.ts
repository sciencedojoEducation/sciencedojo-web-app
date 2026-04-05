"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Automated scoring based on tutor input
 */
function calculateAutomatedScore(data: any): number {
  let score = 0;
  
  // Experience points
  if (data.years_experience === "5+ Years") score += 20;
  else if (data.years_experience === "3-5 Years") score += 15;
  else if (data.years_experience === "1-2 Years") score += 10;

  // Level of instruction
  if (data.levels?.includes("University")) score += 15;
  if (data.levels?.includes("A-Level") || data.levels?.includes("IB")) score += 10;

  // Success story points (length based heuristic for MVP)
  if (data.success_story?.length > 100) score += 10;

  // Tech points
  if (data.has_mic === "true" && data.has_camera === "true") score += 10;

  return score;
}

export async function saveApplicationStage(stage: number, dataPayload: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to apply.");
  }

  // UPSERT the application record incrementally
  const updateData: any = {};
  
  // Get existing data if any
  const { data: existingApp } = await supabase
    .from("applications")
    .select("data")
    .eq("user_id", user.id)
    .single();
    
  const currentData = existingApp?.data || {};
  
  // Check if dataPayload is a FormData object, if so parse it to object (for fallback)
  let payloadObject = dataPayload;
  if (dataPayload instanceof FormData) {
    payloadObject = Object.fromEntries(dataPayload.entries());
  }

  const newData: any = { ...currentData, ...payloadObject };

  // Track progress stage
  newData.current_stage = stage + 1;

  updateData.data = newData;

  // Synchronize critical top-level columns from the JSONB blob to satisfy DB constraints
  if (newData.full_name) updateData.full_name = newData.full_name;
  if (newData.university) updateData.university = newData.university;
  if (newData.user_type) updateData.user_type = newData.user_type;

  // Logic based on Stage Completion
  if (stage === 1) {
    // Knockout Logic: Online tutoring is mandatory
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
    newData.onboarding_status = 'demo_submitted';
  }

  if (stage === 6) {
    const gdprAccepted = String(newData.gdpr_accepted) === "true";
    const termsAccepted = String(newData.terms_accepted) === "true";
    if (!gdprAccepted || !termsAccepted) throw new Error("Both agreements must be accepted to finalize calibration.");
    
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

    // Ensure tutor row exists
    await supabase.from('tutors').upsert({
      id: user.id,
      is_verified: false,
      is_available_now: true,
      bio: '',
      hourly_rate: 0
    }, { onConflict: 'id' });
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

  const subjects = subjectsStr ? subjectsStr.split(",").map(s => s.trim()).filter(Boolean) : [];

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

export async function generatePrivateUploadUrl(fileName: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Create signed URL for direct client upload (or we can just upload directly heavily relying on RLS)
  // Since we have RLS policies set to bucket_id = 'private_docs' AND auth.uid()::text = foldername,
  // the client using Supabase JS with their session can just upload directly to `user.id/fileName`!
  // No server action needed for the upload itself.
  return { folderPath: `${user.id}` };
}

