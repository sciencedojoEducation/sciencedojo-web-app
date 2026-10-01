import { getAcademyJourneyLessonState } from "./academy-journey.ts";
import { getAcademyLessonProgressState, type AcademyCourse, type AcademyProgress } from "./tutor-academy.ts";

export type AcademyResumePosition = { lessonId: string; blockId: string; updatedAt: string };

export function resolveAcademyResumePosition(course: AcademyCourse, progress: AcademyProgress, position: AcademyResumePosition | null) {
  if (!position) return null;
  const index = course.lessons.findIndex((lesson) => lesson.id === position.lessonId);
  const lesson = course.lessons[index];
  if (!lesson || getAcademyJourneyLessonState(course, progress, index)?.locked) return null;
  const block = lesson.blocks.find((block) => block.id === position.blockId);
  return block ? { lesson, block } : null;
}

export function academyBookmarkedResumeHref(course: AcademyCourse, progress: AcademyProgress, position: AcademyResumePosition | null, basePath: string, fallback: string) {
  const target = resolveAcademyResumePosition(course, progress, position);
  if (!target || getAcademyLessonProgressState(progress, target.lesson.slug, target.lesson.id) === "completed") return fallback;
  return `${basePath}/lessons/${target.lesson.slug}#academy-block-${encodeURIComponent(position!.blockId)}`;
}

export function academyActivityProgress(requiredIds: string[], completedIds: string[]) {
  const ids = [...new Set(requiredIds)];
  const completed = ids.filter((id) => completedIds.includes(id)).length;
  return { completed, total: ids.length, percent: ids.length ? Math.round(completed / ids.length * 100) : 0 };
}
