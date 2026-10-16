import { createHash } from "node:crypto";
import { requireWorkbookAccess, workbookError, workbookSameOrigin, workbookRequestJson, WorkbookAccessError } from "@/lib/workbook-access";
import { readWorkbookLearning, changeWorkbookLearning } from "@/lib/workbook-learning-server";
import { readWorkbookChapter, readWorkbookPage } from "@/lib/aspekte-workbook-server";
import { chapterForPage, validateWorkbookDraft, recordWorkbookAttempt, queueWorkbookReview, advanceWorkbookReview } from "@/lib/workbook-study";
export const runtime = "nodejs";
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
export async function GET(request: Request) {
  try { const access = await requireWorkbookAccess(request); const expected = new URL(request.url).searchParams.get("account"); if (expected && expected !== access.id) throw new WorkbookAccessError(401, "Your signed-in account changed. Reload before continuing."); return json({ state: await readWorkbookLearning(access), account: { id: access.id, local: access.local, email: access.email } }); } catch (e) { return workbookError(e); }
}
export async function POST(request: Request) {
  try {
    if (!workbookSameOrigin(request)) throw new WorkbookAccessError(403, "Invalid request origin.");
    const access = await requireWorkbookAccess(request); const input = await workbookRequestJson(request);
    if (input.accountId !== access.id) throw new WorkbookAccessError(401, "Your signed-in account changed. Reload before continuing.");
    if (!Number.isSafeInteger(input.revision) || input.revision < 0) throw new WorkbookAccessError(400, "Invalid study revision.");
    if (input.action === "save") {
      let draft; try { draft = validateWorkbookDraft(input.draft); } catch (e) { throw new WorkbookAccessError(400, e instanceof Error ? e.message : "Invalid study draft."); }
      const outcome = await changeWorkbookLearning(access, state => {
        // Runs and assistance are server-controlled so another device cannot resurrect an old attempt.
        state.draft = { ...draft, runs: state.draft.runs, exerciseRuns: state.draft.exerciseRuns, assisted: state.draft.assisted, revealed: state.draft.revealed };
      }, input.revision);
      return "conflict" in outcome ? json({ state: outcome.conflict }, 409) : json({ state: outcome.state });
    }
    const chapter = Number(input.chapter);
    if (!Number.isInteger(chapter) || chapter < 1 || chapter > 10) throw new WorkbookAccessError(400, "Choose a valid chapter.");
    if (input.action === "assist") {
      const outcome = await changeWorkbookLearning(access, state => { if (!state.draft.assisted.includes(chapter)) state.draft.assisted.push(chapter); });
      return json({ state: outcome.state });
    }
    if (input.action === "queue") {
      const page = await readWorkbookPage(Number(input.page)); const exercise = page?.exercises.find(e => e.id === input.exercise);
      if (!page || !exercise || chapterForPage(page.bookPage) !== chapter || !["uncertain", "skipped"].includes(input.reason)) throw new WorkbookAccessError(400, "Choose an exercise to revise.");
      const outcome = await changeWorkbookLearning(access, state => queueWorkbookReview(state, page.bookPage, exercise.id, input.reason, new Date().toISOString()));
      return json({ state: outcome.state });
    }
    if (input.action === "self-review") {
      const page = await readWorkbookPage(Number(input.page)); const exercise = page?.exercises.find(e => e.id === input.exercise);
      if (!page || !exercise || exercise.requiresSource || chapterForPage(page.bookPage) !== chapter || exercise.fields.some(f => f.evaluation === "exact" || f.evaluation === "set")) throw new WorkbookAccessError(400, "Use answer checking for fixed-answer tasks.");
      const outcome = await changeWorkbookLearning(access, state => {
        const now = new Date().toISOString(); const key = `${page.bookPage}:${exercise.id}`;
        if (!state.reviews.some(r => r.key === key)) queueWorkbookReview(state, page.bookPage, exercise.id, "uncertain", now);
        const i = state.reviews.findIndex(r => r.key === key);
        if (state.reviews[i].due && Date.parse(state.reviews[i].due!) <= Date.parse(now)) state.reviews[i] = advanceWorkbookReview(state.reviews[i], true, now);
      });
      return json({ state: outcome.state });
    }
    if (!["submit", "retry", "start-session"].includes(input.action) || typeof input.id !== "string" || !/^[a-zA-Z0-9-]{16,100}$/.test(input.id)) throw new WorkbookAccessError(400, "Invalid study action.");
    const current = await readWorkbookLearning(access);
    const existing = current.attempts.find(a => a.id === input.id);
    if (existing) return json({ state: current, attempt: existing });
    let pages = await readWorkbookChapter(chapter);
    if (pages.length !== 14) throw new WorkbookAccessError(503, "This chapter is unavailable.");
    if (input.action === "start-session" || input.action === "submit" && input.kind === "practice") {
      if (!Array.isArray(input.exercises) || !input.exercises.length || input.exercises.length > 30 || input.exercises.some((k: unknown) => typeof k !== "string")) throw new WorkbookAccessError(400, "Choose exercises for this session.");
      pages = pages.map(p => ({ ...p, exercises: p.exercises.filter(e => input.exercises.includes(`${p.bookPage}:${e.id}`)) })).filter(p => p.exercises.length);
      if (!pages.length) throw new WorkbookAccessError(400, "Exercises not found.");
    } else if (input.action === "submit" && input.kind !== "chapter") throw new WorkbookAccessError(400, "Invalid attempt type.");
    const version = createHash("sha256").update(JSON.stringify(pages)).digest("hex");
    const outcome = await changeWorkbookLearning(access, state => {
      const prior = state.attempts.find(a => a.id === input.id); if (prior) return prior;
      const attempt = recordWorkbookAttempt(state, pages, { id: input.id, chapter, kind: input.action === "retry" || input.action === "start-session" ? "archive" : input.kind, now: new Date().toISOString(), contentVersion: version, revisionSession: !!input.revisionSession, finishSession: !!input.finishSession });
      if (input.action === "start-session") {
        const keys = new Set(pages.flatMap(p => p.exercises.flatMap(e => e.fields.map(f => `${p.bookPage}:${e.id}:${f.id}`))));
        for (const key of keys) { delete state.draft.answers[key]; delete state.draft.revealed[key]; }
        state.draft.exerciseRuns ||= {};
        for (const page of pages) for (const exercise of page.exercises) state.draft.exerciseRuns[`${page.bookPage}:${exercise.id}`] = input.id;
      }
      if (input.action === "retry") {
        for (const key of Object.keys(state.draft.answers)) if (chapterForPage(Number(key.split(":")[0])) === chapter) delete state.draft.answers[key];
        for (const key of Object.keys(state.draft.revealed)) if (chapterForPage(Number(key.split(":")[0])) === chapter) delete state.draft.revealed[key];
        for (const key of Object.keys(state.draft.exerciseRuns || {})) if (chapterForPage(Number(key.split(":")[0])) === chapter) delete state.draft.exerciseRuns![key];
        state.draft.runs[String(chapter)] = input.id; state.draft.assisted = state.draft.assisted.filter(n => n !== chapter);
        state.draft.position = { ...state.draft.position, page: 6 + (chapter - 1) * 14, exercise: null, view: "book" };
      }
      return attempt;
    }, input.revision);
    return "conflict" in outcome ? json({ state: outcome.conflict }, 409) : json({ state: outcome.state, attempt: outcome.value });
  } catch (e) { return workbookError(e); }
}
