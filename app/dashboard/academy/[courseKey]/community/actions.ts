"use server";
import { requirePilotEnrollment } from "@/lib/course-pilot";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function saveLearnerWork(
  key: string,
  kind: "note" | "post" | "report" | "review",
  form: FormData,
) {
  const { supabase, user, course } = await requirePilotEnrollment(key);
  const slug = String(form.get("lesson") || "");
  const body = String(form.get("body") || "").trim();
  const parent = String(form.get("parent") || "");
  const target = String(form.get("post") || "");
  const path = `/dashboard/academy/${key}/community`;
  let failed = false;
  if (kind === "note") {
    if (body.length > 10000) failed = true;
    else {
      const { error } = await supabase
        .from("course_pilot_notes")
        .upsert(
          { course_id: course.id, user_id: user.id, lesson_slug: slug, body },
          { onConflict: "course_id,user_id,lesson_slug" },
        );
      failed = Boolean(error);
    }
  } else if (kind === "post") {
    if (!body || body.length > 4000 || (parent && !uuid.test(parent)))
      failed = true;
    else {
      const { error } = await supabase.rpc("course_pilot_post", {
        target: course.id,
        message: body,
        slug,
        reply_to: parent || null,
      });
      failed = Boolean(error);
    }
  } else if (kind === "report") {
    if (!uuid.test(target) || !body || body.length > 1000) failed = true;
    else {
      // Bind report target to the authorized course, not a forged hidden form value.
      const { data: post, error: scopeError } = await supabase
        .from("course_pilot_posts")
        .select("id")
        .eq("id", target)
        .eq("course_id", course.id)
        .maybeSingle();
      if (scopeError || !post) failed = true;
      else {
        const { error } = await supabase.rpc("course_pilot_report", {
          target_post: target,
          report_reason: body,
        });
        failed = Boolean(error);
      }
    }
  } else if (kind === "review") {
    const stars = Number(form.get("rating"));
    if (
      !Number.isInteger(stars) ||
      stars < 1 ||
      stars > 5 ||
      body.length > 2000
    )
      failed = true;
    else {
      const { error } = await supabase.rpc("course_pilot_review", {
        target: course.id,
        stars,
        review_body: body,
      });
      failed = Boolean(error);
    }
  } else throw new Error("Invalid action");
  if (failed)
    redirect(`${path}?message=failed&lesson=${encodeURIComponent(slug)}`);
  revalidatePath(path);
  revalidatePath(`/courses/${key}`);
  redirect(
    `${path}?message=${kind === "report" ? "reported" : "saved"}&lesson=${encodeURIComponent(slug)}`,
  );
}
