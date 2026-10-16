import { createHash } from "node:crypto";
import { changeWorkbookLearning, readWorkbookLearning } from "@/lib/workbook-learning-server";
import { chapterForPage } from "@/lib/workbook-study";
import { requireWorkbookAccess, workbookSameOrigin, workbookError, WorkbookAccessError } from "@/lib/workbook-access";
import { createAdminClient } from "@/utils/supabase/admin";
import { readWorkbookPage } from "@/lib/aspekte-workbook-server";
import { generateAcademyLanguageFeedback } from "@/lib/academy-language-feedback";
import { getAcademyRecordingFormat } from "@/lib/academy-recording";
import { readWorkbookRecordingTicket } from "@/lib/workbook-recording-ticket";

export const runtime = "nodejs";
export const maxDuration = 60;
const MAX_BYTES = 10 * 1024 * 1024 + 30_000;
const requests: number[] = [];
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  let access;
  try { access = await requireWorkbookAccess(request); } catch (e) { return workbookError(e); }
  if (!workbookSameOrigin(request)) return json({ message: "Invalid request origin." }, 403);
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return json({ message: "Gemini is not configured. Your answers are still saved locally." }, 503);
  const now = Date.now();
  while (requests[0] < now - 3_600_000) requests.shift();
  if (access.local && (requests.length >= 30 || requests.filter(time => time > now - 60_000).length >= 5)) return json({ message: "Please wait before requesting more feedback." }, 429);
  let temporaryPath: string | undefined;
  try {
    const reader = request.body?.getReader();
    if (!reader) return json({ message: "No answer supplied." }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) { await reader.cancel(); return json({ message: "Maximum recording size is 10 MB." }, 413); }
      chunks.push(value);
    }
    const form = await new Response(Buffer.concat(chunks), { headers: { "Content-Type": request.headers.get("content-type") || "" } }).formData();
    if (form.get("accountId") !== access.id) return json({ message: "Your account changed. Reload before requesting feedback." }, 401);
    const page = await readWorkbookPage(Number(form.get("page")));
    const exercise = page?.exercises.find(e => e.id === form.get("exercise"));
    if (!page || !exercise) return json({ message: "Exercise not found." }, 404);
    const before = await readWorkbookLearning(access);
    const run = before.draft.exerciseRuns?.[`${page.bookPage}:${exercise.id}`] || before.draft.runs[String(chapterForPage(page.bookPage))] || "initial";
    let text: string | undefined;
    let audio: { mimeType: string; data: string } | undefined;
    const recording = form.get("audio");
    if (form.has("audioTicket")) {
      const ticket = readWorkbookRecordingTicket(form.get("audioTicket"), process.env.SUPABASE_SERVICE_ROLE_KEY || "");
      if (access.local || !ticket || ticket.user !== access.id || ticket.exercise !== `${page.bookPage}:${exercise.id}` || ticket.purpose !== "feedback") return json({ message: "This upload does not belong to the requested feedback. Your local recording is safe." }, 400);
      temporaryPath = ticket.path;
      if (ticket.run !== run) return json({ message: "This exercise attempt changed. Request feedback again for the current attempt." }, 409);
      const bucket = createAdminClient().storage.from("workbook-recordings");
      const info = await bucket.info(ticket.path);
      if (info.error) return json({ message: "The audio upload has not finished. Retry feedback; your local recording is safe." }, 409);
      if ((info.data.size ?? info.data.metadata?.size) !== ticket.bytes || (info.data.contentType ?? info.data.metadata?.mimetype) !== ticket.mime) return json({ message: "The uploaded audio does not match this feedback request." }, 400);
      const downloaded = await bucket.download(ticket.path);
      if (downloaded.error || downloaded.data.size !== ticket.bytes) throw new Error("Temporary audio could not be read.");
      audio = { mimeType: ticket.mime, data: Buffer.from(await downloaded.data.arrayBuffer()).toString("base64") };
    } else if (recording instanceof File) {
      const format = getAcademyRecordingFormat(recording.type === "audio/x-m4a" ? "audio/mp4" : recording.type);
      if (!format || !recording.size || recording.size > 10 * 1024 * 1024) return json({ message: "Use WebM, M4A/MP4 or Ogg audio, up to 10 MB." }, 400);
      audio = { mimeType: format.contentType, data: Buffer.from(await recording.arrayBuffer()).toString("base64") };
    } else {
      text = String(form.get("text") || "").trim();
      if (!text || text.length > 10000) return json({ message: "Enter an answer of up to 10,000 characters including exercise labels." }, 400);
    }
    if (!access.local) {
      const { data, error } = await createAdminClient().rpc("workbook_feedback_quota", { target_user: access.id });
      if (error) return json({ message: "Feedback limits could not be checked. Retry later." }, 503);
      if (!data) return json({ message: "Please wait before requesting more feedback." }, 429);
    } else requests.push(now);
    const blocks = [...(exercise.content || [])];
    for (const reference of exercise.contextExercises || []) {
      const [number, id] = reference.split(":"); const source = (await readWorkbookPage(Number(number)))?.exercises.find(e => e.id === id);
      if (source) blocks.push({ type: "text", title: `Related exercise ${reference}`, text: source.instruction }, ...(source.content || []));
    }
    for (const number of exercise.contextPages || []) blocks.push(...((await readWorkbookPage(number))?.content || []));
    const context = blocks.map(block => [block.title || "", block.text || "", ...(block.rows || []).map(row => row.join(" | "))].join("\n")).join("\n").slice(0, 8000);
    const feedback = await generateAcademyLanguageFeedback({ apiKey, courseTitle: "Aspekte neu · Deutsch B2", prompt: `${exercise.instruction}\n${exercise.fields.map(f => f.label).join("\n")}\nSource context (blanks are marked {{id}}):\n${context}`, checklist: exercise.checklist,
      modelAnswer: exercise.modelAnswer || exercise.fields.map(f => `${f.label}: ${f.answers.join(" / ")}`).join("\n"), text, audio });
    let saved = false;
    try {
      await changeWorkbookLearning(access, state => {
        const chapter = chapterForPage(page.bookPage);
        const activeRun = state.draft.exerciseRuns?.[`${page.bookPage}:${exercise.id}`] || state.draft.runs[String(chapter)] || "initial";
        if (activeRun === run && exercise.fields.some(f => f.evaluation === "exact" || f.evaluation === "set") && !state.draft.assisted.includes(chapter)) state.draft.assisted.push(chapter);
        state.feedback ||= [];
        state.feedback.push({ id: crypto.randomUUID(), page: page.bookPage, exercise: exercise.id, run, at: new Date().toISOString(), inputText: text, inputDigest: createHash("sha256").update(text || audio?.data || "").digest("hex"), feedback });
      }); saved = true;
    } catch { /* Provider feedback remains available even when the optional history save fails. */ }
    return json({ feedback, saved });
  } catch (error) {
    if (error instanceof WorkbookAccessError) return workbookError(error);
    return json({ message: "Gemini feedback is temporarily unavailable. Your saved answers are safe; please try again." }, 503);
  } finally {
    if (temporaryPath) {
      try { await createAdminClient().storage.from("workbook-recordings").remove([temporaryPath]); }
      catch { /* Unreferenced uploads are retried by upload cleanup and account deletion. */ }
    }
  }
}
