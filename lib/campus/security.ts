import { createHash, timingSafeEqual } from "node:crypto";
export function hashTicket(ticket: string) {
  return createHash("sha256").update(ticket).digest("hex");
}
export function gameAccessKey(ticket:string) {
  return createHash("sha256").update("campus-games-http-v1:"+hashTicket(ticket)).digest("hex");
}
export function validServiceKey(
  actual: string | null,
  secret: string | undefined,
) {
  if (!actual || !secret || secret.length < 32) return false;
  const a = Buffer.from(actual),
    b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function sameOrigin(request: Request) {
  return request.headers.get("origin") === new URL(request.url).origin;
}
export function campusSocketRequestAllowed(request: Request) {
  const url = new URL(request.url);
  return sameOrigin(request) && request.headers.get("upgrade")?.toLowerCase() === "websocket" &&
    (url.protocol === "https:" || (process.env.NODE_ENV !== "production" &&
      url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)));
}
/** Enforce the limit on bytes read, including requests without Content-Length. */
export async function readCampusJson(
  request: Request,
): Promise<Record<string, unknown> | null> {
  if (!request.body || Number(request.headers.get("content-length")) > 2048)
    return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2048) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const value = JSON.parse(new TextDecoder().decode(bytes));
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : null;
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}
export function campusConfiguration() {
  if (process.env.CAMPUS_PILOT_READY !== "true") return null;
  if (process.env.CAMPUS_TRANSPORT === "vercel")
    return { transport: "vercel" as const, publicUrl: "/api/campus/socket" };
  if (process.env.CAMPUS_TRANSPORT && process.env.CAMPUS_TRANSPORT !== "colyseus") return null;
  const publicUrl = process.env.CAMPUS_PUBLIC_URL;
  if (
    process.env.CAMPUS_PILOT_READY !== "true" ||
    !publicUrl ||
    !process.env.CAMPUS_SERVICE_KEY ||
    process.env.CAMPUS_SERVICE_KEY.length < 32
  )
    return null;
  try {
    const url = new URL(publicUrl);
    if (
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/"
    )
      return null;
    if (
      url.protocol !== "wss:" &&
      !(
        url.protocol === "ws:" &&
        ["localhost", "127.0.0.1"].includes(url.hostname) &&
        process.env.NODE_ENV !== "production"
      )
    )
      return null;
    return { transport: "colyseus" as const, publicUrl: url.origin };
  } catch {
    return null;
  }
}
