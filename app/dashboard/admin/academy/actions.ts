"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  academySlugify,
  validateAcademyCourse,
} from "@/lib/academy-course-validation";
import {
  getAssessmentFingerprint,
  requireAcademyAdmin,
  sanitizeAcademyCourse,
} from "@/lib/academy-authoring";
import type { AcademyCourse } from "@/lib/tutor-academy";

export type AcademyAdminActionResult = {
  ok: boolean;
  message: string;
  courseKey?: string;
  courseId?: string;
  errors?: string[];
  revision?: number;
};

async function requireAdmin() {
  return requireAcademyAdmin();
}

function cleanCourse(course: AcademyCourse): AcademyCourse {
  return sanitizeAcademyCourse(course);
}

async function persistDraft(course: AcademyCourse, requirePublishable = false) {
  const { supabase, user } = await requireAdmin();
  const cleaned = cleanCourse(course);
  const validation = validateAcademyCourse(cleaned);
  if (requirePublishable && !validation.valid)
    return {
      result: {
        ok: false,
        message: "Fix the highlighted course issues before saving.",
        errors: validation.errors,
      } satisfies AcademyAdminActionResult,
    };

  const values = {
    course_key: cleaned.key,
    title: cleaned.title,
    audience_roles: cleaned.audienceRoles,
    draft_content: cleaned,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
    autosaved_at: new Date().toISOString(),
    schema_version: cleaned.schemaVersion || 2,
  };

  const stableKeyValues = {
    title: values.title,
    audience_roles: values.audience_roles,
    draft_content: values.draft_content,
    updated_by: values.updated_by,
    updated_at: values.updated_at,
    autosaved_at: values.autosaved_at,
    schema_version: values.schema_version,
  };
  const query = course.id
    ? supabase
        .from("academy_courses")
        .update(stableKeyValues)
        .eq("id", course.id)
        .select("id, course_key")
        .single()
    : supabase
        .from("academy_courses")
        .insert({ ...values, created_by: user.id, status: "draft" })
        .select("id, course_key")
        .single();
  const { data, error } = await query;
  if (error)
    return {
      result: {
        ok: false,
        message:
          error.code === "23505"
            ? "That course key is already in use."
            : error.message,
      } satisfies AcademyAdminActionResult,
    };
  return {
    supabase,
    user,
    cleaned,
    data,
    result: {
      ok: true,
      message: "Draft saved.",
      courseId: data.id,
      courseKey: data.course_key,
    } satisfies AcademyAdminActionResult,
  };
}

export async function saveAcademyCourseDraft(
  course: AcademyCourse,
): Promise<AcademyAdminActionResult> {
  try {
    const saved = await persistDraft(course);
    if (!saved.result.ok) return saved.result;
    revalidatePath("/dashboard/admin/academy", "layout");
    return saved.result;
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Draft could not be saved.",
    };
  }
}

export async function publishAcademyCourse(
  course: AcademyCourse,
): Promise<AcademyAdminActionResult> {
  try {
    const saved = await persistDraft(course, true);
    if (!saved.result.ok || !saved.supabase || !saved.data) return saved.result;
    const { error } = await saved.supabase.rpc("publish_academy_course", {
      target_course_id: saved.data.id,
    });
    if (error) return { ok: false, message: error.message };
    revalidatePath("/dashboard/admin/academy", "layout");
    revalidatePath("/dashboard/tutor/academy", "layout");
    return {
      ok: true,
      message: "Course published successfully.",
      courseId: saved.data.id,
      courseKey: saved.data.course_key,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Course could not be published.",
    };
  }
}

