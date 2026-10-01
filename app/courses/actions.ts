"use server";
import { requirePilotUser } from "@/lib/course-pilot";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function joinPilotCourse(key: string, waitlistOnly: boolean) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key))
    throw new Error("Invalid course");
  const { supabase } = await requirePilotUser(`/courses/${key}`);
  const { data, error } = await supabase.rpc("course_pilot_join", {
    target_key: key,
    waitlist_only: waitlistOnly,
  });
  if (error || !["enrolled", "waitlisted"].includes(data)) {
    console.error("[course-pilot] Enrollment failed:", error?.message);
    redirect(`/courses/${key}?message=join-failed`);
  }
  revalidatePath("/courses");
  revalidatePath(`/courses/${key}`);
  revalidatePath("/dashboard/academy");
  redirect(
    data === "enrolled"
      ? `/dashboard/academy/${key}`
      : `/courses/${key}?message=waitlisted`,
  );
}
