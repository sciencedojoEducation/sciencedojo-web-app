const placeholderSubjects = new Set([
  "general",
  "sciencedojo tutor",
  "science dojo tutor",
  "tutor",
  "verified tutor",
]);

function normalizeSubjectLabel(subject: string) {
  return subject.trim().replace(/\s+/g, " ");
}

function isMeaningfulSubject(subject: string) {
  const normalized = normalizeSubjectLabel(subject).toLowerCase();
  return normalized.length > 0 && !placeholderSubjects.has(normalized);
}

export function getMeaningfulTutorSubjects(input: unknown): string[] {
  const rawSubjects = Array.isArray(input)
    ? input.flatMap((subject) => typeof subject === "string" ? subject.split(",") : [subject])
    : typeof input === "string"
      ? input.split(",")
      : [];

  const seen = new Set<string>();
  const subjects: string[] = [];

  for (const rawSubject of rawSubjects) {
    if (typeof rawSubject !== "string") continue;

    const subject = normalizeSubjectLabel(rawSubject);
    const key = subject.toLowerCase();

    if (!isMeaningfulSubject(subject) || seen.has(key)) continue;

    seen.add(key);
    subjects.push(subject);
  }

  return subjects;
}

export function hasMeaningfulTutorSubjects(input: unknown) {
  return getMeaningfulTutorSubjects(input).length > 0;
}
