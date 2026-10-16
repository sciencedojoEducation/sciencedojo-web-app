import type { AcademyLanguageFeedback } from "./academy-language-feedback";
import { checkWorkbookPages, workbookFieldKey, type WorkbookAnswers, type WorkbookPage, type CheckResult } from "./aspekte-workbook.ts";

export type WorkbookPosition = { page: number; exercise: string | null; view: "book" | "quick" | "progress"; track: number; seconds: number; session?: string[]; revisionSession?: boolean };
export type WorkbookDraft = {
  answers: WorkbookAnswers; notes: Record<string, string>; visited: number[]; position: WorkbookPosition;
  runs: Record<string, string>; exerciseRuns?: Record<string, string>; assisted: number[]; revealed: Record<string, string>;
};
export type WorkbookAttempt = {
  id: string; run: string; chapter: number; kind: "chapter" | "practice" | "archive"; at: string;
  answers: WorkbookAnswers; exerciseRuns?: Record<string, string>; result: CheckResult; assisted: boolean; contentVersion: string;
};
export type WorkbookReview = { key: string; page: number; exercise: string; reason: "incorrect" | "skipped" | "uncertain"; step: number; due: string | null; updatedAt: string };
export type WorkbookFeedback = { id: string; page: number; exercise: string; run: string; at: string; inputText?: string; inputDigest: string; feedback: AcademyLanguageFeedback };
export type WorkbookLearningState = { version: 2; revision: number; draft: WorkbookDraft; attempts: WorkbookAttempt[]; reviews: WorkbookReview[]; feedback?: WorkbookFeedback[] };
export type WorkbookRecovery = { id: string; at: string; reason: string; draft: WorkbookDraft };
type WorkbookStorage = Pick<Storage, "getItem" | "setItem" | "key" | "length">;
export function saveWorkbookRecovery(storage: WorkbookStorage, account: string, draft: WorkbookDraft, reason: string): WorkbookRecovery {
  const record = { id: `workbook-recovery:${account}:${crypto.randomUUID()}`, at: new Date().toISOString(), reason, draft: structuredClone(draft) };
  storage.setItem(record.id, JSON.stringify(record));
  return record;
}
export function loadWorkbookRecoveries(storage: WorkbookStorage, account: string): WorkbookRecovery[] {
  const records: WorkbookRecovery[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key?.startsWith(`workbook-recovery:${account}:`)) continue;
    try {
      const record = JSON.parse(storage.getItem(key) || "null");
      validateWorkbookDraft(record.draft);
      if (record.id === key && typeof record.at === "string" && typeof record.reason === "string") records.push(record);
    } catch { /* An unreadable copy is retained in storage for manual inspection. */ }
  }
  return records.sort((a, b) => b.at.localeCompare(a.at));
}
export function workbookPendingDraft(base: WorkbookDraft, current: WorkbookDraft, conflict: { base: WorkbookDraft; local: WorkbookDraft } | null) {
  if (!conflict) return { base, draft: current };
  // Position updates must not replace unsent answers or rebase away a conflict.
  return { base: conflict.base, draft: { ...conflict.local, position: current.position, visited: [...new Set([...conflict.local.visited, ...current.visited])] } };
}
export const REVIEW_DAYS = [1, 3, 7, 14] as const;
export function emptyWorkbookLearningState(): WorkbookLearningState {
  return { version: 2, revision: 0, draft: { answers: {}, notes: {}, visited: [], position: { page: 6, exercise: null, view: "book", track: 0, seconds: 0 }, runs: {}, exerciseRuns: {}, assisted: [], revealed: {} }, attempts: [], reviews: [] };
}
export function chapterForPage(page: number) { return Math.floor((page - 6) / 14) + 1; }
export function validateWorkbookDraft(input: unknown): WorkbookDraft {
  const d = input as WorkbookDraft;
  if (!d || typeof d !== "object" || !d.position || !Number.isInteger(d.position.page) || d.position.page < 6 || d.position.page > 145 || !["book", "quick", "progress"].includes(d.position.view) || !Number.isFinite(d.position.seconds) || d.position.seconds < 0 || d.position.seconds > 3600 || !Number.isInteger(d.position.track) || d.position.track < 0 || d.position.track > 51 || (d.position.exercise !== null && (typeof d.position.exercise !== "string" || d.position.exercise.length > 100))) throw new Error("Invalid study position");
  if (d.position.session && (!Array.isArray(d.position.session) || d.position.session.length > 5 || d.position.session.some(k => typeof k !== "string" || !/^\d{1,3}:[^:]{1,40}$/.test(k)))) throw new Error("Invalid study session");
  const strings = (value: unknown, keys: RegExp, max: number, count: number) => {
    if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length > count) throw new Error("Invalid study data");
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(value)) {
      if (!keys.test(k) || typeof v !== "string" || v.length > max) throw new Error("Invalid study value");
      clean[k] = v;
    }
    return clean;
  };
  const answers = strings(d.answers, /^\d{1,3}:[^:]{1,40}:[^:]{1,40}$/, 5000, 10000);
  const notes = strings(d.notes, /^\d{1,3}$/, 10000, 140);
  const runs = strings(d.runs, /^(10|[1-9])$/, 100, 10);
  if (!Array.isArray(d.visited) || d.visited.length > 140 || d.visited.some(p => !Number.isInteger(p) || p < 6 || p > 145)) throw new Error("Invalid reviewed pages");
  // Assistance/reveal records are maintained by the server, never accepted from a draft write.
  return { answers, notes, visited: [...new Set(d.visited)], position: d.position, runs, exerciseRuns: {}, assisted: [], revealed: {} };
}

