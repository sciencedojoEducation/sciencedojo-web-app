"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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
    // Also set the tutor as verified, live in the public marketplace, AND migrate the vetted data!
    await supabase
      .from("tutors")
      .update({ 
        is_verified: true,
        university: appData.university,
        subjects: appData.subjects,
        youtube_intro_url: appData.youtube_url,
      })
      .eq('id', user.id);
    
    // Update name in profiles
    await supabase
      .from("profiles")
      .update({ full_name: appData.full_name })
      .eq('id', user.id);
  } else {
    // Failsafe
    const { error: tutorError } = await supabase
      .from("tutors")
      .update({ is_verified: true })
      .eq('id', user.id);
    if (tutorError) throw new Error("Failed to activate public tutor profile.");
  }

  revalidatePath("/dashboard/tutor");
  redirect("/dashboard/tutor");
}
