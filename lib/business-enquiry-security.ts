import { createHmac } from "node:crypto";
import { isIP } from "node:net";

type RequestHeaders = { get(name: string): string | null };

export function getBusinessEnquiryRequestIp(
  headers: RequestHeaders,
  configuration = { vercel: process.env.VERCEL === "1", production: process.env.NODE_ENV === "production" },
) {
  if (!configuration.vercel && !configuration.production) return "127.0.0.1";
  if (!configuration.vercel) throw new Error("A trusted production proxy is required for business enquiries.");
  // Vercel overwrites X-Forwarded-For; reject chains and caller-supplied alternative headers.
  // https://vercel.com/docs/headers/request-headers#x-forwarded-for
  const ip = headers.get("x-forwarded-for")?.trim().toLowerCase();
  if (!ip || !isIP(ip)) throw new Error("The trusted request IP is unavailable.");
  return ip;
}

export function businessEnquiryHash(secret: string, kind: "ip" | "email" | "payload", value: string) {
  if (secret.trim().length < 32) throw new Error("Business enquiry rate limits are not configured.");
  return createHmac("sha256", secret).update(`${kind}:${value}`).digest("hex");
}