/** Merge independent device edits. The caller must explicitly resolve same-field conflicts. */
export function mergeWorkbookDraft(base: WorkbookDraft, local: WorkbookDraft, remote: WorkbookDraft) {
  const merged = structuredClone(remote); const conflicts: string[] = [];
  const changedChapters = new Set<string>(); const changedExercises = new Set<string>();
  for (const chapter of new Set([...Object.keys(base.runs), ...Object.keys(local.runs), ...Object.keys(remote.runs)])) {
    if (local.runs[chapter] !== remote.runs[chapter] && remote.runs[chapter] !== base.runs[chapter]) changedChapters.add(chapter);
  }
  for (const key of new Set([...Object.keys(base.exerciseRuns || {}), ...Object.keys(local.exerciseRuns || {}), ...Object.keys(remote.exerciseRuns || {})])) {
    if (local.exerciseRuns?.[key] !== remote.exerciseRuns?.[key] && remote.exerciseRuns?.[key] !== base.exerciseRuns?.[key]) changedExercises.add(key);
  }
  const affectedRuns = new Set<string>();
  for (const group of ["answers", "notes"] as const) {
    const keys = new Set([...Object.keys(base[group]), ...Object.keys(local[group]), ...Object.keys(remote[group])]);
    for (const k of keys) {
      const b = base[group][k] || "", l = local[group][k] || "", r = remote[group][k] || "";
      const chapter = String(chapterForPage(Number(k.split(":")[0])));
      const exercise = k.slice(0, k.lastIndexOf(":"));
      const changedRun = group === "answers" && (changedChapters.has(chapter) || changedExercises.has(exercise));
      if (l !== b && l !== r && (r !== b || changedRun)) {
        conflicts.push(`${group}:${k}`);
        if (changedRun) affectedRuns.add(changedChapters.has(chapter) ? `run:${chapter}` : `exercise-run:${exercise}`);
      } else if (l !== b) merged[group][k] = l;
    }
  }
  conflicts.push(...affectedRuns);
  merged.visited = [...new Set([...local.visited, ...remote.visited])];
  merged.position = local.position;
  return { draft: merged, conflicts };
}

export function resolveWorkbookDraftChoices(merged: WorkbookDraft, local: WorkbookDraft, remote: WorkbookDraft, conflicts: string[], choices: Record<string, "local" | "remote">) {
  const draft = structuredClone(merged);
  for (const key of conflicts) {
    const [group, ...rest] = key.split(":"); const id = rest.join(":");
    if (group === "answers" || group === "notes") draft[group][id] = choices[key] === "local" ? local[group][id] || "" : remote[group][id] || "";
  }
  // The merged draft already has the server's run IDs. Explicitly chosen edits
  // can be carried into that run without restoring any other old answers.
  return draft;
}

/** Preserve edits made while an action was running without undoing server-side resets. */
export function reconcileWorkbookAction(before: WorkbookDraft, local: WorkbookDraft, remote: WorkbookLearningState) {
  const next = structuredClone(remote);
  const conflicts: string[] = [];
  for (const group of ["answers", "notes"] as const) {
    for (const key of new Set([...Object.keys(before[group]), ...Object.keys(local[group])])) {
      const previous = before[group][key] || "", current = local[group][key] || "", saved = remote.draft[group][key] || "";
      if (current === previous) continue;
      let changedRun = false;
      if (group === "answers") {
        const exercise = key.slice(0, key.lastIndexOf(":"));
        const chapter = String(chapterForPage(Number(key.split(":")[0])));
        const oldRun = before.exerciseRuns?.[exercise] || before.runs[chapter] || "initial";
        const newRun = remote.draft.exerciseRuns?.[exercise] || remote.draft.runs[chapter] || "initial";
        changedRun = oldRun !== newRun;
      }
      if ((changedRun || saved !== previous) && saved !== current) conflicts.push(`${group}:${key}`);
      else next.draft[group][key] = current;
    }
  }
  // A reset can change the page while the audio bookmark changes independently.
  for (const key of Object.keys(local.position) as (keyof WorkbookPosition)[]) {
    if (JSON.stringify(local.position[key]) !== JSON.stringify(before.position[key]) && JSON.stringify(remote.draft.position[key]) === JSON.stringify(before.position[key])) {
      Object.assign(next.draft.position, { [key]: local.position[key] });
    }
  }
  next.draft.visited = [...new Set([...remote.draft.visited, ...local.visited])];
  return { state: next, conflicts };
}