export async function publishAcademyCourseV2(
  courseId: string,
  expectedRevision: number,
): Promise<AcademyAdminActionResult> {
  try {
    const { supabase } = await requireAcademyAdmin();
    const { data: row, error: loadError } = await supabase
      .from("academy_courses")
      .select("draft_content, draft_revision")
      .eq("id", courseId)
      .single();
    if (loadError || !row)
      return { ok: false, message: loadError?.message || "Course not found." };
    if (Number(row.draft_revision) !== expectedRevision)
      return {
        ok: false,
        message: "A newer saved draft exists. Reload before publishing.",
        revision: Number(row.draft_revision),
      };
    const course = sanitizeAcademyCourse(row.draft_content as AcademyCourse);
    const validation = validateAcademyCourse(course);
    if (!validation.valid)
      return {
        ok: false,
        message: "Fix the course issues before publishing.",
        errors: validation.errors,
      };
    const { error } = await supabase.rpc("publish_academy_course_v2", {
      target_course_id: courseId,
      expected_revision: expectedRevision,
      next_assessment_fingerprint: getAssessmentFingerprint(course),
    });
    if (error) return { ok: false, message: error.message };
    revalidatePath("/dashboard/admin/academy", "layout");
    revalidatePath("/dashboard/academy", "layout");
    revalidatePath("/dashboard/tutor/academy", "layout");
    return {
      ok: true,
      message: "Course published successfully.",
      courseId,
      courseKey: course.key,
      revision: expectedRevision,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Course could not be published.",
    };
  }
}

export async function restoreAcademySnapshot(
  courseId: string,
  snapshotId: string,
  expectedRevision: number,
): Promise<AcademyAdminActionResult> {
  try {
    const { supabase } = await requireAcademyAdmin();
    const { data: snapshot, error: snapshotError } = await supabase
      .from("academy_course_snapshots")
      .select("content")
      .eq("id", snapshotId)
      .eq("course_id", courseId)
      .single();
    if (snapshotError || !snapshot)
      return { ok: false, message: "Snapshot could not be loaded." };
    const document = sanitizeAcademyCourse(snapshot.content as AcademyCourse);
    const { data, error } = await supabase.rpc("save_academy_course_draft_v2", {
      target_course_id: courseId,
      expected_revision: expectedRevision,
      next_content: document,
      next_title: document.title,
      next_audiences: document.audienceRoles || [],
      save_reason: "restore",
    });
    if (error) return { ok: false, message: error.message };
    const result = Array.isArray(data) ? data[0] : data;
    revalidatePath("/dashboard/admin/academy", "layout");
    return {
      ok: true,
      message: "Snapshot restored as a new draft.",
      revision: Number(result?.revision || expectedRevision + 1),
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Snapshot could not be restored.",
    };
  }
}

export async function discardAcademyDraftV2(
  courseId: string,
  expectedRevision: number,
): Promise<AcademyAdminActionResult> {
  try {
    const { supabase } = await requireAcademyAdmin();
    const { data: course, error: courseError } = await supabase
      .from("academy_courses")
      .select("published_version_id")
      .eq("id", courseId)
      .single();
    if (courseError || !course?.published_version_id)
      return {
        ok: false,
        message: "This course has no published version to restore.",
      };
    const { data: version, error: versionError } = await supabase
      .from("academy_course_versions")
      .select("content")
      .eq("id", course.published_version_id)
      .single();
    if (versionError || !version?.content)
      return { ok: false, message: "Published content could not be loaded." };
    const document = sanitizeAcademyCourse(version.content as AcademyCourse);
    const { data, error } = await supabase.rpc("save_academy_course_draft_v2", {
      target_course_id: courseId,
      expected_revision: expectedRevision,
      next_content: document,
      next_title: document.title,
      next_audiences: document.audienceRoles || [],
      save_reason: "restore",
    });
    if (error) return { ok: false, message: error.message };
    const result = Array.isArray(data) ? data[0] : data;
    revalidatePath("/dashboard/admin/academy", "layout");
    return {
      ok: true,
      message: "Draft reset to the published version.",
      revision: Number(result?.revision || expectedRevision + 1),
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Draft could not be discarded.",
    };
  }
}

