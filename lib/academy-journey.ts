import {
  getAcademyLessonProgressState,
  getAcademyQuizProgressState,
  type AcademyCourse,
  type AcademyProgress,
} from "./tutor-academy.ts";

export function getAcademyJourneyLessonState(
  course: AcademyCourse,
  progress: AcademyProgress,
  index: number,
) {
  const lesson = course.lessons[index];
  if (!lesson) return null;
  const previous = course.lessons[index - 1];
  return {
    status: getAcademyLessonProgressState(progress, lesson.slug, lesson.id),
    locked: course.rules?.navigation === "linear" && !!previous &&
      getAcademyLessonProgressState(progress, previous.slug, previous.id) !== "completed",
  };
}

export function getAcademyJourneyResumeTarget(
  course: AcademyCourse,
  progress: AcademyProgress,
): { kind: "lesson"; slug: string } | { kind: "assessment" } | null {
  const nextLesson = course.lessons.find(
    (lesson) => getAcademyLessonProgressState(progress, lesson.slug, lesson.id) !== "completed",
  );
  if (nextLesson) return { kind: "lesson", slug: nextLesson.slug };
  if (course.rules?.requireFinalAssessment !== false &&
    getAcademyQuizProgressState(progress, course) !== "completed") {
    return { kind: "assessment" };
  }
  return null;
}
