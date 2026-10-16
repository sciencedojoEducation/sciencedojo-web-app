import { createHmac, timingSafeEqual } from "node:crypto";

export const WORKBOOK_RECORDING_LIMIT = 10 * 1024 * 1024;
export type WorkbookRecordingTicket = {
  user: string; exercise: string; run: string; path: string;
  mime: string; bytes: number; previous: string | null; purpose: "account" | "feedback"; expires: number;
};
function signature(body: string, secret: string) {
  const key = createHmac("sha256", secret).update("workbook-recording-upload-v1").digest();
  return createHmac("sha256", key).update(body).digest();
}
export function signWorkbookRecordingTicket(data: Omit<WorkbookRecordingTicket, "expires">, secret: string, now = Date.now()) {
  if (!secret) throw new Error("Recording signing is unavailable.");
  const body = Buffer.from(JSON.stringify({ ...data, expires: now + 10 * 60_000 })).toString("base64url");
  return `${body}.${signature(body, secret).toString("base64url")}`;
}
export function readWorkbookRecordingTicket(value: unknown, secret: string, now = Date.now(), allowExpired = false): WorkbookRecordingTicket | null {
  if (!secret || typeof value !== "string" || value.length > 4000) return null;
  const [body, mac, extra] = value.split(".");
  if (!body || !mac || extra !== undefined) return null;
  const expected = signature(body, secret), actual = Buffer.from(mac, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as WorkbookRecordingTicket;
    if (!Number.isSafeInteger(data.expires) || (!allowExpired && data.expires <= now) || data.expires > now + 10 * 60_000) return null;
    if (!Number.isSafeInteger(data.bytes) || data.bytes < 1 || data.bytes > WORKBOOK_RECORDING_LIMIT) return null;
    if (data.purpose !== "account" && data.purpose !== "feedback") return null;
    if (!/^[0-9a-f-]{36}$/.test(data.user) || !/^\d{1,3}:[\w-]+$/.test(data.exercise) || typeof data.run !== "string" || !data.run || data.run.length > 100) return null;
    const extension = { "audio/mp4": "m4a", "audio/webm": "webm", "audio/ogg": "ogg" }[data.mime];
    if (!extension || !new RegExp(`^${data.user}/aspekte-neu-b2/[0-9a-f-]{36}\\.${extension}$`).test(data.path)) return null;
    if (data.previous !== null && (typeof data.previous !== "string" || !data.previous.startsWith(`${data.user}/aspekte-neu-b2/`))) return null;
    return data;
  } catch { return null; }
}
