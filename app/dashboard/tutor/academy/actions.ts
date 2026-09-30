"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getAcademyLesson,
  getAcademyLessonIndex,
  getAcademyRequiredLessons,
  isAcademyBlockRequiredForCompletion,
  isAcademyPracticeSubmissionSaved,
  isAcademyKnowledgeCheckAnswerAccepted,
  getAcademyCoreLessons,
  getAcademyAssessmentLessons,
  scoreTutorAcademyQuiz,
  type AcademyCourse,
} from "@/lib/tutor-academy";
import { normalizeAcademyProgress, requireTutorAcademyUser } from "@/lib/tutor-academy-progress";
import { getPublishedAcademyCourse } from "@/lib/academy-courses";
import { getAcademyExamTrackResumeLesson, getAcademyJourneyLessonState } from "@/lib/academy-journey";
import { resolveAcademyCourseBasePath } from "@/lib/academy-route-paths";

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
  const result = await supabase
    .from("tutor_academy_progress")
    .select(
      "completed_lessons, started_lessons, current_lesson, quiz_attempts, best_score, completed_at, passed_quiz_revision, completed_lesson_ids, started_lesson_ids, current_lesson_id, completed_block_ids, selected_exam_track",
    )
    .eq("user_id", userId)
    .eq("course_key", courseKey)
    .maybeSingle();
  if (!result.error?.message.includes("selected_exam_track")) return result;
  const fallback = await supabase
    .from("tutor_academy_progress")
    .select("completed_lessons, started_lessons, current_lesson, quiz_attempts, best_score, completed_at, passed_quiz_revision, completed_lesson_ids, started_lesson_ids, current_lesson_id, completed_block_ids")
    .eq("user_id", userId)
    .eq("course_key", courseKey)
    .maybeSingle();
  return {
    ...fallback,
    data: fallback.data ? { ...fallback.data, selected_exam_track: null } : null,
  };
}

function hasCompletedCoreLessons(
  course: AcademyCourse,
  row: { completed_lesson_ids?: string[] | null; completed_lessons?: string[] | null } | null,
) {
  const completedIds = new Set(row?.completed_lesson_ids || []);
  const completedSlugs = new Set(row?.completed_lessons || []);
  return getAcademyCoreLessons(course).every((lesson) =>
    lesson.id ? completedIds.has(lesson.id) : completedSlugs.has(lesson.slug));
}

