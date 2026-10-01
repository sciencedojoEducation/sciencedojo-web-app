"use server";
import { requirePilotAdmin } from "@/lib/course-pilot";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function managePilot(
  kind: "listing" | "promote" | "hide-post" | "hide-review",
  form: FormData,
) {
  const { supabase } = await requirePilotAdmin();
  const courseId = String(form.get("course") || "");
  if (!uuid.test(courseId)) throw new Error("Invalid course");
  let failed = false;
  if (kind === "listing") {
    const listed = form.get("listed") === "on";
    const outcomes = String(form.get("outcomes") || "").trim();
    const prerequisites = String(form.get("prerequisites") || "").trim();
    const { data: course, error } = await supabase
      .from("academy_courses")
      .select("status,published_version_id")
      .eq("id", courseId)
      .maybeSingle();
    if (
      error ||
      !course ||
      (listed &&
        (course.status !== "published" || !course.published_version_id)) ||
      outcomes.length > 10000 ||
      prerequisites.length > 10000
    )
      failed = true;
    else {
      const { error: writeError } = await supabase
        .from("course_pilot_listings")
        .upsert({ course_id: courseId, listed, outcomes, prerequisites });
      failed = Boolean(writeError);
    }
  } else if (kind === "promote") {
    const learner = String(form.get("learner") || "");
    if (!uuid.test(learner)) failed = true;
    else {
      const { error } = await supabase.rpc("course_pilot_promote", {
        target: courseId,
        learner,
      });
      failed = Boolean(error);
    }
  } else if (kind === "hide-post") {
    const post = String(form.get("post") || "");
    if (!uuid.test(post)) failed = true;
    else {
      const { data, error } = await supabase
        .from("course_pilot_posts")
        .update({ hidden: true })
        .eq("course_id", courseId)
        .eq("id", post)
        .select("id");
      failed = Boolean(error) || !data?.length;
    }
  } else if (kind === "hide-review") {
    const learner = String(form.get("learner") || "");
    if (!uuid.test(learner)) failed = true;
    else {
      const { data, error } = await supabase
        .from("course_pilot_reviews")
        .update({ hidden: true })
        .eq("course_id", courseId)
        .eq("user_id", learner)
        .select("user_id");
      failed = Boolean(error) || !data?.length;
    }
  } else throw new Error("Invalid action");
  if (failed) redirect("/dashboard/admin/course-pilot?message=failed");
  revalidatePath("/courses", "layout");
  revalidatePath("/dashboard/academy", "layout");
  revalidatePath("/dashboard/admin/course-pilot");
  redirect("/dashboard/admin/course-pilot?message=saved");
}
