const GERMAN_ACADEMY_COURSE_KEYS = new Set([
  "deutsch-a1-komplett",
  "german-b2-complete",
]);

export function isGermanAcademyCourse(courseKey: string | undefined): boolean {
  return !!courseKey && GERMAN_ACADEMY_COURSE_KEYS.has(courseKey);
}
