export function matchesTutorSubject(subjects: readonly string[], selectedSubject: string) {
  if (selectedSubject === "All") return true;

  const subjectText = subjects.join(" ").toLowerCase();
  if (selectedSubject === "Math") return /\bmath(?:s|ematics)?\b/.test(subjectText);
  if (selectedSubject === "Programming") return /\b(programming|computer science|computing)\b/.test(subjectText);
  if (selectedSubject === "Science") {
    return subjects.some((subject) => /\b(science|physics|chemistry|biology)\b/i.test(subject) && !/\bcomputer science\b/i.test(subject));
  }
  return subjectText.includes(selectedSubject.toLowerCase());
}
