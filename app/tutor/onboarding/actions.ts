"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function saveApplicationStage(stage: number, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to apply.");
  }

  // UPSERT the application record incrementally
  const updateData: any = {};

  if (stage === 1) {
    updateData.user_type = formData.get("user_type") as string;
    updateData.university = formData.get("university") as string;
    updateData.year_of_study = formData.get("year_of_study") as string;
    updateData.top_grades = formData.get("top_grades") as string;
    updateData.current_company = formData.get("current_company") as string;
    updateData.years_experience = formData.get("years_experience") as string;
    updateData.industry_skillset = formData.get("industry_skillset") as string;
    updateData.timezone = formData.get("timezone") as string;
  }

  if (stage === 2) {
    updateData.youtube_url = formData.get("youtube_url") as string;
    const stylesStr = formData.get("teaching_styles") as string;
    updateData.teaching_styles = stylesStr ? stylesStr.split(",").map(s => s.trim()) : [];
    updateData.teaching_philosophy = formData.get("teaching_philosophy") as string;
  }

  if (stage === 3) {
    const gdprConsent = formData.get("gdpr_consent") === "true";
    if (!gdprConsent) throw new Error("Consent is required to process your application.");
    
    updateData.consent_timestamp = new Date().toISOString();
    updateData.status = 'pending'; // Ready for review!
    updateData.onboarding_status = 'pending_review';
  }

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

