"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getMeaningfulTutorSubjects } from "@/lib/tutors/subjects";

export async function acceptCodeOfConduct() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Update application status
  const { error: appError } = await supabase
    .from("applications")
    .update({ status: 'approved' })
    .eq('user_id', user.id);

  if (appError) throw new Error("Failed to update application status.");

  // Fetch the vetted application
  const { data: appData } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (appData) {
    const subjects = getMeaningfulTutorSubjects(appData.subjects);
    const { data: existingTutor } = await supabase
      .from("tutors")
      .select("verification_checklist")
      .eq("id", user.id)
      .maybeSingle();
    const existingChecklist =
      existingTutor?.verification_checklist &&
      typeof existingTutor.verification_checklist === "object" &&
      !Array.isArray(existingTutor.verification_checklist)
        ? existingTutor.verification_checklist
        : {};
    const tutorUpdate: Record<string, unknown> = {
      verification_checklist: {
        ...existingChecklist,
        safeguarding_accepted: true,
        profile_completed: true,
      },
      university: appData.university,
      youtube_intro_url: appData.youtube_url,
    };

    if (subjects.length > 0) {
      tutorUpdate.subjects = subjects;
    }

    // Store conduct/profile readiness without awarding the Verified Tutor badge.
    await supabase
      .from("tutors")
      .update(tutorUpdate)
      .eq('id', user.id);
    
    // Update name in profiles
    await supabase
      .from("profiles")
      .update({ full_name: appData.full_name })
      .eq('id', user.id);
  } else {
    // Failsafe
    const { data: existingTutor } = await supabase
      .from("tutors")
      .select("verification_checklist")
      .eq("id", user.id)
      .maybeSingle();
    const existingChecklist =
      existingTutor?.verification_checklist &&
      typeof existingTutor.verification_checklist === "object" &&
      !Array.isArray(existingTutor.verification_checklist)
        ? existingTutor.verification_checklist
        : {};
    const { error: tutorError } = await supabase
      .from("tutors")
      .update({
        verification_checklist: {
          ...existingChecklist,
          safeguarding_accepted: true,
          profile_completed: true,
        },
      })
      .eq('id', user.id);
    if (tutorError) throw new Error("Failed to activate public tutor profile.");
  }

  revalidatePath("/dashboard/tutor");
  redirect("/dashboard/tutor");
}
