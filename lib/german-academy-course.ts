const GERMAN_ACADEMY_COURSE_KEYS = new Set([
  "deutsch-nicos-weg-a1",
  "deutsch-a1-komplett",
  "german-a2-complete",
  "german-b1-complete",
  "german-b2-complete",
]);

export function isGermanAcademyCourse(courseKey: string | undefined): boolean {
  return !!courseKey && GERMAN_ACADEMY_COURSE_KEYS.has(courseKey);
}