export async function recordAcademyLessonVisit(
  courseKey: string,
  lessonSlug: string,
  requestedBasePath?: string,
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
  if (lesson.examTrack) {
    const basePath = resolveAcademyCourseBasePath(courseKey, requestedBasePath);
    if (!hasCompletedCoreLessons(course, existing)) redirect(basePath);
    if (lesson.examTrack !== existing?.selected_exam_track)
      redirect(`${basePath}/choose-exam`);
    if (Number(existing?.passed_quiz_revision || 0) < (course.quizRevision || 1))
      redirect(`${basePath}/quiz`);
  }
  if (getAcademyJourneyLessonState(course, normalizeAcademyProgress(existing),
    getAcademyLessonIndex(lessonSlug, course))?.locked)
    return { error: "Complete the earlier lessons before opening this activity." };

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
  requestedBasePath?: string,
) {
  const basePath = resolveAcademyCourseBasePath(courseKey, requestedBasePath);
  const course = await getPublishedAcademyCourse(courseKey);
  if (!course) redirect(basePath);
  const lessonIndex = getAcademyLessonIndex(lessonSlug, course);
  if (lessonIndex < 0) redirect(basePath);

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
    redirect(`${basePath}/lessons/${lessonSlug}?error=progress`);
  }
  const selectedLesson = course.lessons[lessonIndex];
  if (selectedLesson.examTrack) {
    if (!hasCompletedCoreLessons(course, existing)) redirect(basePath);
    if (selectedLesson.examTrack !== existing?.selected_exam_track)
      redirect(`${basePath}/choose-exam`);
    if (Number(existing?.passed_quiz_revision || 0) < (course.quizRevision || 1))
      redirect(`${basePath}/quiz`);
  }
  if (getAcademyJourneyLessonState(course, normalizeAcademyProgress(existing), lessonIndex)?.locked)
    redirect(basePath);

  const completedLessons = Array.from(
    new Set([...(existing?.completed_lessons || []), lessonSlug]),
  );
  const startedLessons = Array.from(
    new Set([...(existing?.started_lessons || []), lessonSlug]),
  );
  const lesson = course.lessons[lessonIndex];
  const requiredBlocks = lesson.blocks.filter((block) =>
    block.id && isAcademyBlockRequiredForCompletion(block));
  const requiredPracticeIds = requiredBlocks
    .filter((block) => block.type === "writing-practice" || block.type === "speaking-practice")
    .map((block) => block.id!);
  const { data: submissions, error: submissionError } = requiredPracticeIds.length
    ? await supabase.from("academy_learner_submissions")
      .select("block_id, submission_type, text_response, audio_path")
      .eq("user_id", user.id)
      .eq("course_key", courseKey)
      .eq("lesson_id", lesson.id || `legacy:${courseKey}:${lessonSlug}`)
      .in("block_id", requiredPracticeIds)
    : { data: [], error: null };
  if (submissionError)
    redirect(`${basePath}/lessons/${lessonSlug}?error=progress`);
  const savedPracticeById = new Map((submissions || []).map((item) => [item.block_id, item]));
  const completedBlockIds = new Set(existing?.completed_block_ids || []);
  const firstMissingBlockId = requiredBlocks.find((block) =>
    !completedBlockIds.has(block.id!) ||
    !isAcademyPracticeSubmissionSaved(block, savedPracticeById.get(block.id!)))?.id;
  if (course.rules?.lessonCompletion === "required-blocks" && firstMissingBlockId)
    redirect(`${basePath}/lessons/${lessonSlug}?error=interactions#academy-block-${firstMissingBlockId}`);
  const lessonId = lesson.id || `legacy:${courseKey}:${lessonSlug}`;
  const completedLessonIds = Array.from(
    new Set([...(existing?.completed_lesson_ids || []), lessonId]),
  );
  const startedLessonIds = Array.from(
    new Set([...(existing?.started_lesson_ids || []), lessonId]),
  );
  const requiredLessons = getAcademyRequiredLessons(course, normalizeAcademyProgress(existing));
  const nextLesson = requiredLessons[requiredLessons.indexOf(lesson) + 1];
  const now = new Date().toISOString();
  const allLessonsComplete = requiredLessons.every((item) =>
    item.id
      ? completedLessonIds.includes(item.id)
      : completedLessons.includes(item.slug),
  );
  const courseNowComplete =
    allLessonsComplete &&
    (!course.examTracks?.length || Boolean(existing?.selected_exam_track)) &&
    (course.rules?.requireFinalAssessment === false ||
      Number(
        existing?.passed_quiz_revision || (existing?.completed_at ? 1 : 0),
      ) >= (course.quizRevision || 1));
  const nextHref = nextLesson
    ? `${basePath}/lessons/${nextLesson.slug}`
    : course.rules?.requireFinalAssessment !== false &&
        Number(existing?.passed_quiz_revision || 0) < (course.quizRevision || 1)
      ? `${basePath}/quiz`
      : course.examTracks?.length && !existing?.selected_exam_track
        ? `${basePath}/choose-exam`
        : basePath;

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
    redirect(`${basePath}/lessons/${lessonSlug}?error=progress`);
  }

  revalidatePath("/dashboard/tutor/academy");
  revalidatePath(basePath);
  revalidatePath("/dashboard/tutor");
  revalidatePath("/dashboard/admin/tutors");
  redirect(nextHref);
}

