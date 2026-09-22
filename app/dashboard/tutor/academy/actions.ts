"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getAcademyLesson,
  getAcademyLessonIndex,
  scoreTutorAcademyQuiz,
  TUTOR_ACADEMY_COURSE_KEY,
} from "@/lib/tutor-academy";
import { requireTutorAcademyUser } from "@/lib/tutor-academy-progress";
import { getPublishedAcademyCourse } from "@/lib/academy-courses";

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

async function loadProgressRow(
  supabase: Awaited<ReturnType<typeof requireTutorAcademyUser>>["supabase"],
  userId: string,
  courseKey: string,
) {
  return supabase
    .from("tutor_academy_progress")
    .select(
      "completed_lessons, started_lessons, current_lesson, quiz_attempts, best_score, completed_at, passed_quiz_revision, completed_lesson_ids, started_lesson_ids, current_lesson_id, completed_block_ids",
    )
    .eq("user_id", userId)
    .eq("course_key", courseKey)
    .maybeSingle();
}

export async function recordAcademyLessonVisit(
  courseKey: string,
  lessonSlug: string,
) {
  const course = await getPublishedAcademyCourse(courseKey);
  if (!course) return { error: "Course not found." };
  const lesson = getAcademyLesson(lessonSlug, course);
  if (!lesson) return { error: "Lesson not found." };

  const { supabase, user } = await requireTutorAcademyUser(courseKey);
  const { data: existing, error: loadError } = await loadProgressRow(
    supabase,
    user.id,
    courseKey,
  );
  if (loadError) {
    console.error(
      "[tutor-academy] Unable to load progress before lesson visit:",
      loadError.message,
    );
    return { error: "Progress could not be saved. Please try again." };
  }

  const now = new Date().toISOString();
  const startedLessons = Array.from(
    new Set([...(existing?.started_lessons || []), lessonSlug]),
  );
  const lessonId = lesson.id || `legacy:${courseKey}:${lessonSlug}`;
  const startedLessonIds = Array.from(
    new Set([...(existing?.started_lesson_ids || []), lessonId]),
  );
  const payload = {
    started_lessons: startedLessons,
    started_lesson_ids: startedLessonIds,
    current_lesson: lessonSlug,
    current_lesson_id: lessonId,
    last_viewed_at: now,
    updated_at: now,
  };
  const { error } = existing
    ? await supabase
        .from("tutor_academy_progress")
        .update(payload)
        .eq("user_id", user.id)
        .eq("course_key", courseKey)
    : await supabase.from("tutor_academy_progress").insert({
        user_id: user.id,
        course_key: courseKey,
        ...payload,
      });

  if (error) {
    console.error(
      "[tutor-academy] Unable to record lesson visit:",
      error.message,
    );
    return { error: "Progress could not be saved. Please try again." };
  }

  return { ok: true };
}

