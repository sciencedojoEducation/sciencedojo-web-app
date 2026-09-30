import { TUTOR_ACADEMY_COURSE_KEY } from "./tutor-academy.ts";

/** Bound route hints are accepted only for the exact course being accessed. */
export function resolveAcademyCourseBasePath(
  courseKey: string,
  requestedBasePath?: string,
): string {
  const studentPath = `/dashboard/academy/${courseKey}`;
  if (requestedBasePath === studentPath) return studentPath;
  return courseKey === TUTOR_ACADEMY_COURSE_KEY
    ? "/dashboard/tutor/academy"
    : `/dashboard/tutor/academy/courses/${courseKey}`;
}
