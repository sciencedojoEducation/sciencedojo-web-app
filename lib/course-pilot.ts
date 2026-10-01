import "server-only";
import { createClient } from "@/utils/supabase/server";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { notFound, redirect } from "next/navigation";

export type PilotCourse = {
  id: string;
  key: string;
  title: string;
  description: string;
  heroImage: string | null;
  estimatedMinutes: number;
  outcomes: string;
  prerequisites: string;
  curriculum: { title: string }[];
  placesRemaining: number;
  reviews: { rating: number; body: string; name: string }[];
};
export async function requirePilotEnabled() {
  if (!(await isFeatureEnabled("course_pilot_enabled"))) notFound();
}
export async function getPilotCatalog(key?: string): Promise<PilotCourse[]> {
  await requirePilotEnabled();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("course_pilot_catalog", {
    target_key: key || null,
  });
  if (error) throw new Error("Unable to load courses. Please try again later.");
  return (data || []) as PilotCourse[];
}
export async function requirePilotUser(next: string) {
  await requirePilotEnabled();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  const { data: active, error } = await supabase.rpc("course_pilot_active");
  if (error || !active)
    throw new Error(
      "Please verify your email and use an active ScienceDojo account.",
    );
  return { supabase, user };
}
export async function requirePilotAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: allowed, error } = await supabase.rpc("course_pilot_admin");
  if (error || !allowed) notFound();
  return { supabase, user };
}
export async function requirePilotEnrollment(key: string) {
  const { supabase, user } = await requirePilotUser(
    `/dashboard/academy/${key}/community`,
  );
  const { data: course, error } = await supabase
    .from("academy_courses")
    .select("id,course_key,title")
    .eq("course_key", key)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw new Error("Unable to load course.");
  if (!course) notFound();
  const { data: enrolled, error: accessError } = await supabase.rpc(
    "course_pilot_enrolled",
    { target: course.id },
  );
  if (accessError) throw new Error("Unable to check enrollment.");
  if (!enrolled) redirect(`/courses/${key}`);
  return { supabase, user, course };
}
