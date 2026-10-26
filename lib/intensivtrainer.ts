import { parseAcademyLanguageFeedback, type AcademyLanguageFeedback } from "./academy-language-feedback.ts";
/** Personal Intensivtrainer model. Source data stays outside the deployment. */
export const TRAINER_KEY = "aspekte-neu-b2-intensivtrainer";
export const TRAINER_STORAGE = `${TRAINER_KEY}:v1`;
export type TrainerField = { id: string; label: string; multiline?: boolean };
export type TrainerExercise = { id: string; title: string; asset: string; transcript: string; fields: TrainerField[]; writing: boolean; sourceDependent: boolean };
export type TrainerWord = { id: string; text: string; category: string };
export type TrainerPage = { nativeVersion?: number; nativeExercises?: import("./aspekte-workbook").StudyExercise[]; number: number; pdfPage: number | null; section: string; status: "ready" | "damaged" | "missing"; warning: string; exercises: TrainerExercise[]; words: TrainerWord[] };
export type TrainerChapter = { number: number; title: string; firstPage: number; lastPage: number };
export type TrainerManifest = { title: string; chapters: TrainerChapter[]; pages: Omit<TrainerPage, "exercises" | "words">[]; exerciseCount: number; wordCount: number; sourceNotice: string; feedbackAvailable?: boolean };
export type TrainerArchive = { id: string; at: string; page: number; exercise: string; answers: Record<string, string> };
export type TrainerState = { history?: TrainerArchive[]; feedback?: Record<string, { at: string; inputText: string; feedback: AcademyLanguageFeedback }>; version: 1; book: typeof TRAINER_KEY; page: number; answers: Record<string, string>; notes: Record<string, string>; review: Record<string, "again" | "done">; extra: Record<string, number>; savedAt: string };
export const trainerTaskKey = (page: number, exercise: string) => `${page}:${exercise}`;
export const trainerAnswerKey = (page: number, exercise: string, field: string) => `${page}:${exercise}:${field}`;
export const emptyTrainerState = (): TrainerState => ({ version: 1, book: TRAINER_KEY, page: 4, answers: {}, notes: {}, review: {}, extra: {}, savedAt: "" });

