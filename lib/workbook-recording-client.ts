type Upload = { path: string; token: string; mime: string; ticket: string };
async function send(endpoint: string, body: object, request: typeof fetch) {
  const response = await request(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw new Error(data?.message || "Recording saving is unavailable. Your local recording has not been removed.");
  return data;
}
export async function prepareWorkbookRecordingUpload(endpoint: string, blob: Blob, purpose: "account" | "feedback", upload: (grant: Upload, file: Blob) => Promise<void>, request: typeof fetch = fetch): Promise<Upload> {
  const grant = await send(endpoint, { action: "prepare", mime: blob.type, bytes: blob.size, purpose }, request) as Upload;
  try {
    await upload(grant, new Blob([blob], { type: grant.mime }));
    return grant;
  } catch (error) {
    await send(endpoint, { action: "cancel", ticket: grant.ticket }, request).catch(() => {});
    throw error;
  }
}
/** Only the small authorization/finalization messages pass through the app server. */
export async function uploadWorkbookRecording(
  endpoint: string, blob: Blob,
  upload: (grant: Upload, file: Blob) => Promise<void>,
  request: typeof fetch = fetch,
) {
  const grant = await prepareWorkbookRecordingUpload(endpoint, blob, "account", upload, request);
  // A lost finalization response may already have committed. Never cancel it.
  return await send(endpoint, { action: "complete", ticket: grant.ticket }, request) as { ok: boolean; warning?: string };
}
