import { requireTrainerAccess, readTrainerPage, readTrainerState, saveTrainerState } from "@/lib/intensivtrainer-server";
import { workbookError, workbookSameOrigin, WorkbookAccessError } from "@/lib/workbook-access";
import { createAdminClient } from "@/utils/supabase/admin";
import { generateAcademyLanguageFeedback } from "@/lib/academy-language-feedback";
export const runtime = "nodejs";
export const maxDuration = 60;
const recent: number[] = [];
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
export async function POST(request: Request) {
  try {
    const access = await requireTrainerAccess(request);
    if (!workbookSameOrigin(request)) throw new WorkbookAccessError(403, "Invalid request origin.");
    if (!process.env.GEMINI_API_KEY) throw new WorkbookAccessError(503, "Language feedback is not configured.");
    const reader = request.body?.getReader(); if (!reader) throw new WorkbookAccessError(400, "Enter your answer first.");
    const chunks: Uint8Array[] = []; let bytes = 0;
    while (true) { const { done, value } = await reader.read(); if (done) break; bytes += value.byteLength; if (bytes > 100_000) { await reader.cancel(); throw new WorkbookAccessError(413, "Use a written answer of up to 10,000 characters."); } chunks.push(value); }
    const form = await new Response(Buffer.concat(chunks), { headers: { "Content-Type": request.headers.get("content-type") || "" } }).formData();
    if (form.get("accountId") !== access.id) throw new WorkbookAccessError(401, "Your signed-in account changed.");
    const page = await readTrainerPage(Number(form.get("page"))), exercise = page?.nativeExercises?.find(e => e.id === form.get("exercise"));
    if (!page || !exercise) throw new WorkbookAccessError(404, "Exercise unavailable.");
    const text = String(form.get("text") || "").trim();
    if (!text || text.length > 10000 || form.has("audio")) throw new WorkbookAccessError(400, "Enter a written answer of up to 10,000 characters.");
    if (access.local) {
      const now = Date.now(); while (recent[0] < now - 3600000) recent.shift();
      if (recent.length >= 30 || recent.filter(n => n > now - 60000).length >= 5) throw new WorkbookAccessError(429, "Please wait before requesting more feedback.");
      recent.push(now);
    } else {
      const quota = await createAdminClient().rpc("workbook_feedback_quota", { target_user: access.id });
      if (quota.error) throw new WorkbookAccessError(503, "Feedback limits could not be checked.");
      if (!quota.data) throw new WorkbookAccessError(429, "Please wait before requesting more feedback.");
    }
    const context = (exercise.content || []).map(b => [b.title || "", b.text || "", ...(b.rows || []).map(row => row.join(" | "))].join("\n")).join("\n").slice(0,8000);
    const feedback = await generateAcademyLanguageFeedback({ apiKey: process.env.GEMINI_API_KEY, courseTitle: "Aspekte neu B2 · Intensivtrainer", prompt: `${exercise.instruction}\n${exercise.fields.map(f => f.label).join("\n")}\nSource context:\n${context}`, checklist: exercise.checklist, modelAnswer: "No published solution was supplied. Assess the learner's German and task fulfilment; accept valid alternatives and give no official grade.", text });
    let saved = false;
    for (let i = 0; i < 5 && !saved; i++) {
      const current = await readTrainerState(access);
      current.state.feedback = { ...current.state.feedback, [`${page.number}:${exercise.id}`]: { at: new Date().toISOString(), inputText: text, feedback } };
      saved = await saveTrainerState(access, current.state, current.revision);
    }
    return json({ feedback, saved });
  } catch (e) { return e instanceof WorkbookAccessError ? workbookError(e) : json({ message: "Language feedback is temporarily unavailable. Your work is safe; please retry." }, 503); }
}
