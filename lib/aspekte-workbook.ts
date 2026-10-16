/** Shared workbook model and deterministic checking. No keys or filesystem here. */
export type WorkbookField = {
  id: string;
  label: string;
  options: string[];
  optionLabels?: Record<string, string>;
  multiple?: boolean;
  multiline?: boolean;
  segments?: number;
  answers: string[];
  evaluation: "exact" | "set" | "review" | "self";
};
export type WorkbookBlock = {
  type: "text" | "reading" | "quote" | "table" | "figure";
  title?: string;
  text?: string;
  headers?: string[];
  rows?: string[][];
  asset?: string;
  alt?: string;
  readingImage?: boolean;
};
export type WorkbookMarker = {
  type: "audio" | "solution" | "exam";
  label: string;
  position: "heading" | "content";
  track?: number;
  referencePage?: number;
  beforeBlock?: number;
  sourcePosition?: { x: number; y: number };
};
export type WorkbookExercise = {
  id: string;
  instruction: string;
  mode: "fill" | "choice" | "match" | "order" | "writing" | "speaking" | "self";
  wordBank: string[];
  wordBankLabels?: Record<string, string>;
  fields: WorkbookField[];
  checklist: string[];
  modelAnswer: string;
  solutionEvidence: string;
  solutionPage: number;
  notes: string;
  content?: WorkbookBlock[];
  markers?: WorkbookMarker[];
  requiresSource?: "lehrbuch";
  contextPages?: number[];
  contextExercises?: string[];
  relatedTracks?: number[];
};
export type WorkbookPage = {
  bookPage: number;
  section: string;
  kind: "exercises" | "vocabulary" | "self-assessment";
  tracks: number[];
  markers?: WorkbookMarker[];
  exercises: WorkbookExercise[];
  warnings: string[];
  content?: WorkbookBlock[];
  nativeContentVersion?: number;
};
export type StudyField = Omit<WorkbookField, "answers">;
export type StudyExercise = Omit<WorkbookExercise, "fields" | "modelAnswer" | "solutionEvidence"> & { fields: StudyField[] };
export type StudyPage = Omit<WorkbookPage, "exercises"> & { exercises: StudyExercise[]; ready: boolean; nativeReady: boolean };
export type WorkbookQuickFilter = "chapter" | "listening" | "revision";
export type WorkbookTrack = { number: number; available: boolean; seconds: number; bytes: number };
export type WorkbookChapter = { number: number; title: string; firstPage: number; lastPage: number; readyPages: number; nativePages: number; totalFields: number };
export type WorkbookManifest = {
  title: string; subtitle: string; editionIsbn: string; pdfPages: number;
  chapters: WorkbookChapter[]; tracks: WorkbookTrack[]; feedbackAvailable: boolean;
};
export type WorkbookAnswers = Record<string, string>;
export type FieldResult = {
  status: "correct" | "incorrect" | "unanswered" | "review" | "self";
  expected: string[];
};
export type CheckResult = { fields: Record<string, FieldResult>; correct: number; scored: number; unanswered: number; review: number };

export function workbookFieldKey(page: number, exercise: string, field: string) {
  return `${page}:${exercise}:${field}`;
}

export function normaliseWorkbookAnswer(answer: string) {
  const normalised = answer.normalize("NFKC").toLocaleLowerCase("de-DE")
    .replace(/\u001f/g, " ")
    .replace(/[„“”«»]/g, '"').replace(/[’‘]/g, "'")
    .replace(/[‐‑–—]/g, "-").replace(/\s+/g, " ").trim();
  // A punctuation-only answer is meaningful in intonation exercises.
  return /^[.!?]+$/.test(normalised) ? normalised : normalised.replace(/[.!?]+$/, "").trim();
}

export function workbookAnswerParts(answer: string, count: number) {
  const pieces = answer.includes("\u001f") ? answer.split("\u001f") : answer.trim().split(/\s+/);
  return Array.from({ length: count }, (_, i) => i === count - 1 ? pieces.slice(i).join(" ") : pieces[i] || "");
}