export async function completeAcademyLesson(
  courseKey: string,
  lessonSlug: string,
) {
  const course = await getPublishedAcademyCourse(courseKey);
  if (!course) redirect("/dashboard/tutor/academy");
  const lessonIndex = getAcademyLessonIndex(lessonSlug, course);
  if (lessonIndex < 0) redirect("/dashboard/tutor/academy");

  const { supabase, user } = await requireTutorAcademyUser(courseKey);
  const { data: existing, error: loadError } = await loadProgressRow(
    supabase,
    user.id,
    courseKey,
  );
  if (loadError) {
    console.error(
      "[tutor-academy] Unable to load progress before completion:",
      loadError.message,
    );
    redirect(`/dashboard/tutor/academy/lessons/${lessonSlug}?error=progress`);
  }

  const completedLessons = Array.from(
    new Set([...(existing?.completed_lessons || []), lessonSlug]),
  );
  const startedLessons = Array.from(
    new Set([...(existing?.started_lessons || []), lessonSlug]),
  );
  const lesson = course.lessons[lessonIndex];
  const requiredBlockIds = lesson.blocks
    .filter(
      (block) => block.completion === "interact" || block.completion === "pass",
    )
    .map((block) => block.id)
    .filter((id): id is string => Boolean(id));
  const completedBlockIds = new Set(existing?.completed_block_ids || []);
  if (
    course.rules?.lessonCompletion === "required-blocks" &&
    requiredBlockIds.some((id) => !completedBlockIds.has(id))
  ) {
    const lessonBasePath =
      courseKey === TUTOR_ACADEMY_COURSE_KEY
        ? "/dashboard/tutor/academy"
        : `/dashboard/tutor/academy/courses/${courseKey}`;
    redirect(`${lessonBasePath}/lessons/${lessonSlug}?error=interactions`);
  }
  const lessonId = lesson.id || `legacy:${courseKey}:${lessonSlug}`;
  const completedLessonIds = Array.from(
    new Set([...(existing?.completed_lesson_ids || []), lessonId]),
  );
  const startedLessonIds = Array.from(
    new Set([...(existing?.started_lesson_ids || []), lessonId]),
  );
  const nextLesson = course.lessons[lessonIndex + 1];
  const now = new Date().toISOString();
  const allLessonsComplete = course.lessons.every((item) =>
    item.id
      ? completedLessonIds.includes(item.id)
      : completedLessons.includes(item.slug),
  );
  const courseNowComplete =
    allLessonsComplete &&
    (course.rules?.requireFinalAssessment === false ||
      Number(
        existing?.passed_quiz_revision || (existing?.completed_at ? 1 : 0),
      ) >= (course.quizRevision || 1));
  const basePath =
    courseKey === TUTOR_ACADEMY_COURSE_KEY
      ? "/dashboard/tutor/academy"
      : `/dashboard/tutor/academy/courses/${courseKey}`;
  const nextHref = nextLesson
    ? `${basePath}/lessons/${nextLesson.slug}`
    : course.rules?.requireFinalAssessment === false
      ? basePath
      : `${basePath}/quiz`;

  const { error } = await supabase.from("tutor_academy_progress").upsert(
    {
      user_id: user.id,
      course_key: courseKey,
      completed_lessons: completedLessons,
      started_lessons: startedLessons,
      completed_lesson_ids: completedLessonIds,
      started_lesson_ids: startedLessonIds,
      current_lesson: nextLesson?.slug || null,
      current_lesson_id: nextLesson?.id || null,
      completed_block_ids: [...completedBlockIds],
      quiz_attempts: Number(existing?.quiz_attempts || 0),
      best_score: Number(existing?.best_score || 0),
      completed_at: courseNowComplete
        ? existing?.completed_at || now
        : existing?.completed_at || null,
      passed_quiz_revision: Number(
        existing?.passed_quiz_revision || (existing?.completed_at ? 1 : 0),
      ),
      last_viewed_at: now,
      updated_at: now,
    },
    { onConflict: "user_id,course_key" },
  );

  if (error) {
    console.error("[tutor-academy] Unable to complete lesson:", error.message);
    redirect(`/dashboard/tutor/academy/lessons/${lessonSlug}?error=progress`);
  }

  revalidatePath("/dashboard/tutor/academy");
  revalidatePath("/dashboard/tutor");
  revalidatePath("/dashboard/admin/tutors");
  redirect(nextHref);
}

export async function recordAcademyBlockCompletion(
  courseKey: string,
  blockId: string,
) {
  const course = await getPublishedAcademyCourse(courseKey);
  const block = course?.lessons
    .flatMap((lesson) => lesson.blocks)
    .find((item) => item.id === blockId);
  if (
    !course ||
    !block ||
    (block.completion !== "interact" && block.completion !== "pass")
  ) {
    return { error: "Learning activity not found." };
  }
  const { supabase, user } = await requireTutorAcademyUser(courseKey);
  const { data: existing, error: loadError } = await loadProgressRow(
    supabase,
    user.id,
    courseKey,
  );
  if (loadError) return { error: "Activity progress could not be saved." };
  const now = new Date().toISOString();
  const { error } = await supabase.from("tutor_academy_progress").upsert(
    {
      user_id: user.id,
      course_key: courseKey,
      completed_block_ids: Array.from(
        new Set([...(existing?.completed_block_ids || []), blockId]),
      ),
      last_viewed_at: now,
      updated_at: now,
    },
    { onConflict: "user_id,course_key" },
  );
  return error
    ? { error: "Activity progress could not be saved." }
    : { ok: true };
}

