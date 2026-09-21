import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  TUTOR_ACADEMY_COURSE_KEY,
  tutorAcademyCourse,
  type AcademyAudienceRole,
  type AcademyCourse,
} from "@/lib/tutor-academy";

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
};

function staticFoundationsRecord(): AcademyCourseRecord {
  return {
    id: null,
    courseKey: tutorAcademyCourse.key,
    title: tutorAcademyCourse.title,
    status: "published",
    audienceRoles: tutorAcademyCourse.audienceRoles || ["tutor_applicant", "tutor"],
    quizRevision: tutorAcademyCourse.quizRevision || 1,
    publishedVersionId: null,
    updatedAt: null,
    publishedAt: null,
    draft: tutorAcademyCourse,
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
    draft: {
      ...row.draft_content,
      id: row.id,
      key: row.course_key,
      audienceRoles: row.audience_roles || row.draft_content.audienceRoles || [],
      quizRevision: row.quiz_revision || row.draft_content.quizRevision || 1,
    },
  };
}

export async function getAdminAcademyCourses(): Promise<{ courses: AcademyCourseRecord[]; schemaReady: boolean }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("academy_courses")
    .select("id, course_key, title, status, audience_roles, draft_content, published_version_id, quiz_revision, updated_at, published_at")
    .order("updated_at", { ascending: false });

  if (error) {
    return { courses: [staticFoundationsRecord()], schemaReady: false };
  }

  const courses = (data || []).map((row) => mapCourseRow(row as CourseRow));
  if (!courses.some((course) => course.courseKey === TUTOR_ACADEMY_COURSE_KEY)) courses.push(staticFoundationsRecord());
  return { courses, schemaReady: true };
}

export async function getAcademyCourseDraft(courseKey: string): Promise<AcademyCourseRecord | null> {
  const { courses } = await getAdminAcademyCourses();
  return courses.find((course) => course.courseKey === courseKey) || null;
}

export async function getPublishedAcademyCourse(courseKey: string): Promise<AcademyCourse | null> {
  const supabase = await createClient();
  const { data: courseRow, error } = await supabase
    .from("academy_courses")
    .select("id, course_key, audience_roles, quiz_revision, published_version_id")
    .eq("course_key", courseKey)
    .eq("status", "published")
    .maybeSingle();

  if (error || !courseRow?.published_version_id) {
    return courseKey === TUTOR_ACADEMY_COURSE_KEY ? tutorAcademyCourse : null;
  }

  const { data: version, error: versionError } = await supabase
    .from("academy_course_versions")
    .select("id, content, quiz_revision")
    .eq("id", courseRow.published_version_id)
    .maybeSingle();

  if (versionError || !version?.content) {
    return courseKey === TUTOR_ACADEMY_COURSE_KEY ? tutorAcademyCourse : null;
  }

  return {
    ...(version.content as AcademyCourse),
    id: courseRow.id,
    key: courseRow.course_key,
    audienceRoles: courseRow.audience_roles as AcademyAudienceRole[],
    quizRevision: Number(version.quiz_revision || courseRow.quiz_revision || 1),
    versionId: version.id,
  };
}

export async function getEligibleAcademyCourses(): Promise<AcademyCourse[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: profile }, { data: application }] = user ? await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    supabase.from("applications").select("user_id").eq("user_id", user.id).maybeSingle(),
  ]) : [{ data: null }, { data: null }];
  const isTutor = profile?.role === "tutor" || user?.user_metadata?.role === "tutor" || Boolean(application);
  const { data, error } = await supabase
    .from("academy_courses")
    .select("course_key")
    .eq("status", "published")
    .order("published_at", { ascending: true });

  if (error) return isTutor ? [tutorAcademyCourse] : [];
  const courses = await Promise.all((data || []).map((row) => getPublishedAcademyCourse(row.course_key)));
  const available = courses.filter((course): course is AcademyCourse => Boolean(course));
  if (isTutor && !available.some((course) => course.key === TUTOR_ACADEMY_COURSE_KEY)) available.unshift(tutorAcademyCourse);
  return available;
}

export async function getAcademyMediaLibrary() {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.storage.from("academy-media").list("courses", { limit: 100, sortBy: { column: "created_at", order: "desc" } });
    if (error) return [];
    return (data || []).filter((item) => item.name && !item.name.startsWith(".")).map((item) => {
      const path = `courses/${item.name}`;
      return { path, name: item.name, url: admin.storage.from("academy-media").getPublicUrl(path).data.publicUrl };
    });
  } catch {
    return [];
  }
}
