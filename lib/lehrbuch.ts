/** Personal textbook reflections. No source material or credentials in this model. */
export const LEHRBUCH_KEY = 'aspekte-neu-b2-lehrbuch';
export const LEHRBUCH_API = `/api/workbook/${LEHRBUCH_KEY}`;
export type LehrbuchEntry = { id: string; page: number; kind: string; title: string; body: string; resolved: number; x: number | null; y: number | null; revision: number; updated: string };
export function parseLehrbuchEntry(value: unknown): LehrbuchEntry {
  const e = value as LehrbuchEntry;
  if (!e || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(e.id) || !Number.isInteger(e.page) || e.page < 1 || e.page > 202 || !['question', 'answer', 'reflection', 'vocabulary', 'bookmark'].includes(e.kind) || typeof e.title !== 'string' || e.title.length > 1000 || typeof e.body !== 'string' || e.body.length > 40000 || !Number.isSafeInteger(e.revision) || e.revision < 0 || ![0, 1].includes(e.resolved) || ![e.x, e.y].every(n => n === null || Number.isInteger(n) && n >= 0 && n <= 10000)) throw new Error('Invalid textbook journal entry.');
  return { id: e.id, page: e.page, kind: e.kind, title: e.title, body: e.body, resolved: e.resolved, x: e.x, y: e.y, revision: e.revision, updated: typeof e.updated === 'string' ? e.updated.slice(0, 40) : '' };
}
export function lehrbuchLocalRequest(request: Request, environment: string | undefined) {
  if (environment !== 'development') return false;
  try {
    const url = new URL(request.url);
    const loopback = (h: string) => ['localhost', '127.0.0.1', '[::1]'].includes(h);
    const external = new URL(`${url.protocol}//${request.headers.get('x-forwarded-host') || request.headers.get('host') || url.host}`);
    const internal = new URL(`${url.protocol}//${request.headers.get('host') || url.host}`);
    const origin = request.headers.get('origin');
    return [url, external, internal].every(u => loopback(u.hostname) && u.port === url.port)
      && (!origin || origin === external.origin)
      && !['cross-site', 'same-site'].includes(request.headers.get('sec-fetch-site') || '');
  } catch { return false; }
}

export type LehrbuchNativePage = {
  nativeVersion: 1;
  pdfPage: number;
  bookPage: number;
  section: string;
  kind: 'exercises' | 'reference' | 'intro' | 'front';
  content: import('./aspekte-workbook').WorkbookBlock[];
  exercises: import('./aspekte-workbook').StudyExercise[];
  entryIds: Record<string, string>;
  exerciseNotes: Record<string, { question: string; reflection: string; review: string }>;
  notices: string[];
};