export function queueWorkbookReview(state: WorkbookLearningState, page: number, exercise: string, reason: WorkbookReview["reason"], now: string) {
  const key = `${page}:${exercise}`;
  const item: WorkbookReview = { key, page, exercise, reason, step: 0, due: now, updatedAt: now };
  const index = state.reviews.findIndex(r => r.key === key);
  if (index < 0) state.reviews.push(item); else state.reviews[index] = item;
}
export function advanceWorkbookReview(item: WorkbookReview, correct: boolean, now: string): WorkbookReview {
  if (!correct) return { ...item, step: 0, due: new Date(Date.parse(now) + 86400000).toISOString(), updatedAt: now, reason: "incorrect" };
  const due = item.step >= REVIEW_DAYS.length ? null : new Date(Date.parse(now) + REVIEW_DAYS[item.step] * 86400000).toISOString();
  return { ...item, step: item.step + 1, due, updatedAt: now };
}

export function recordWorkbookAttempt(state: WorkbookLearningState, pages: WorkbookPage[], input: { id: string; chapter: number; kind: WorkbookAttempt["kind"]; now: string; contentVersion: string; revisionSession?: boolean; finishSession?: boolean }) {
  const prior = state.attempts.find(a => a.id === input.id); if (prior) return prior;
  const relevant = new Set(pages.flatMap(p => p.exercises.flatMap(e => e.fields.map(f => workbookFieldKey(p.bookPage, e.id, f.id)))));
  const answers = Object.fromEntries(Object.entries(state.draft.answers).filter(([key]) => relevant.has(key)));
  const result = input.kind === "archive" ? { fields: {}, correct: 0, scored: 0, unanswered: 0, review: 0 } as CheckResult : checkWorkbookPages(pages, answers);
  const run = state.draft.runs[String(input.chapter)] || "initial";
  const attempt: WorkbookAttempt = { id: input.id, run, chapter: input.chapter, kind: input.kind, at: input.now, answers, exerciseRuns: { ...state.draft.exerciseRuns }, result, assisted: state.draft.assisted.includes(input.chapter), contentVersion: input.contentVersion };
  state.attempts.push(attempt);
  if (input.kind === "archive") return attempt;
  for (const page of pages) for (const exercise of page.exercises) {
    if (exercise.requiresSource) continue;
    const fixed = exercise.fields.filter(f => f.evaluation === "exact" || f.evaluation === "set");
    if (!fixed.length) continue;
    const ids = fixed.map(f => workbookFieldKey(page.bookPage, exercise.id, f.id));
    const wrong = ids.some(id => result.fields[id].status === "incorrect");
    const blank = ids.some(id => result.fields[id].status === "unanswered");
    const key = `${page.bookPage}:${exercise.id}`;
    if (wrong || blank && (input.kind === "chapter" || input.finishSession)) queueWorkbookReview(state, page.bookPage, exercise.id, wrong ? "incorrect" : "skipped", input.now);
    const review = state.reviews.findIndex(r => r.key === key);
    if (input.revisionSession && review >= 0 && (!state.reviews[review].due || Date.parse(state.reviews[review].due!) <= Date.parse(input.now))) state.reviews[review] = advanceWorkbookReview(state.reviews[review], !wrong && !blank, input.now);
    for (const id of ids) state.draft.revealed[id] = answers[id] || "";
  }
  // Checking exposes corrections. Subsequent checks in this run are assisted.
  if (!state.draft.assisted.includes(input.chapter)) state.draft.assisted.push(input.chapter);
  return attempt;
}
export function workbookChapterStats(state: WorkbookLearningState, chapter: number, totalFields: number) {
  const submitted = state.attempts.filter(a => a.chapter === chapter && a.kind === "chapter");
  const score = (a: WorkbookAttempt) => a.result.scored ? Math.round(a.result.correct / a.result.scored * 100) : null;
  const scores = submitted.map(score).filter((n): n is number => n !== null);
  const independent = submitted.filter(a => !a.assisted).map(score).filter((n): n is number => n !== null);
  const latest = submitted.at(-1);
  const filled = Object.entries(state.draft.answers).filter(([k, v]) => chapterForPage(Number(k.split(":")[0])) === chapter && v.trim()).length;
  return { first: submitted[0] ? score(submitted[0]) : null, latest: latest ? score(latest) : null, best: scores.length ? Math.max(...scores) : null, bestUnassisted: independent.length ? Math.max(...independent) : null, attempts: submitted.length, answered: filled, totalFields, needsPractice: latest ? (score(latest) ?? 100) < 80 : false };
}