/** Reject another book, unsafe keys and oversized backups before touching existing work. */
export function parseTrainerState(value: unknown): TrainerState {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("This is not an Intensivtrainer backup.");
  const v = value as TrainerState;
  if (v.version !== 1 || v.book !== TRAINER_KEY || !Number.isInteger(v.page) || v.page < 4 || v.page > 83) throw new Error("This backup belongs to a different book or version.");
  const record = (obj: unknown, pattern: RegExp, max: number, validate: (v: unknown) => boolean) => {
    if (!obj || typeof obj !== "object" || Array.isArray(obj) || Object.keys(obj).length > max) throw new Error("Invalid backup data.");
    for (const [key, val] of Object.entries(obj)) if (!pattern.test(key) || !validate(val)) throw new Error("Invalid backup entry.");
  };
  const text = (v: unknown) => typeof v === "string" && v.length <= 20000;
  record(v.answers, /^\d{1,2}:[a-zA-Z0-9-]{1,32}:[a-zA-Z0-9-]{1,32}$/, 20000, text);
  record(v.notes, /^(?:[4-9]|[1-7]\d|8[0-3])$/, 80, text);
  record(v.review, /^\d{1,2}:[a-zA-Z0-9-]{1,32}$/, 5000, x => x === "again" || x === "done");
  record(v.extra, /^\d{1,2}:[a-zA-Z0-9-]{1,32}$/, 1000, x => Number.isInteger(x) && Number(x) >= 0 && Number(x) <= 30);
  const history: TrainerArchive[] = [];
  if (v.history) {
    if (!Array.isArray(v.history) || v.history.length > 300) throw new Error("Invalid attempt archive.");
    for (const item of v.history) {
      if (!item || typeof item.id !== "string" || !/^[a-zA-Z0-9-]{10,100}$/.test(item.id) || typeof item.at !== "string" || !Number.isInteger(item.page) || item.page<4 || item.page>83 || !/^[a-zA-Z0-9-]{1,32}$/.test(item.exercise)) throw new Error("Invalid archived attempt.");
      record(item.answers, /^\d{1,2}:[a-zA-Z0-9-]{1,32}:[a-zA-Z0-9-]{1,32}$/, 1000, text);
      if (Object.keys(item.answers).some(key=>!key.startsWith(`${item.page}:${item.exercise}:`))) throw new Error("Invalid archived answer scope.");
      history.push({ id:item.id, at:item.at.slice(0,40), page:item.page, exercise:item.exercise, answers:{...item.answers} });
    }
  }
  const feedback: NonNullable<TrainerState["feedback"]> = {};
  if (v.feedback) {
    if (typeof v.feedback !== "object" || Array.isArray(v.feedback) || Object.keys(v.feedback).length > 500) throw new Error("Invalid feedback history.");
    for (const [key, item] of Object.entries(v.feedback)) {
      if (!/^\d{1,2}:[a-zA-Z0-9-]{1,32}$/.test(key) || !item || typeof item.at !== "string" || typeof item.inputText !== "string" || item.inputText.length > 10000) throw new Error("Invalid feedback entry.");
      feedback[key] = { at: item.at.slice(0,40), inputText: item.inputText, feedback: parseAcademyLanguageFeedback(JSON.stringify(item.feedback)) };
    }
  }
  return { version: 1, book: TRAINER_KEY, page: v.page, answers: { ...v.answers }, notes: { ...v.notes }, review: { ...v.review }, extra: { ...v.extra }, ...(Object.keys(feedback).length ? { feedback } : {}), ...(history.length ? { history } : {}), savedAt: typeof v.savedAt === "string" ? v.savedAt.slice(0, 40) : "" };
}

export function trainerLocalRequest(url: string, headers: Headers, environment: string | undefined) {
  if (environment !== "development") return false;
  try {
    const u = new URL(url);
    const loopback = (hostname: string) => ["localhost", "127.0.0.1", "[::1]"].includes(hostname);
    // Next's development adapter can normalize Host to localhost. Preserve the
    // original forwarded host for origin checks, and validate both representations.
    const host = headers.get("x-forwarded-host") || headers.get("host") || u.host;
    const external = new URL(`${u.protocol}//${host}`);
    const internalHost = new URL(`${u.protocol}//${headers.get("host") || u.host}`);
    const origin = headers.get("origin");
    return loopback(u.hostname) && loopback(external.hostname) && loopback(internalHost.hostname)
      && external.port === u.port && internalHost.port === u.port
      && (!origin || origin === external.origin)
      && !["cross-site", "same-site"].includes(headers.get("sec-fetch-site") || "");
  } catch { return false; }
}

/** Merge independent account edits while keeping same-field choices explicit. */
export function mergeTrainerStates(base: TrainerState, local: TrainerState, remote: TrainerState, choice?: "local" | "remote") {
  const state = structuredClone(remote); const conflicts: string[] = [];
  for (const group of ["answers", "notes", "review", "extra"] as const) {
    for (const key of new Set([...Object.keys(base[group]), ...Object.keys(local[group]), ...Object.keys(remote[group])])) {
      const b=base[group][key], l=local[group][key], r=remote[group][key];
      if (l === b) continue;
      if (r !== b && l !== r) { conflicts.push(`${group}:${key}`); if (choice !== "local") continue; }
      if (l === undefined) delete state[group][key]; else Object.assign(state[group], { [key]: l });
    }
  }
  const archives = new Map([...(remote.history || []), ...(local.history || [])].map(item=>[item.id,item]));
  if (archives.size) state.history=[...archives.values()];
  state.page=local.page;
  return { state, conflicts };
}