export async function archiveAcademyCourse(
  courseId: string,
): Promise<AcademyAdminActionResult> {
  try {
    const { supabase, user } = await requireAdmin();
    const { error } = await supabase
      .from("academy_courses")
      .update({
        status: "archived",
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq("id", courseId);
    if (error) return { ok: false, message: error.message };
    revalidatePath("/dashboard/admin/academy", "layout");
    revalidatePath("/dashboard/tutor/academy", "layout");
    return { ok: true, message: "Course archived." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Course could not be archived.",
    };
  }
}

export async function duplicateAcademyCourse(
  course: AcademyCourse,
): Promise<AcademyAdminActionResult> {
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

export async function discardAcademyDraft(
  courseId: string,
): Promise<AcademyAdminActionResult> {
  try {
    const { supabase, user } = await requireAdmin();
    const { data: course, error: courseError } = await supabase
      .from("academy_courses")
      .select("published_version_id")
      .eq("id", courseId)
      .single();
    if (courseError || !course?.published_version_id)
      return {
        ok: false,
        message: "This course has no published version to restore.",
      };
    const { data: version, error: versionError } = await supabase
      .from("academy_course_versions")
      .select("content")
      .eq("id", course.published_version_id)
      .single();
    if (versionError || !version?.content)
      return { ok: false, message: "Published content could not be loaded." };
    const published = version.content as AcademyCourse;
    const { error } = await supabase
      .from("academy_courses")
      .update({
        draft_content: published,
        title: published.title,
        audience_roles: published.audienceRoles,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", courseId);
    if (error) return { ok: false, message: error.message };
    revalidatePath("/dashboard/admin/academy", "layout");
    return { ok: true, message: "Draft restored to the published version." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Draft could not be restored.",
    };
  }
}

export async function uploadAcademyMedia(
  formData: FormData,
): Promise<AcademyAdminActionResult & { url?: string }> {
  try {
    const { user } = await requireAdmin();
    const file = formData.get("file");
    if (!(file instanceof File))
      return { ok: false, message: "Choose an image to upload." };
    const allowed = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
    ]);
    if (!allowed.has(file.type))
      return { ok: false, message: "Use a JPG, PNG, WebP, GIF, or PDF file." };
    const maxSize =
      file.type === "application/pdf" ? 20 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize)
      return {
        ok: false,
        message:
          file.type === "application/pdf"
            ? "PDFs must be 20 MB or smaller."
            : "Images must be 5 MB or smaller.",
      };
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `courses/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const admin = createAdminClient();
    const { error } = await admin.storage
      .from("academy-media")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) return { ok: false, message: error.message };
    const { data } = admin.storage.from("academy-media").getPublicUrl(path);
    await admin.from("academy_assets").insert({
      storage_path: path,
      public_url: data.publicUrl,
      media_type: file.type === "application/pdf" ? "document" : "image",
      mime_type: file.type,
      original_name: file.name,
      byte_size: file.size,
      created_by: user.id,
    });
    return {
      ok: true,
      message:
        file.type === "application/pdf"
          ? "Document uploaded."
          : "Image uploaded.",
      url: data.publicUrl,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Image could not be uploaded.",
    };
  }
}

export async function deleteAcademyMedia(
  path: string,
  publicUrl: string,
): Promise<AcademyAdminActionResult> {
  try {
    await requireAdmin();
    if (!path.startsWith("courses/") || path.includes(".."))
      return { ok: false, message: "Invalid media path." };
    const admin = createAdminClient();
    const [{ data: courses }, { data: versions }, { data: snapshots }] =
      await Promise.all([
        admin.from("academy_courses").select("draft_content"),
        admin.from("academy_course_versions").select("content"),
        admin.from("academy_course_snapshots").select("content"),
      ]);
    const inUse = [
      ...(courses || []).map((row) => row.draft_content),
      ...(versions || []).map((row) => row.content),
      ...(snapshots || []).map((row) => row.content),
    ].some((content) => JSON.stringify(content).includes(publicUrl));
    if (inUse)
      return {
        ok: false,
        message: "This image is used by a course and cannot be removed.",
      };
    const { error } = await admin.storage.from("academy-media").remove([path]);
    if (error) return { ok: false, message: error.message };
    await admin.from("academy_assets").delete().eq("storage_path", path);
    revalidatePath("/dashboard/admin/academy", "layout");
    return { ok: true, message: "Unused image removed." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Image could not be removed.",
    };
  }
}
