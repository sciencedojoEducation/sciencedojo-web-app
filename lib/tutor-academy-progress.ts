import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  emptyAcademyProgress,
  TUTOR_ACADEMY_COURSE_KEY,
  type AcademyProgress,
} from "@/lib/tutor-academy";

type ProgressRow = {
  completed_lessons?: string[] | null;
  started_lessons?: string[] | null;
  current_lesson?: string | null;
  quiz_attempts?: number | null;
  best_score?: number | null;
  completed_at?: string | null;
  passed_quiz_revision?: number | null;
  completed_lesson_ids?: string[] | null;
  started_lesson_ids?: string[] | null;
  current_lesson_id?: string | null;
  completed_block_ids?: string[] | null;
};

export function normalizeAcademyProgress(
  row?: ProgressRow | null,
): AcademyProgress {
  return {
    completedLessons: Array.isArray(row?.completed_lessons)
      ? row.completed_lessons
      : [],
    startedLessons: Array.isArray(row?.started_lessons)
      ? row.started_lessons
      : [],
    completedLessonIds: Array.isArray(row?.completed_lesson_ids)
      ? row.completed_lesson_ids
      : [],
    startedLessonIds: Array.isArray(row?.started_lesson_ids)
      ? row.started_lesson_ids
      : [],
    currentLesson: row?.current_lesson || null,
    currentLessonId: row?.current_lesson_id || null,
    completedBlockIds: Array.isArray(row?.completed_block_ids)
      ? row.completed_block_ids
      : [],
    quizAttempts: Number(row?.quiz_attempts || 0),
    bestScore: Number(row?.best_score || 0),
    completedAt: row?.completed_at || null,
    passedQuizRevision: Number(
      row?.passed_quiz_revision || (row?.completed_at ? 1 : 0),
    ),
  };
}

export async function requireTutorAcademyUser(
  courseKey = TUTOR_ACADEMY_COURSE_KEY,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/tutor/academy");

  const [{ data: profile }, { data: application }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    supabase
      .from("applications")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const isTutor =
    profile?.role === "tutor" ||
    user.user_metadata?.role === "tutor" ||
    Boolean(application);
  let isEligible = courseKey === TUTOR_ACADEMY_COURSE_KEY && isTutor;
  if (!isEligible) {
    const { data: eligibleCourse } = await supabase
      .from("academy_courses")
      .select("id, audience_roles")
      .eq("course_key", courseKey)
      .eq("status", "published")
      .maybeSingle();
    const audiences = new Set(eligibleCourse?.audience_roles || []);
    isEligible =
      Boolean(eligibleCourse) &&
      ((profile?.role === "student" && audiences.has("student")) ||
        (profile?.role === "parent" && audiences.has("parent")) ||
        ((profile?.role === "tutor" || user.user_metadata?.role === "tutor") &&
          audiences.has("tutor")) ||
        (Boolean(application) && audiences.has("tutor_applicant")));
  }
  if (!isEligible)
    redirect(
      `/dashboard/${profile?.role || user.user_metadata?.role || "user"}`,
    );

  return { supabase, user };
}

export async function getTutorAcademyProgress(
  courseKey = TUTOR_ACADEMY_COURSE_KEY,
): Promise<AcademyProgress> {
  const { supabase, user } = await requireTutorAcademyUser(courseKey);
  const { data, error } = await supabase
    .from("tutor_academy_progress")
    .select(
      "completed_lessons, started_lessons, current_lesson, quiz_attempts, best_score, completed_at, passed_quiz_revision, completed_lesson_ids, started_lesson_ids, current_lesson_id, completed_block_ids",
    )
    .eq("user_id", user.id)
    .eq("course_key", courseKey)
    .maybeSingle();

  if (error) {
    console.error("[tutor-academy] Unable to load progress:", error.message);
    return emptyAcademyProgress;
  }

  return normalizeAcademyProgress(data);
}
