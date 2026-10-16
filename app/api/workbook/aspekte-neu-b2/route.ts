import { checkWorkbookPages, type WorkbookAnswers } from "@/lib/aspekte-workbook";
import { readStudyChapter, readWorkbookChapter } from "@/lib/aspekte-workbook-server";

import { changeWorkbookLearning } from "@/lib/workbook-learning-server";
import { chapterForPage } from "@/lib/workbook-study";
import { requireWorkbookAccess, workbookError, workbookSameOrigin } from "@/lib/workbook-access";

export const runtime = "nodejs";
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });


export async function GET(request: Request) {
  try { await requireWorkbookAccess(request); } catch (e) { return workbookError(e); }
  const chapter = Number(new URL(request.url).searchParams.get("chapter"));
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > 10) return json({ message: "Choose chapter 1–10." }, 400);
  return json({ pages: await readStudyChapter(chapter) });
}

export async function POST(request: Request) {
  let access;
  try { access = await requireWorkbookAccess(request); } catch (e) { return workbookError(e); }
  if (!workbookSameOrigin(request)) return json({ message: "Invalid request origin." }, 403);
  try {
    // Check the actual stream, not just the caller-supplied content length.
    const reader = request.body?.getReader();
    if (!reader) return json({ message: "No answers supplied." }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 3_000_000) { await reader.cancel(); return json({ message: "Answer submission is too large." }, 413); }
      chunks.push(value);
    }
    const input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!Number.isInteger(input.chapter) || input.chapter < 1 || input.chapter > 10 || (input.scope !== undefined && input.scope !== "book") || !input.answers || typeof input.answers !== "object" || Array.isArray(input.answers)) return json({ message: "Invalid answer submission." }, 400);
    const answers: WorkbookAnswers = Object.create(null);
    for (const [key, value] of Object.entries(input.answers)) {
      if (key.length > 100 || typeof value !== "string" || value.length > 5000) return json({ message: "Invalid answer field." }, 400);
      answers[key] = value;
    }
    const wholeBook = input.scope === "book";
    let pages = wholeBook ? (await Promise.all(Array.from({ length: 10 }, (_, i) => readWorkbookChapter(i + 1)))).flat() : await readWorkbookChapter(input.chapter);
    if (input.page !== undefined) {
      if (!Number.isInteger(input.page) || !pages.some(p => p.bookPage === input.page)) return json({ message: "Page is not ready." }, 404);
      pages = pages.filter(p => p.bookPage === input.page);
    }
    const complete = pages.length === (input.page === undefined ? wholeBook ? 140 : 14 : 1);
    const result = checkWorkbookPages(pages, answers);
    await changeWorkbookLearning(access, state => {
      for (const page of pages) { const chapter = chapterForPage(page.bookPage); if (!state.draft.assisted.includes(chapter)) state.draft.assisted.push(chapter); }
    });
    return json({ result, complete });
  } catch { return json({ message: "Unable to check these answers. Please try again." }, 400); }
}
