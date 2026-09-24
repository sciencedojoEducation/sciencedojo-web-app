import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  TUTOR_ACADEMY_COURSE_KEY,
  tutorAcademyCourse,
  type AcademyAudienceRole,
  type AcademyCourse,
} from "@/lib/tutor-academy";
import {
  ACADEMY_DOCUMENT_SCHEMA_VERSION,
  migrateAcademyCourse,
} from "@/lib/academy-schema";

export type AcademyCourseStatus = "draft" | "published" | "archived";

export type AcademyCourseRecord = {
  id: string | null;
  courseKey: string;
  title: string;
  status: AcademyCourseStatus;
  audienceRoles: AcademyAudienceRole[];
  quizRevision: number;
  publishedVersionId: string | null;
  updatedAt: string | null;
  publishedAt: string | null;
  draftRevision: number;
  schemaVersion: number;
  autosavedAt: string | null;
  draft: AcademyCourse;
};

type CourseRow = {
  id: string;
  course_key: string;
  title: string;
  status: AcademyCourseStatus;
  audience_roles: AcademyAudienceRole[];
  draft_content: AcademyCourse;
  published_version_id: string | null;
  quiz_revision: number;
  updated_at: string;
  published_at: string | null;
  draft_revision?: number;
  schema_version?: number;
  autosaved_at?: string | null;
};

function staticFoundationsRecord(): AcademyCourseRecord {
  return {
    id: null,
    courseKey: tutorAcademyCourse.key,
    title: tutorAcademyCourse.title,
    status: "published",
    audienceRoles: tutorAcademyCourse.audienceRoles || [
      "tutor_applicant",
      "tutor",
    ],
    quizRevision: tutorAcademyCourse.quizRevision || 1,
    publishedVersionId: null,
    updatedAt: null,
    publishedAt: null,
    draftRevision: 1,
    schemaVersion: ACADEMY_DOCUMENT_SCHEMA_VERSION,
    autosavedAt: null,
    draft: migrateAcademyCourse(tutorAcademyCourse),
  };
}

function mapCourseRow(row: CourseRow): AcademyCourseRecord {
  return {
    id: row.id,
    courseKey: row.course_key,
    title: row.title,
    status: row.status,
    audienceRoles: row.audience_roles || [],
    quizRevision: row.quiz_revision || 1,
    publishedVersionId: row.published_version_id,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    draftRevision: Number(row.draft_revision || 1),
    schemaVersion: Number(row.schema_version || 1),
    autosavedAt: row.autosaved_at || null,
    draft: migrateAcademyCourse({
      ...row.draft_content,
      id: row.id,
      key: row.course_key,
      audienceRoles:
        row.audience_roles || row.draft_content.audienceRoles || [],
      quizRevision: row.quiz_revision || row.draft_content.quizRevision || 1,
    }),
  };
}

export async function getAdminAcademyCourses(): Promise<{
  courses: AcademyCourseRecord[];
  schemaReady: boolean;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("academy_courses")
    .select(
      "id, course_key, title, status, audience_roles, draft_content, published_version_id, quiz_revision, updated_at, published_at, draft_revision, schema_version, autosaved_at",
    )
    .order("updated_at", { ascending: false });

  if (error) {
    return { courses: [staticFoundationsRecord()], schemaReady: false };
  }

  const courses = (data || []).map((row) => mapCourseRow(row as CourseRow));
  if (!courses.some((course) => course.courseKey === TUTOR_ACADEMY_COURSE_KEY))
    courses.push(staticFoundationsRecord());
  return { courses, schemaReady: true };
}

export async function getAcademyCourseDraft(
  courseKey: string,
): Promise<AcademyCourseRecord | null> {
  const { courses } = await getAdminAcademyCourses();
  return courses.find((course) => course.courseKey === courseKey) || null;
}