export async function submitTutorAcademyQuiz(
  courseKey: string,
  _previousState: QuizActionState,
  formData: FormData,
): Promise<QuizActionState> {
  const { supabase, user } = await requireTutorAcademyUser(courseKey);
  const course = await getPublishedAcademyCourse(courseKey);
  if (!course)
    return { status: "error", message: "This course is not available." };
  const { data: existing, error: loadError } = await loadProgressRow(
    supabase,
    user.id,
    courseKey,
  );

  if (loadError) {
    return {
      status: "error",
      message: "Your course progress could not be loaded. Please try again.",
    };
  }

  const completed = new Set(existing?.completed_lessons || []);
  const completedIds = new Set(existing?.completed_lesson_ids || []);
  const allLessonsComplete = course.lessons.every((lesson) =>
    lesson.id && completedIds.size
      ? completedIds.has(lesson.id)
      : completed.has(lesson.slug),
  );
  if (!allLessonsComplete) {
    return {
      status: "error",
      message: `Complete all ${course.lessons.length} lessons before taking the final knowledge check.`,
    };
  }
  const alreadyPassedCurrentQuiz =
    Number(existing?.passed_quiz_revision || 0) >= (course.quizRevision || 1);
  const attemptLimit = course.rules?.attemptLimit;
  if (
    attemptLimit &&
    Number(existing?.quiz_attempts || 0) >= attemptLimit &&
    !alreadyPassedCurrentQuiz
  ) {
    return {
      status: "error",
      message:
        "You have reached the attempt limit for this assessment. Please contact support or your Academy administrator.",
    };
  }

  const answers: Record<string, string | string[]> = Object.fromEntries(
    course.quiz.map((question) => [
      question.id,
      question.type === "multiple-response"
        ? formData.getAll(question.id).map(String)
        : String(formData.get(question.id) || ""),
    ]),
  );
  if (
    Object.values(answers).some((answer) =>
      Array.isArray(answer) ? answer.length === 0 : !answer.trim(),
    )
  ) {
    return {
      status: "error",
      message: "Choose an answer for every question before submitting.",
    };
  }

  const result = scoreTutorAcademyQuiz(answers, course);
  const now = new Date().toISOString();
  const completedAt = result.passed
    ? alreadyPassedCurrentQuiz
      ? existing?.completed_at || now
      : now
    : existing?.completed_at || null;
  const { error } = await supabase.from("tutor_academy_progress").upsert(
    {
      user_id: user.id,
      course_key: courseKey,
      completed_lessons: [...completed],
      started_lessons: Array.from(
        new Set([...(existing?.started_lessons || []), ...completed]),
      ),
      completed_lesson_ids: course.lessons
        .filter((lesson) =>
          lesson.id && completedIds.size
            ? completedIds.has(lesson.id)
            : completed.has(lesson.slug),
        )
        .map((lesson) => lesson.id || `legacy:${courseKey}:${lesson.slug}`),
      started_lesson_ids: course.lessons
        .filter((lesson) =>
          lesson.id && completedIds.size
            ? completedIds.has(lesson.id)
            : completed.has(lesson.slug),
        )
        .map((lesson) => lesson.id || `legacy:${courseKey}:${lesson.slug}`),
      current_lesson: null,
      current_lesson_id: null,
      completed_block_ids: existing?.completed_block_ids || [],
      quiz_attempts: Number(existing?.quiz_attempts || 0) + 1,
      best_score: Math.max(Number(existing?.best_score || 0), result.score),
      completed_at: completedAt,
      passed_quiz_revision: result.passed
        ? course.quizRevision || 1
        : Number(existing?.passed_quiz_revision || 0),
      last_viewed_at: now,
      updated_at: now,
    },
    { onConflict: "user_id,course_key" },
  );

  if (error) {
    console.error("[tutor-academy] Unable to save quiz result:", error.message);
    return {
      status: "error",
      message: "Your result could not be saved. Please try again.",
    };
  }

  revalidatePath("/dashboard/tutor/academy");
  revalidatePath("/dashboard/tutor/academy/quiz");
  revalidatePath("/dashboard/tutor");
  revalidatePath("/dashboard/admin/tutors");

  return {
    status: result.passed ? "passed" : "failed",
    message: result.passed
      ? `You passed ${course.shortTitle}. Your completion has been saved.`
      : `You have not reached ${course.passMark || 80}% yet. Review the course and try again when you are ready.`,
    score: result.score,
    results:
      course.rules?.feedbackTiming === "after-pass" && !result.passed
        ? undefined
        : result.results,
  };
}
