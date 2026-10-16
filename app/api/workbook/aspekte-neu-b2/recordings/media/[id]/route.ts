import { createAdminClient } from "@/utils/supabase/admin";
import { requireWorkbookAccess, workbookError, WorkbookAccessError, WORKBOOK_KEY } from "@/lib/workbook-access";
import { workbookAudioStream } from "@/lib/workbook-audio-stream";

export const runtime = "nodejs";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireWorkbookAccess(request);
    if (access.local || new URL(request.url).searchParams.get("account") !== access.id) throw new WorkbookAccessError(401, "Your account changed. Reload before playing this recording.");
    const { id } = await context.params;
    if (!/^[0-9a-f-]{36}$/.test(id)) throw new WorkbookAccessError(404, "Recording not found.");
    const admin = createAdminClient();
    const { data, error } = await admin.from("workbook_recordings").select("storage_path,mime_type").eq("id", id).eq("user_id", access.id).eq("book_key", WORKBOOK_KEY).maybeSingle();
    if (error) throw error;
    if (!data) throw new WorkbookAccessError(404, "Recording not found.");
    const signed = await admin.storage.from("workbook-recordings").createSignedUrl(data.storage_path, 60);
    if (signed.error) throw signed.error;
    const headers = new Headers({ "Accept-Encoding": "identity" });
    if (request.headers.has("range")) headers.set("Range", request.headers.get("range")!);
    const upstream = await fetch(signed.data.signedUrl, { method: request.method === "HEAD" ? "HEAD" : "GET", headers, cache: "no-store", signal: request.signal });
    return workbookAudioStream(upstream, data.mime_type);
  } catch (error) { return workbookError(error); }
}
export const HEAD = GET;
