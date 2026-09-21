"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { academySlugify, validateAcademyCourse } from "@/lib/academy-course-validation";
import type { AcademyCourse } from "@/lib/tutor-academy";

export type AcademyAdminActionResult = {
  ok: boolean;
  message: string;
  courseKey?: string;
  courseId?: string;
  errors?: string[];
};

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must sign in as an administrator.");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin" && user.user_metadata?.role !== "admin") throw new Error("Administrator access is required.");
  return { supabase, user };
}

function cleanCourse(course: AcademyCourse): AcademyCourse {
  return JSON.parse(JSON.stringify({
    ...course,
    id: undefined,
    versionId: undefined,
    key: academySlugify(course.key),
    estimatedMinutes: Number(course.estimatedMinutes),
    passMark: Number(course.passMark || 80),
    quizRevision: Number(course.quizRevision || 1),
  })) as AcademyCourse;
}

async function persistDraft(course: AcademyCourse) {
  const { supabase, user } = await requireAdmin();
  const cleaned = cleanCourse(course);
  const validation = validateAcademyCourse(cleaned);
  if (!validation.valid) return { result: { ok: false, message: "Fix the highlighted course issues before saving.", errors: validation.errors } satisfies AcademyAdminActionResult };

  const values = {
    course_key: cleaned.key,
    title: cleaned.title,
    audience_roles: cleaned.audienceRoles,
    draft_content: cleaned,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  };

  const stableKeyValues = {
    title: values.title,
    audience_roles: values.audience_roles,
    draft_content: values.draft_content,
    updated_by: values.updated_by,
    updated_at: values.updated_at,
  };
  const query = course.id
    ? supabase.from("academy_courses").update(stableKeyValues).eq("id", course.id).select("id, course_key").single()
    : supabase.from("academy_courses").insert({ ...values, created_by: user.id, status: "draft" }).select("id, course_key").single();
  const { data, error } = await query;
  if (error) return { result: { ok: false, message: error.code === "23505" ? "That course key is already in use." : error.message } satisfies AcademyAdminActionResult };
  return { supabase, user, cleaned, data, result: { ok: true, message: "Draft saved.", courseId: data.id, courseKey: data.course_key } satisfies AcademyAdminActionResult };
}

export async function saveAcademyCourseDraft(course: AcademyCourse): Promise<AcademyAdminActionResult> {
  try {
    const saved = await persistDraft(course);
    if (!saved.result.ok) return saved.result;
    revalidatePath("/dashboard/admin/academy", "layout");
    return saved.result;
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Draft could not be saved." };
  }
}

export async function publishAcademyCourse(course: AcademyCourse): Promise<AcademyAdminActionResult> {
  try {
    const saved = await persistDraft(course);
    if (!saved.result.ok || !saved.supabase || !saved.data) return saved.result;
    const { error } = await saved.supabase.rpc("publish_academy_course", { target_course_id: saved.data.id });
    if (error) return { ok: false, message: error.message };
    revalidatePath("/dashboard/admin/academy", "layout");
    revalidatePath("/dashboard/tutor/academy", "layout");
    return { ok: true, message: "Course published successfully.", courseId: saved.data.id, courseKey: saved.data.course_key };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Course could not be published." };
  }
}

export async function archiveAcademyCourse(courseId: string): Promise<AcademyAdminActionResult> {
  try {
    const { supabase, user } = await requireAdmin();
    const { error } = await supabase.from("academy_courses").update({ status: "archived", archived_at: new Date().toISOString(), updated_at: new Date().toISOString(), updated_by: user.id }).eq("id", courseId);
    if (error) return { ok: false, message: error.message };
    revalidatePath("/dashboard/admin/academy", "layout");
    revalidatePath("/dashboard/tutor/academy", "layout");
    return { ok: true, message: "Course archived." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Course could not be archived." };
  }
}

export async function duplicateAcademyCourse(course: AcademyCourse): Promise<AcademyAdminActionResult> {
  const copy: AcademyCourse = {
    ...course,
    id: undefined,
    versionId: undefined,
    key: `${academySlugify(course.key)}-copy-${crypto.randomUUID().slice(0, 5)}`,
    title: `${course.title} (Copy)`,
    quizRevision: 1,
  };
  return saveAcademyCourseDraft(copy);
}

export async function discardAcademyDraft(courseId: string): Promise<AcademyAdminActionResult> {
  try {
    const { supabase, user } = await requireAdmin();
    const { data: course, error: courseError } = await supabase.from("academy_courses").select("published_version_id").eq("id", courseId).single();
    if (courseError || !course?.published_version_id) return { ok: false, message: "This course has no published version to restore." };
    const { data: version, error: versionError } = await supabase.from("academy_course_versions").select("content").eq("id", course.published_version_id).single();
    if (versionError || !version?.content) return { ok: false, message: "Published content could not be loaded." };
    const published = version.content as AcademyCourse;
    const { error } = await supabase.from("academy_courses").update({ draft_content: published, title: published.title, audience_roles: published.audienceRoles, updated_by: user.id, updated_at: new Date().toISOString() }).eq("id", courseId);
    if (error) return { ok: false, message: error.message };
    revalidatePath("/dashboard/admin/academy", "layout");
    return { ok: true, message: "Draft restored to the published version." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Draft could not be restored." };
  }
}

export async function uploadAcademyMedia(formData: FormData): Promise<AcademyAdminActionResult & { url?: string }> {
  try {
    await requireAdmin();
    const file = formData.get("file");
    if (!(file instanceof File)) return { ok: false, message: "Choose an image to upload." };
    const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
    if (!allowed.has(file.type)) return { ok: false, message: "Use a JPG, PNG, WebP, or GIF image." };
    if (file.size > 5 * 1024 * 1024) return { ok: false, message: "Images must be 5 MB or smaller." };
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `courses/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const admin = createAdminClient();
    const { error } = await admin.storage.from("academy-media").upload(path, file, { contentType: file.type, upsert: false });
    if (error) return { ok: false, message: error.message };
    const { data } = admin.storage.from("academy-media").getPublicUrl(path);
    return { ok: true, message: "Image uploaded.", url: data.publicUrl };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Image could not be uploaded." };
  }
}

export async function deleteAcademyMedia(path: string, publicUrl: string): Promise<AcademyAdminActionResult> {
  try {
    await requireAdmin();
    if (!path.startsWith("courses/") || path.includes("..")) return { ok: false, message: "Invalid media path." };
    const admin = createAdminClient();
    const [{ data: courses }, { data: versions }] = await Promise.all([
      admin.from("academy_courses").select("draft_content"),
      admin.from("academy_course_versions").select("content"),
    ]);
    const inUse = [...(courses || []).map((row) => row.draft_content), ...(versions || []).map((row) => row.content)].some((content) => JSON.stringify(content).includes(publicUrl));
    if (inUse) return { ok: false, message: "This image is used by a course and cannot be removed." };
    const { error } = await admin.storage.from("academy-media").remove([path]);
    if (error) return { ok: false, message: error.message };
    revalidatePath("/dashboard/admin/academy", "layout");
    return { ok: true, message: "Unused image removed." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Image could not be removed." };
  }
}
