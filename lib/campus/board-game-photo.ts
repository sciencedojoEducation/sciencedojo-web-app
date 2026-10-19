/** Only known existing avatar providers; no caller-supplied fetch destination. */
export function allowedGamePhoto(value: unknown, supabaseUrl: string | undefined): URL | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port || url.hash) return null;
    const storage = supabaseUrl && new URL(supabaseUrl);
    if (storage && url.origin === storage.origin && /^\/storage\/v1\/object\/public\/avatars\//.test(url.pathname)) return url;
    if (url.hostname === "lh3.googleusercontent.com" && /^\/a(?:\/|-\/)/.test(url.pathname)) return url;
  } catch { /* Unsupported existing pictures use initials. */ }
  return null;
}
export async function readGamePhoto(url: URL, fetcher: typeof fetch = fetch): Promise<{bytes: Uint8Array; type: string} | null> {
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetcher(url, {redirect: "error", cache: "no-store", signal: controller.signal});
    const type = response.headers.get("content-type")?.split(";")[0].trim();
    if (!response.ok || !type || !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(type) ||
      Number(response.headers.get("content-length")) > 1_048_576 || !response.body) return null;
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = []; let size = 0;
    try {
      while (true) {
        const part = await reader.read(); if (part.done) break;
        size += part.value.byteLength;
        if (size > 1_048_576) {await reader.cancel(); return null;}
        chunks.push(part.value);
      }
    } finally {reader.releaseLock();}
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) {bytes.set(chunk, offset); offset += chunk.length;}
    // Require a matching raster signature, never serve HTML/SVG under an image label.
    const valid = type === "image/png" ? [137,80,78,71,13,10,26,10].every((v,i) => bytes[i] === v) :
      type === "image/jpeg" ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 :
      type === "image/gif" ? new TextDecoder().decode(bytes.slice(0,6)).match(/^GIF8[79]a$/) :
      new TextDecoder().decode(bytes.slice(0,4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8,12)) === "WEBP";
    return valid ? {bytes, type} : null;
  } catch {return null;} finally {controller.abort();clearTimeout(timer);}
}
