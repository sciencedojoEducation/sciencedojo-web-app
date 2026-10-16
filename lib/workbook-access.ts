import "server-only";
import { createClient } from "@/utils/supabase/server";
import { isLocalWorkbookRequest } from "@/lib/aspekte-workbook";
export const WORKBOOK_KEY = "aspekte-neu-b2";
export type WorkbookAccess = { id: string; email: string; local: boolean; admin: boolean };
export class WorkbookAccessError extends Error { constructor(public status: number, message: string) { super(message); } }
export function workbookFeatureEnabled() { return process.env.WORKBOOK_ENABLED === "true" || process.env.NODE_ENV === "development" && process.env.WORKBOOK_ENABLED !== "false"; }
export function workbookSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !!origin && origin === new URL(request.url).origin && request.headers.get("sec-fetch-site") !== "cross-site";
}
export async function requireWorkbookAccess(request: Request, adminOnly = false): Promise<WorkbookAccess> {
  if (!workbookFeatureEnabled()) throw new WorkbookAccessError(404, "Workbook unavailable.");
  // The pre-existing loopback preview remains available without publishing personal material.
  // It is impossible to enable this path in production or on a remote origin.
  const local = process.env.NODE_ENV === "development" && process.env.WORKBOOK_ACCOUNT_MODE !== "true" && isLocalWorkbookRequest(request.url, request.headers.get("origin"), request.headers.get("sec-fetch-site"));
  if (local && !adminOnly) return { id: "local-preview", email: "", local: true, admin: false };
  const client = await createClient(); const { data: { user } } = await client.auth.getUser();
  if (!user) throw new WorkbookAccessError(401, "Sign in to continue.");
  const { data: profile, error } = await client.from("profiles").select("role,is_suspended").eq("id", user.id).maybeSingle();
  if (error) throw new WorkbookAccessError(503, "Account access could not be checked.");
  if (!profile || profile.is_suspended || user.user_metadata?.is_suspended || !user.email_confirmed_at) throw new WorkbookAccessError(403, "A verified, active account is required.");
  const admin = profile.role === "admin";
  if (adminOnly) { if (!admin) throw new WorkbookAccessError(403, "Administrator access is required."); }
  else {
    const { data, error } = await client.from("workbook_memberships").select("active").eq("user_id", user.id).eq("book_key", WORKBOOK_KEY).maybeSingle();
    if (error) throw new WorkbookAccessError(503, "Workbook accounts are not configured yet.");
    if (!data?.active) throw new WorkbookAccessError(403, "An invitation is required for this workbook.");
  }
  return { id: user.id, email: user.email || "", local: false, admin };
}
export function workbookError(error: unknown) {
  return Response.json({ message: error instanceof WorkbookAccessError ? error.message : "Unable to complete this request. Please retry." }, { status: error instanceof WorkbookAccessError ? error.status : 500, headers: { "Cache-Control": "no-store" } });
}
export async function workbookRequestJson(request: Request, limit = 3_000_000) {
  const reader = request.body?.getReader(); if (!reader) throw new WorkbookAccessError(400, "No data supplied.");
  const chunks: Uint8Array[] = []; let bytes = 0;
  while (true) { const { done, value } = await reader.read(); if (done) break; bytes += value.byteLength; if (bytes > limit) { await reader.cancel(); throw new WorkbookAccessError(413, "Request is too large."); } chunks.push(value); }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new WorkbookAccessError(400, "Invalid request data."); }
}
