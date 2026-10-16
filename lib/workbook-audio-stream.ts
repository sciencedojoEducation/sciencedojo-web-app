/** Return audio on the workbook origin, including the range headers mobile players use. */
export function workbookAudioStream(upstream: Response, contentType = "audio/mp4") {
  const headers = new Headers({
    "Content-Type": ["audio/mp4", "audio/webm", "audio/ogg"].includes(contentType) ? contentType : "application/octet-stream",
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-store",
    "Content-Disposition": "inline",
    "X-Content-Type-Options": "nosniff",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Vary": "Cookie, Range",
  });
  const range = upstream.headers.get("content-range");
  if (upstream.status === 416) {
    void upstream.body?.cancel().catch(() => {});
    if (range) headers.set("Content-Range", range);
    return new Response(null, { status: 416, headers });
  }
  if (![200, 206].includes(upstream.status) || upstream.status === 206 && !range) {
    void upstream.body?.cancel().catch(() => {});
    return new Response(null, { status: 502, headers });
  }
  if (range) headers.set("Content-Range", range);
  const length = upstream.headers.get("content-length");
  // Fetch can decode an encoded response; its compressed length would then be wrong.
  if (length && [null, "identity"].includes(upstream.headers.get("content-encoding"))) headers.set("Content-Length", length);
  return new Response(upstream.body, { status: upstream.status, headers });
}
