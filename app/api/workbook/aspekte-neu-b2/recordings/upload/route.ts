import { workbookError, workbookSameOrigin, workbookRequestJson, WorkbookAccessError, WORKBOOK_KEY } from "@/lib/workbook-access";
import { workbookRecordingTarget } from "@/lib/workbook-recording-target";
import { readWorkbookRecordingTicket, signWorkbookRecordingTicket, WORKBOOK_RECORDING_LIMIT } from "@/lib/workbook-recording-ticket";
import { getAcademyRecordingFormat } from "@/lib/academy-recording";

export const runtime = "nodejs";
const json = (data: unknown) => Response.json(data, { headers: { "Cache-Control": "private, no-store" } });
type Target = Awaited<ReturnType<typeof workbookRecordingTarget>>;
async function records(target: Target) {
  const { data, error } = await target.admin.from("workbook_recordings").select("id,exercise_key,run_id,storage_path,cleanup_paths").eq("user_id", target.access.id).eq("book_key", WORKBOOK_KEY);
  if (error) throw error;
  return data || [];
}
async function discard(target: Target, path: string) {
  const rows = await records(target);
  if (rows.some(row => row.storage_path === path || row.cleanup_paths?.includes(path))) return;
  const removed = await target.admin.storage.from("workbook-recordings").remove([path]);
  if (removed.error) throw removed.error;
}
async function cleanAbandoned(target: Target) {
  // A finalization ticket lasts ten minutes; storage upload tokens last two hours.
  // Files older than a day cannot belong to a live, unfinished upload.
  const bucket = target.admin.storage.from("workbook-recordings"), prefix = `${target.access.id}/${WORKBOOK_KEY}`;
  const rows = await records(target);
  const retained = new Set(rows.flatMap(row => [row.storage_path, ...(row.cleanup_paths || [])]));
  const abandoned: string[] = [];
  for (let offset = 0; ; offset += 100) {
    const listing = await bucket.list(prefix, { limit: 100, offset, sortBy: { column: "name", order: "asc" } });
    if (listing.error) throw listing.error;
    for (const file of listing.data) {
      const path = `${prefix}/${file.name}`;
      if (file.id && file.created_at && !retained.has(path) && Date.parse(file.created_at) < Date.now() - 86400_000) abandoned.push(path);
    }
    if (listing.data.length < 100) break;
  }
  for (let i = 0; i < abandoned.length; i += 100) {
    const removed = await bucket.remove(abandoned.slice(i, i + 100)); if (removed.error) throw removed.error;
  }
}
export async function POST(request: Request) {
  try {
    if (!workbookSameOrigin(request)) throw new WorkbookAccessError(403, "Invalid request origin.");
    const target = await workbookRecordingTarget(request);
    const body = await workbookRequestJson(request, 8000);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new WorkbookAccessError(400, "Choose a recording action.");
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const bucket = target.admin.storage.from("workbook-recordings");
    if (body.action === "prepare") {
      const format = typeof body.mime === "string" ? getAcademyRecordingFormat(body.mime.toLowerCase() === "audio/x-m4a" ? "audio/mp4" : body.mime) : null;
      if (!format) throw new WorkbookAccessError(400, "Use WebM, M4A/MP4 or Ogg.");
      if (body.purpose !== undefined && body.purpose !== "account" && body.purpose !== "feedback") throw new WorkbookAccessError(400, "Unknown recording purpose.");
      if (!Number.isSafeInteger(body.bytes) || body.bytes < 1 || body.bytes > WORKBOOK_RECORDING_LIMIT) throw new WorkbookAccessError(400, "Use a recording under 10 MB.");
      await cleanAbandoned(target);
      const previous = (await records(target)).find(row => row.exercise_key === target.exercise && row.run_id === target.run)?.storage_path || null;
      const path = `${target.access.id}/${WORKBOOK_KEY}/${crypto.randomUUID()}.${format.extension}`;
      const upload = await bucket.createSignedUploadUrl(path, { upsert: false }); if (upload.error) throw upload.error;
      const ticket = signWorkbookRecordingTicket({ user: target.access.id, exercise: target.exercise, run: target.run, path, mime: format.contentType, bytes: body.bytes, previous, purpose: body.purpose || "account" }, secret);
      return json({ path, token: upload.data.token, mime: format.contentType, ticket });
    }
    const ticket = readWorkbookRecordingTicket(body.ticket, secret, Date.now(), body.action === "cancel");
    if (!ticket || ticket.user !== target.access.id || ticket.exercise !== target.exercise) throw new WorkbookAccessError(400, "This upload link expired or does not belong to this recording. Save again; your local recording is safe.");
    if (body.action === "cancel") { await discard(target, ticket.path); return json({ ok: true }); }
    if (body.action !== "complete") throw new WorkbookAccessError(400, "Unknown recording action.");
    if (ticket.purpose !== "account") throw new WorkbookAccessError(400, "This recording was uploaded only for requested feedback.");
    if (ticket.run !== target.run) { await discard(target, ticket.path); throw new WorkbookAccessError(409, "This exercise attempt changed. Your recording remains on its original device attempt."); }
    const rows = await records(target), existing = rows.find(row => row.exercise_key === target.exercise && row.run_id === target.run);
    if (existing?.storage_path === ticket.path) return json({ ok: true }); // Retry after a lost success response.
    if ((existing?.storage_path || null) !== ticket.previous) { await discard(target, ticket.path); throw new WorkbookAccessError(409, "Another device changed the account recording. Your local recording is safe; reload before replacing it."); }
    const info = await bucket.info(ticket.path);
    if (info.error) throw new WorkbookAccessError(409, "The upload has not finished. Keep your local recording and retry saving.");
    const size = info.data.size ?? info.data.metadata?.size, mime = info.data.contentType ?? info.data.metadata?.mimetype;
    if (size !== ticket.bytes || mime !== ticket.mime) { await discard(target, ticket.path); throw new WorkbookAccessError(400, "The uploaded file does not match this recording. Your local recording is safe."); }
    const pending = existing ? [...new Set([existing.storage_path, ...(existing.cleanup_paths || [])])] : [];
    const values = { user_id: target.access.id, book_key: WORKBOOK_KEY, exercise_key: target.exercise, run_id: target.run, storage_path: ticket.path, cleanup_paths: pending, mime_type: ticket.mime, created_at: new Date().toISOString() };
    const saved = existing
      ? await target.admin.from("workbook_recordings").update(values).eq("id", existing.id).eq("user_id", target.access.id).eq("storage_path", ticket.previous!).select("id")
      : await target.admin.from("workbook_recordings").insert(values).select("id");
    if (saved.error || !saved.data?.length) { await discard(target, ticket.path); throw new WorkbookAccessError(409, "Another device saved a recording. Your local recording is safe; reload before replacing it."); }
    if (pending.length) {
      const removed = await bucket.remove(pending);
      if (removed.error) return json({ ok: true, warning: "Recording saved. Earlier files will be removed when you delete this account recording." });
      await target.admin.from("workbook_recordings").update({ cleanup_paths: [] }).eq("user_id", target.access.id).eq("storage_path", ticket.path);
    }
    return json({ ok: true });
  } catch (error) { return workbookError(error); }
}