export function setWorkbookAnswerPart(answer: string, count: number, part: number, value: string) {
  const pieces = workbookAnswerParts(answer, count);
  pieces[part - 1] = value.replace(/\u001f/g, "");
  return pieces.some(value => value.trim()) ? pieces.join("\u001f") : "";
}

export function checkWorkbookPages(pages: WorkbookPage[], answers: WorkbookAnswers): CheckResult {
  const result: CheckResult = { fields: {}, correct: 0, scored: 0, unanswered: 0, review: 0 };
  for (const page of pages) for (const exercise of page.exercises) for (const field of exercise.fields) {
    const id = workbookFieldKey(page.bookPage, exercise.id, field.id);
    const answer = answers[id]?.trim() || "";
    if (exercise.requiresSource) { result.review++; result.fields[id] = { status: "review", expected: [] }; }
    else if (field.evaluation === "exact" || field.evaluation === "set") {
      result.scored++;
      const supplied = [...new Set(answer.split(/[,;\n]+/).map(normaliseWorkbookAnswer).filter(Boolean))].sort();
      const required = [...new Set(field.answers.map(normaliseWorkbookAnswer))].sort();
      const correct = answer !== "" && (field.evaluation === "set"
        ? JSON.stringify(supplied) === JSON.stringify(required)
        : field.answers.some(value => normaliseWorkbookAnswer(value) === normaliseWorkbookAnswer(answer)));
      if (correct) result.correct++;
      if (!answer) result.unanswered++;
      result.fields[id] = { status: !answer ? "unanswered" : correct ? "correct" : "incorrect", expected: field.answers };
    } else {
      if (field.evaluation === "review") result.review++;
      result.fields[id] = { status: field.evaluation === "self" ? "self" : "review", expected: answer ? field.answers : [] };
    }
  }
  return result;
}

export function studyPage(page: WorkbookPage): StudyPage {
  return { bookPage: page.bookPage, section: page.section, kind: page.kind, tracks: page.tracks, markers: page.markers, warnings: page.warnings, content: page.content, ready: true, nativeReady: !!page.nativeContentVersion,
    exercises: page.exercises.map(({ id, instruction, mode, wordBank, wordBankLabels, fields, checklist, solutionPage, notes, content, markers, requiresSource, contextPages, contextExercises, relatedTracks }) => ({ id, instruction, mode, wordBank, wordBankLabels, checklist, solutionPage, notes, content, markers, requiresSource, contextPages, contextExercises, relatedTracks,
      fields: fields.map(({ id, label, options, optionLabels, multiple, multiline, segments, evaluation }) => ({ id, label, options, optionLabels, multiple, multiline, segments, evaluation })),
    })),
  };
}

/** Keep whole exercises; chapter sessions wrap when the remaining pages have too few. */
export function workbookQuickSession(pages: StudyPage[], filter: WorkbookQuickFilter, startPage: number, due: ReadonlySet<string>) {
  const eligible = pages.flatMap(page => page.exercises
    .filter(exercise => !exercise.requiresSource)
    .filter(exercise => filter === "listening"
      ? exercise.markers?.some(marker => marker.type === "audio") || !!exercise.relatedTracks?.length
      : filter === "revision" ? due.has(`${page.bookPage}:${exercise.id}`) : exercise.fields.some(field => field.evaluation !== "self"))
    .map(exercise => ({ key: `${page.bookPage}:${exercise.id}`, page: page.bookPage })));
  const ordered = filter === "chapter"
    ? [...eligible.filter(item => item.page >= startPage), ...eligible.filter(item => item.page < startPage)]
    : eligible;
  return ordered.slice(0, 5).map(item => item.key);
}

/** Strict single HTTP range; suffix ranges and open-ended ranges support seeking. */
export function workbookByteRange(header: string | null, size: number) {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2])) return "invalid";
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(size - 1, Number(match[2])) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size || size < 1) return "invalid";
  return { start, end };
}

export function isLocalWorkbookRequest(url: string, origin?: string | null, fetchSite?: string | null) {
  try {
    const target = new URL(url);
    return ["localhost", "127.0.0.1", "[::1]"].includes(target.hostname)
      && (!origin || origin === target.origin)
      && (!fetchSite || fetchSite !== "cross-site");
  } catch { return false; }
}
