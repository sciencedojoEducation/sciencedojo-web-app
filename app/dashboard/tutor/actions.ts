"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}

export async function markTutorWelcomeSeen() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "tutor") {
    return { error: "Unauthorized" };
  }

  const { data: application, error: fetchError } = await supabase
    .from("applications")
    .select("data")
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError) {
    console.error("Failed to fetch tutor application welcome state:", fetchError.message);
    return { error: "Could not update welcome state" };
  }

  const currentData = asRecord(application?.data);
  const { error } = await supabase
    .from("applications")
    .update({
      data: {
        ...currentData,
        tutor_welcome_seen_at: new Date().toISOString(),
      },
    })
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to update tutor welcome state:", error.message);
    return { error: "Could not update welcome state" };
  }

  revalidatePath("/dashboard/tutor");
  return { success: true };
}
