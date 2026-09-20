"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getAcademyLesson,
  getAcademyLessonIndex,
  scoreTutorAcademyQuiz,
  TUTOR_ACADEMY_COURSE_KEY,
  tutorAcademyCourse,
} from "@/lib/tutor-academy";
import { requireTutorAcademyUser } from "@/lib/tutor-academy-progress";

export type QuizActionState = {
  status: "idle" | "error" | "failed" | "passed";
  message: string;
  score?: number;
  results?: Array<{
    questionId: string;
    correct: boolean;
    correctOptionId: string;
    explanation: string;
  }>;
};

async function loadProgressRow(supabase: Awaited<ReturnType<typeof requireTutorAcademyUser>>["supabase"], userId: string) {
  return supabase
    .from("tutor_academy_progress")
    .select("completed_lessons, started_lessons, current_lesson, quiz_attempts, best_score, completed_at")
    .eq("user_id", userId)
    .eq("course_key", TUTOR_ACADEMY_COURSE_KEY)
    .maybeSingle();
}

export async function recordAcademyLessonVisit(lessonSlug: string) {
  if (!getAcademyLesson(lessonSlug)) return { error: "Lesson not found." };

  const { supabase, user } = await requireTutorAcademyUser();
  const { data: existing, error: loadError } = await loadProgressRow(supabase, user.id);
  if (loadError) {
    console.error("[tutor-academy] Unable to load progress before lesson visit:", loadError.message);
    return { error: "Progress could not be saved. Please try again." };
  }

  const now = new Date().toISOString();
  const startedLessons = Array.from(new Set([...(existing?.started_lessons || []), lessonSlug]));
  const payload = {
    started_lessons: startedLessons,
    current_lesson: lessonSlug,
    last_viewed_at: now,
    updated_at: now,
  };
  const { error } = existing
    ? await supabase
      .from("tutor_academy_progress")
      .update(payload)
      .eq("user_id", user.id)
      .eq("course_key", TUTOR_ACADEMY_COURSE_KEY)
    : await supabase.from("tutor_academy_progress").insert({
      user_id: user.id,
      course_key: TUTOR_ACADEMY_COURSE_KEY,
      ...payload,
    });

  if (error) {
    console.error("[tutor-academy] Unable to record lesson visit:", error.message);
    return { error: "Progress could not be saved. Please try again." };
  }

  return { ok: true };
}

export async function completeAcademyLesson(lessonSlug: string) {
  const lessonIndex = getAcademyLessonIndex(lessonSlug);
  if (lessonIndex < 0) redirect("/dashboard/tutor/academy");

  const { supabase, user } = await requireTutorAcademyUser();
  const { data: existing, error: loadError } = await loadProgressRow(supabase, user.id);
  if (loadError) {
    console.error("[tutor-academy] Unable to load progress before completion:", loadError.message);
    redirect(`/dashboard/tutor/academy/lessons/${lessonSlug}?error=progress`);
  }

  const completedLessons = Array.from(new Set([...(existing?.completed_lessons || []), lessonSlug]));
  const startedLessons = Array.from(new Set([...(existing?.started_lessons || []), lessonSlug]));
  const nextLesson = tutorAcademyCourse.lessons[lessonIndex + 1];
  const nextHref = nextLesson
    ? `/dashboard/tutor/academy/lessons/${nextLesson.slug}`
    : "/dashboard/tutor/academy/quiz";

  const { error } = await supabase.from("tutor_academy_progress").upsert(
    {
      user_id: user.id,
      course_key: TUTOR_ACADEMY_COURSE_KEY,
      completed_lessons: completedLessons,
      started_lessons: startedLessons,
      current_lesson: nextLesson?.slug || null,
      quiz_attempts: Number(existing?.quiz_attempts || 0),
      best_score: Number(existing?.best_score || 0),
      completed_at: existing?.completed_at || null,
      last_viewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,course_key" },
  );

  if (error) {
    console.error("[tutor-academy] Unable to complete lesson:", error.message);
    redirect(`/dashboard/tutor/academy/lessons/${lessonSlug}?error=progress`);
  }

  revalidatePath("/dashboard/tutor/academy");
  revalidatePath("/dashboard/tutor");
  redirect(nextHref);
}

export async function submitTutorAcademyQuiz(
  _previousState: QuizActionState,
  formData: FormData,
): Promise<QuizActionState> {
  const { supabase, user } = await requireTutorAcademyUser();
  const { data: existing, error: loadError } = await loadProgressRow(supabase, user.id);

  if (loadError) {
    return { status: "error", message: "Your course progress could not be loaded. Please try again." };
  }

  const completed = new Set(existing?.completed_lessons || []);
  const allLessonsComplete = tutorAcademyCourse.lessons.every((lesson) => completed.has(lesson.slug));
  if (!allLessonsComplete) {
    return { status: "error", message: "Complete all six lessons before taking the final knowledge check." };
  }

  const answers = Object.fromEntries(
    tutorAcademyCourse.quiz.map((question) => [question.id, String(formData.get(question.id) || "")]),
  );
  if (Object.values(answers).some((answer) => !answer)) {
    return { status: "error", message: "Choose an answer for every question before submitting." };
  }

  const result = scoreTutorAcademyQuiz(answers);
  const now = new Date().toISOString();
  const completedAt = result.passed ? existing?.completed_at || now : existing?.completed_at || null;
  const { error } = await supabase.from("tutor_academy_progress").upsert(
    {
      user_id: user.id,
      course_key: TUTOR_ACADEMY_COURSE_KEY,
      completed_lessons: [...completed],
      started_lessons: Array.from(new Set([
        ...(existing?.started_lessons || []),
        ...completed,
      ])),
      current_lesson: null,
      quiz_attempts: Number(existing?.quiz_attempts || 0) + 1,
      best_score: Math.max(Number(existing?.best_score || 0), result.score),
      completed_at: completedAt,
      last_viewed_at: now,
      updated_at: now,
    },
    { onConflict: "user_id,course_key" },
  );

  if (error) {
    console.error("[tutor-academy] Unable to save quiz result:", error.message);
    return { status: "error", message: "Your result could not be saved. Please try again." };
  }

  revalidatePath("/dashboard/tutor/academy");
  revalidatePath("/dashboard/tutor/academy/quiz");
  revalidatePath("/dashboard/tutor");
  revalidatePath("/dashboard/admin/tutors");

  return {
    status: result.passed ? "passed" : "failed",
    message: result.passed
      ? "You passed Tutor Foundations. Your completion has been saved."
      : "You have not reached 80% yet. Review the feedback and try again when you are ready.",
    score: result.score,
    results: result.results,
  };
}