export async function getPublishedAcademyCourse(
  courseKey: string,
): Promise<AcademyCourse | null> {
  const supabase = await createClient();
  const { data: courseRow, error } = await supabase
    .from("academy_courses")
    .select(
      "id, course_key, audience_roles, quiz_revision, published_version_id",
    )
    .eq("course_key", courseKey)
    .eq("status", "published")
    .maybeSingle();

  if (error || !courseRow?.published_version_id) {
    return courseKey === TUTOR_ACADEMY_COURSE_KEY
      ? migrateAcademyCourse(tutorAcademyCourse)
      : null;
  }

  const { data: version, error: versionError } = await supabase
    .from("academy_course_versions")
    .select("id, content, quiz_revision")
    .eq("id", courseRow.published_version_id)
    .maybeSingle();

  if (versionError || !version?.content) {
    return courseKey === TUTOR_ACADEMY_COURSE_KEY
      ? migrateAcademyCourse(tutorAcademyCourse)
      : null;
  }

  return migrateAcademyCourse({
    ...(version.content as AcademyCourse),
    id: courseRow.id,
    key: courseRow.course_key,
    audienceRoles: courseRow.audience_roles as AcademyAudienceRole[],
    quizRevision: Number(version.quiz_revision || courseRow.quiz_revision || 1),
    versionId: version.id,
  });
}

export async function getEligibleAcademyCourses(): Promise<AcademyCourse[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: profile }, { data: application }] = user
    ? await Promise.all([
        supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("applications")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle(),
      ])
    : [{ data: null }, { data: null }];
  const isTutor =
    profile?.role === "tutor" ||
    user?.user_metadata?.role === "tutor" ||
    Boolean(application);
  const audienceRoles = new Set<AcademyAudienceRole>();
  if (profile?.role === "student") audienceRoles.add("student");
  if (profile?.role === "parent") audienceRoles.add("parent");
  if (profile?.role === "tutor" || user?.user_metadata?.role === "tutor")
    audienceRoles.add("tutor");
  if (application) audienceRoles.add("tutor_applicant");
  const { data, error } = await supabase
    .from("academy_courses")
    .select("course_key")
    .eq("status", "published")
    .order("published_at", { ascending: true });

  if (error) return isTutor ? [tutorAcademyCourse] : [];
  const courses = await Promise.all(
    (data || []).map((row) => getPublishedAcademyCourse(row.course_key)),
  );
  const available = courses
    .filter((course): course is AcademyCourse => Boolean(course))
    .filter((course) =>
      (course.audienceRoles || []).some((role) => audienceRoles.has(role)),
    );
  if (
    isTutor &&
    !available.some((course) => course.key === TUTOR_ACADEMY_COURSE_KEY)
  )
    available.unshift(tutorAcademyCourse);
  return available;
}

export async function getAcademyMediaLibrary() {
  try {
    const admin = createAdminClient();
    const { data: assets, error: assetError } = await admin
      .from("academy_assets")
      .select(
        "id, storage_path, public_url, media_type, mime_type, original_name, byte_size, alt_text, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(100);
    if (!assetError)
      return (assets || []).map((asset) => ({
        id: asset.id,
        path: asset.storage_path,
        name: asset.original_name,
        url: asset.public_url,
        mediaType: asset.media_type as "image" | "document",
        mimeType: asset.mime_type,
        byteSize: Number(asset.byte_size),
        altText: asset.alt_text as string | null,
      }));
    const { data, error } = await admin.storage
      .from("academy-media")
      .list("courses", {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" },
      });
    if (error) return [];
    return (data || [])
      .filter((item) => item.name && !item.name.startsWith("."))
      .map((item) => {
        const path = `courses/${item.name}`;
        return {
          path,
          name: item.name,
          url: admin.storage.from("academy-media").getPublicUrl(path).data
            .publicUrl,
          mediaType: "image" as const,
          mimeType: "image/*",
          byteSize: 0,
          altText: null,
        };
      });
  } catch {
    return [];
  }
}

export async function getAcademyCourseSnapshots(courseId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("academy_course_snapshots")
    .select(
      "id, draft_revision, schema_version, reason, label, created_at, created_by",
    )
    .eq("course_id", courseId)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error && error.message.includes("label")) {
    const fallback = await supabase
      .from("academy_course_snapshots")
      .select("id, draft_revision, schema_version, reason, created_at, created_by")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false })
      .limit(30);
    return (fallback.data || []).map((snapshot) => ({ ...snapshot, label: null }));
  }
  if (error) return [];
  return data || [];
}

export async function getAcademySnapshotContent(
  courseId: string,
  snapshotId: string,
): Promise<AcademyCourse | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("academy_course_snapshots")
    .select("content")
    .eq("course_id", courseId)
    .eq("id", snapshotId)
    .maybeSingle();
  if (error || !data?.content) return null;
  return migrateAcademyCourse(data.content as AcademyCourse);
}
