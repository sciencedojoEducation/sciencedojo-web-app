/** Keep an existing Academy draft's assessment revision monotonic across seeds. */
export function resolveDraftQuizRevision(
  sourceRevision: number | null | undefined,
  currentRevision: number | null | undefined,
  quizChanged: boolean,
): number {
  const source = Math.max(1, Number(sourceRevision) || 1);
  const current = Math.max(1, Number(currentRevision) || 1);
  return quizChanged ? Math.max(source, current + 1) : Math.max(source, current);
}
