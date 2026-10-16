import { createAdminClient } from "@/utils/supabase/admin";
import { requireWorkbookAccess, workbookError, workbookSameOrigin, WorkbookAccessError, WORKBOOK_KEY } from "@/lib/workbook-access";
import { readWorkbookLearning } from "@/lib/workbook-learning-server";
import { readWorkbookPage } from "@/lib/aspekte-workbook-server";
import { chapterForPage } from "@/lib/workbook-study";
import { getAcademyRecordingFormat } from "@/lib/academy-recording";
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
async function target(request: Request) {
  const access = await requireWorkbookAccess(request); if (access.local) throw new WorkbookAccessError(400, "Cloud recording saves require an invited account.");
  if (new URL(request.url).searchParams.get("account") !== access.id) throw new WorkbookAccessError(401, "Your account changed. Reload before saving a recording.");
  const exercise = new URL(request.url).searchParams.get("exercise") || "";
  const [pageNumber, id] = exercise.split(":"); const page = await readWorkbookPage(Number(pageNumber));
  if (!page || !page.exercises.some(e => e.id === id && e.mode === "speaking")) throw new WorkbookAccessError(404, "Speaking exercise not found.");
  const state = await readWorkbookLearning(access); const run = state.draft.exerciseRuns?.[exercise] || state.draft.runs[String(chapterForPage(page.bookPage))] || "initial";
  return { access, exercise, run, admin: createAdminClient() };
}
export async function GET(request: Request) {
  try {
    const { access, exercise, run, admin } = await target(request);
    const { data, error } = await admin.from("workbook_recordings").select("id,storage_path,created_at").eq("user_id", access.id).eq("book_key", WORKBOOK_KEY).eq("exercise_key", exercise).eq("run_id", run).maybeSingle();
    if (error) throw error; if (!data) return json({ recording: null });
    const signed = await admin.storage.from("workbook-recordings").createSignedUrl(data.storage_path, 300); if (signed.error) throw signed.error;
    return json({ recording: { id: data.id, url: signed.data.signedUrl, createdAt: data.created_at } });
  } catch (e) { return workbookError(e); }
}
export async function POST(request: Request) {
  try {
    if (!workbookSameOrigin(request)) throw new WorkbookAccessError(403, "Invalid request origin.");
    const { access, exercise, run, admin } = await target(request);
    const limit = 10 * 1024 * 1024 + 30000; const reader = request.body?.getReader(); if (!reader) throw new WorkbookAccessError(400, "No recording supplied.");
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) { const { value, done } = await reader.read(); if (done) break; size += value.byteLength; if (size > limit) { await reader.cancel(); throw new WorkbookAccessError(413, "Use a recording under 10 MB."); } chunks.push(value); }
    const form = await new Response(Buffer.concat(chunks), { headers: { "Content-Type": request.headers.get("content-type") || "" } }).formData();
    const file = form.get("audio"); if (!(file instanceof File) || !file.size || file.size > 10 * 1024 * 1024) throw new WorkbookAccessError(400, "Use a recording under 10 MB.");
    const format = getAcademyRecordingFormat(file.type === "audio/x-m4a" ? "audio/mp4" : file.type); if (!format) throw new WorkbookAccessError(400, "Use WebM, M4A/MP4 or Ogg.");
    const existing = await admin.from("workbook_recordings").select("id,storage_path,cleanup_paths").eq("user_id", access.id).eq("book_key", WORKBOOK_KEY).eq("exercise_key", exercise).eq("run_id", run).maybeSingle(); if (existing.error) throw existing.error;
    const path = `${access.id}/${WORKBOOK_KEY}/${crypto.randomUUID()}.${format.extension}`;
    const upload = await admin.storage.from("workbook-recordings").upload(path, file, { contentType: format.contentType }); if (upload.error) throw upload.error;
    const pending = existing.data ? [...new Set([existing.data.storage_path, ...(existing.data.cleanup_paths || [])])] : [];
    const values = { user_id: access.id, book_key: WORKBOOK_KEY, exercise_key: exercise, run_id: run, storage_path: path, cleanup_paths: pending, mime_type: format.contentType, created_at: new Date().toISOString() };
    const saved = existing.data
      ? await admin.from("workbook_recordings").update(values).eq("id", existing.data.id).eq("user_id", access.id).eq("storage_path", existing.data.storage_path).select("id")
      : await admin.from("workbook_recordings").insert(values).select("id");
    if (saved.error || !saved.data?.length) {
      await admin.storage.from("workbook-recordings").remove([path]);
      throw new WorkbookAccessError(409, "Another device saved a recording. Your local recording is safe; reload and choose whether to replace it.");
    }
    if (pending.length) {
      const removed = await admin.storage.from("workbook-recordings").remove(pending);
      if (removed.error) return json({ ok: true, warning: "New recording saved. Previous files await cleanup and will be removed when you delete this account recording." });
      await admin.from("workbook_recordings").update({ cleanup_paths: [] }).eq("user_id", access.id).eq("storage_path", path);
    }
    return json({ ok: true });
  } catch (e) { return workbookError(e); }
}
export async function DELETE(request: Request) {
  try {
    if (!workbookSameOrigin(request)) throw new WorkbookAccessError(403, "Invalid request origin.");
    const { access, exercise, run, admin } = await target(request);
    const { data, error } = await admin.from("workbook_recordings").select("id,storage_path,cleanup_paths").eq("user_id", access.id).eq("book_key", WORKBOOK_KEY).eq("exercise_key", exercise).eq("run_id", run).maybeSingle(); if (error) throw error;
    if (data) {
      const removed = await admin.storage.from("workbook-recordings").remove([data.storage_path, ...(data.cleanup_paths || [])]); if (removed.error) throw removed.error;
      const deleted = await admin.from("workbook_recordings").delete().eq("id", data.id).eq("user_id", access.id).eq("storage_path", data.storage_path).select("id"); if (deleted.error) throw deleted.error; if (!deleted.data?.length) throw new WorkbookAccessError(409, "Another device saved a new recording. Review it before deleting.");
    }
    return json({ ok: true });
  } catch (e) { return workbookError(e); }
}