export async function chooseAcademyExamTrack(
  courseKey: string,
  trackId: string,
  requestedBasePath?: string,
) {
  const course = await getPublishedAcademyCourse(courseKey);
  const basePath = resolveAcademyCourseBasePath(courseKey, requestedBasePath);
  if (!course?.examTracks?.some((track) => track.id === trackId))
    redirect(`${basePath}/choose-exam?error=invalid`);
  const { supabase, user } = await requireTutorAcademyUser(courseKey);
  const { data: existing, error } = await loadProgressRow(supabase, user.id, courseKey);
  if (error) redirect(`${basePath}/choose-exam?error=progress`);
  const coreComplete = hasCompletedCoreLessons(course, existing);
  const assessmentComplete = course.rules?.requireFinalAssessment === false ||
    Number(existing?.passed_quiz_revision || 0) >= (course.quizRevision || 1);
  if (!coreComplete || !assessmentComplete)
    redirect(basePath);
  const nextLesson = getAcademyExamTrackResumeLesson(
    course,
    normalizeAcademyProgress(existing),
    trackId,
  );
  if (!nextLesson) redirect(`${basePath}/choose-exam?error=invalid`);
  const now = new Date().toISOString();
  const { data: saved, error: saveError } = await supabase.from("tutor_academy_progress").update({
    selected_exam_track: trackId,
    current_lesson: nextLesson.slug,
    current_lesson_id: nextLesson.id || null,
    completed_at: existing?.selected_exam_track === trackId
      ? existing?.completed_at || null
      : null,
    updated_at: now,
  }).eq("user_id", user.id).eq("course_key", courseKey)
    .select("selected_exam_track").single();
  if (saveError || saved?.selected_exam_track !== trackId)
    redirect(`${basePath}/choose-exam?error=progress`);
  revalidatePath(basePath);
  redirect(`${basePath}/lessons/${nextLesson.slug}`);
}

export async function recordAcademyBlockCompletion(
  courseKey: string,
  blockId: string,
  answer?: string | string[],
) {
  const course = await getPublishedAcademyCourse(courseKey);
  const owningLesson = course?.lessons.find((lesson) =>
    lesson.blocks.some((item) => item.id === blockId));
  const block = owningLesson?.blocks.find((item) => item.id === blockId);
  if (
    !course ||
    !owningLesson ||
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
  if (owningLesson?.examTrack &&
    (!hasCompletedCoreLessons(course, existing) ||
      owningLesson.examTrack !== existing?.selected_exam_track ||
      Number(existing?.passed_quiz_revision || 0) < (course.quizRevision || 1)))
    return { error: "Choose and unlock this exam route first." };
  if (getAcademyJourneyLessonState(course, normalizeAcademyProgress(existing),
    course.lessons.indexOf(owningLesson))?.locked)
    return { error: "Complete the earlier lessons before this activity." };
  if (block.type === "knowledge-check" &&
    !isAcademyKnowledgeCheckAnswerAccepted(block.question, block.completion, answer))
    return { error: "Answer this check before completing the activity." };
  if (block.type === "writing-practice" || block.type === "speaking-practice") {
    const { data: submission, error: submissionError } = await supabase
      .from("academy_learner_submissions")
      .select("submission_type, text_response, audio_path")
      .eq("user_id", user.id)
      .eq("course_key", courseKey)
      .eq("lesson_id", owningLesson.id || `legacy:${courseKey}:${owningLesson.slug}`)
      .eq("block_id", blockId)
      .maybeSingle();
    if (submissionError || !isAcademyPracticeSubmissionSaved(block, submission))
      return { error: "Save your writing or recording before completing this activity." };
  }
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
  const requiredForAssessment = getAcademyAssessmentLessons(course);
  const allLessonsComplete = requiredForAssessment.every((lesson) =>
    lesson.id && completedIds.size
      ? completedIds.has(lesson.id)
      : completed.has(lesson.slug),
  );
  if (!allLessonsComplete) {
    return {
      status: "error",
      message: `Complete all ${requiredForAssessment.length} core lessons before taking the final knowledge check.`,
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
  const completedAt = result.passed && !course.examTracks?.length
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
  revalidatePath(`/dashboard/academy/${courseKey}`);
  revalidatePath(`/dashboard/academy/${courseKey}/quiz`);
  revalidatePath("/dashboard/tutor");
  revalidatePath("/dashboard/admin/tutors");

  return {
    status: result.passed ? "passed" : "failed",
    message: result.passed
      ? course.examTracks?.length
        ? `You passed the shared course knowledge check. Choose your Goethe or telc exam route next.`
        : `You passed ${course.shortTitle}. Your completion has been saved.`
      : `You have not reached ${course.passMark || 80}% yet. Review the course and try again when you are ready.`,
    score: result.score,
    results:
      course.rules?.feedbackTiming === "after-pass" && !result.passed
        ? undefined
        : result.results,
  };
}
