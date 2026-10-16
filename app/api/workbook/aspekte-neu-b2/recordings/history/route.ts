import { createAdminClient } from "@/utils/supabase/admin";
import { requireWorkbookAccess, workbookError, workbookSameOrigin, WorkbookAccessError, WORKBOOK_KEY } from "@/lib/workbook-access";
const json = (body: unknown) => Response.json(body, { headers: { "Cache-Control": "private, no-store" } });
export async function GET(request: Request) {
  try {
    const access = await requireWorkbookAccess(request); const params = new URL(request.url).searchParams;
    if (params.get("account") !== access.id) throw new WorkbookAccessError(401, "Your account changed. Reload before continuing.");
    if (access.local) return json({ recordings: [] });
    const offset = Number(params.get("offset") || 0); if (!Number.isSafeInteger(offset) || offset < 0) throw new WorkbookAccessError(400, "Invalid recording page.");
    const admin = createAdminClient(); const { data, error } = await admin.from("workbook_recordings").select("id,exercise_key,run_id,storage_path,created_at").eq("user_id", access.id).eq("book_key", WORKBOOK_KEY).order("created_at", { ascending: false }).range(offset, offset + 49); if (error) throw error;
    const signed = data.length ? await admin.storage.from("workbook-recordings").createSignedUrls(data.map(r => r.storage_path), 300) : { data: [], error: null }; if (signed.error) throw signed.error;
    return json({ recordings: data.map((r, i) => ({ id: r.id, exercise: r.exercise_key, run: r.run_id, at: r.created_at, url: signed.data?.[i]?.signedUrl || null })), hasMore: data.length === 50 });
  } catch (e) { return workbookError(e); }
}
export async function DELETE(request: Request) {
  try {
    if (!workbookSameOrigin(request)) throw new WorkbookAccessError(403, "Invalid request origin.");
    const access = await requireWorkbookAccess(request); const params = new URL(request.url).searchParams;
    if (access.local || params.get("account") !== access.id) throw new WorkbookAccessError(401, "Your account changed. Reload before continuing.");
    const id = params.get("id") || ""; if (!/^[0-9a-f-]{36}$/.test(id)) throw new WorkbookAccessError(400, "Invalid recording.");
    const admin = createAdminClient(); const { data, error } = await admin.from("workbook_recordings").select("id,storage_path,cleanup_paths").eq("id", id).eq("user_id", access.id).eq("book_key", WORKBOOK_KEY).maybeSingle(); if (error) throw error;
    if (data) {
      const removed = await admin.storage.from("workbook-recordings").remove([data.storage_path, ...(data.cleanup_paths || [])]); if (removed.error) throw removed.error;
      const deleted = await admin.from("workbook_recordings").delete().eq("id", id).eq("user_id", access.id).eq("storage_path", data.storage_path).select("id"); if (deleted.error) throw deleted.error;
      if (!deleted.data.length) throw new WorkbookAccessError(409, "Another device updated the recording. Refresh and review it.");
    }
    return json({ ok: true });
  } catch (e) { return workbookError(e); }
}
