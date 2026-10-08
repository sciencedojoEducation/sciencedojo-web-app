import type { AcademyCourse } from "./tutor-academy";

/** The course rail needs lesson metadata, never the full exercise content. */
export function academyNavigationCourse(course: AcademyCourse) {
  return {
    key: course.key,
    shortTitle: course.shortTitle,
    heroImage: course.heroImage,
    lessons: course.lessons.map(lesson => ({ ...lesson, blocks: [] })),
    quizRevision: course.quizRevision,
    rules: course.rules,
    examTracks: course.examTracks,
  };
}
