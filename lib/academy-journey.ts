import {
  getAcademyLessonProgressState,
  getAcademyRequiredLessons,
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
  const core = course.lessons.filter((item) => !item.examTrack);
  const coreComplete = core.every((item) =>
    getAcademyLessonProgressState(progress, item.slug, item.id) === "completed");
  const assessmentComplete = course.rules?.requireFinalAssessment === false ||
    getAcademyQuizProgressState(progress, course) === "completed";
  const path = getAcademyRequiredLessons(course, progress);
  const pathIndex = path.indexOf(lesson);
  const previous = path[pathIndex - 1];
  return {
    status: getAcademyLessonProgressState(progress, lesson.slug, lesson.id),
    locked: Boolean(lesson.examTrack &&
      (!coreComplete || !assessmentComplete || progress.selectedExamTrack !== lesson.examTrack)) ||
      (course.rules?.navigation === "linear" && !!previous &&
        getAcademyLessonProgressState(progress, previous.slug, previous.id) !== "completed"),
  };
}

export function getAcademyJourneyResumeTarget(
  course: AcademyCourse,
  progress: AcademyProgress,
): { kind: "lesson"; slug: string } | { kind: "assessment" } | { kind: "track-choice" } | null {
  const core = course.lessons.filter((lesson) => !lesson.examTrack);
  const coreComplete = core.every((lesson) =>
    getAcademyLessonProgressState(progress, lesson.slug, lesson.id) === "completed");
  if (course.examTracks?.length && coreComplete) {
    if (course.rules?.requireFinalAssessment !== false &&
      getAcademyQuizProgressState(progress, course) !== "completed")
      return { kind: "assessment" };
    if (!progress.selectedExamTrack) return { kind: "track-choice" };
  }
  const nextLesson = getAcademyRequiredLessons(course, progress).find(
    (lesson) => getAcademyLessonProgressState(progress, lesson.slug, lesson.id) !== "completed",
  );
  if (nextLesson) return { kind: "lesson", slug: nextLesson.slug };
  if (course.rules?.requireFinalAssessment !== false &&
    getAcademyQuizProgressState(progress, course) !== "completed") {
    return { kind: "assessment" };
  }
  if (course.examTracks?.length &&
    !course.examTracks.some((track) => track.id === progress.selectedExamTrack))
    return { kind: "track-choice" };
  return null;
}

export function getAcademyExamTrackResumeLesson(
  course: AcademyCourse,
  progress: AcademyProgress,
  trackId: string,
) {
  const trackLessons = course.lessons.filter((lesson) => lesson.examTrack === trackId);
  return trackLessons.find((lesson) =>
    getAcademyLessonProgressState(progress, lesson.slug, lesson.id) !== "completed") ||
    trackLessons.at(-1) || null;
}
