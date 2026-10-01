import { getAcademyLessonProgressState, getAcademyProgressPercent, getAcademyRequiredLessons, getAcademyQuizProgressState, type AcademyCourse, type AcademyProgress } from "./tutor-academy.ts";
import { getAcademyJourneyLessonState } from "./academy-journey.ts";

export function academyCourseOutline(course: AcademyCourse, progress: AcademyProgress, preview = false) {
  const lessons = preview ? course.lessons : getAcademyRequiredLessons(course, progress);
  const groups = Array.from(new Set(lessons.map((lesson) => lesson.sectionId || lesson.section))).map((key) => {
    const items = lessons.filter((lesson) => (lesson.sectionId || lesson.section) === key);
    return { key, title: items[0].section, lessons: items.map((lesson) => ({ lesson,
      state: preview ? "unstarted" as const : getAcademyLessonProgressState(progress, lesson.slug, lesson.id),
      locked: !preview && !!getAcademyJourneyLessonState(course, progress, course.lessons.indexOf(lesson))?.locked,
    })) };
  });
  return { groups, percent: preview ? 0 : getAcademyProgressPercent(progress, course),
    quizState: preview ? "unstarted" as const : getAcademyQuizProgressState(progress, course) };
}
