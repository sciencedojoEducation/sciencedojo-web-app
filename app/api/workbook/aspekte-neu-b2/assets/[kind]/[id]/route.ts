import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { join } from "node:path";
import { Readable } from "node:stream";
import { workbookByteRange } from "@/lib/aspekte-workbook";
import { readWorkbookChapter, workbookCloudStorage, workbookRoot } from "@/lib/aspekte-workbook-server";

import { changeWorkbookLearning } from "@/lib/workbook-learning-server";
import { chapterForPage } from "@/lib/workbook-study";
import { requireWorkbookAccess, workbookError } from "@/lib/workbook-access";
import { createAdminClient } from "@/utils/supabase/admin";
import { workbookAudioStream } from "@/lib/workbook-audio-stream";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ kind: string; id: string }> }) {
  let access;
  try { access = await requireWorkbookAccess(request); } catch (e) { return workbookError(e); }
  const { kind, id } = await context.params;
  if (!["page", "audio", "figure", "symbol"].includes(kind) || !(kind === "symbol" ? /^(audio|solution|exam)$/.test(id) : kind === "figure" ? /^[1-9]\d{0,2}-[1-9]\d?$/.test(id) : /^[1-9]\d{0,2}$/.test(id))) return new Response(null, { status: 404 });
  const number = Number(id);
  if (kind !== "figure" && kind !== "symbol" && number > (kind === "page" ? 185 : 51)) return new Response(null, { status: 404 });
  if (kind === "page" && number >= 147 && number <= 173) {
    try {
      const visibleChapters: number[] = [];
      if (number <= 158) for (let chapter = 1; chapter <= 10; chapter++) {
        if ((await readWorkbookChapter(chapter)).some(p => p.exercises.some(e => e.solutionPage === number - 1))) visibleChapters.push(chapter);
      }
      await changeWorkbookLearning(access, state => {
        for (const chapter of [...visibleChapters, chapterForPage(state.draft.position.page)]) if (!state.draft.assisted.includes(chapter)) state.draft.assisted.push(chapter);
      });
    } catch (e) { return workbookError(e); }
  }
  if (workbookCloudStorage()) {
    const object = kind === "symbol" ? `symbols/${id}.jpg` : kind === "figure" ? `figures/${id}.jpg` : kind === "page" ? `pages/page-${id.padStart(3, "0")}.jpg` : `audio/${id.padStart(2, "0")}.m4a`;
    const { data, error } = await createAdminClient().storage.from("private-workbooks").createSignedUrl(`aspekte-neu-b2/${object}`, 300);
    if (error || !data) return new Response(null, { status: 404 });
    if (kind === "audio") {
      try {
        const headers = new Headers({ "Accept-Encoding": "identity" });
        const range = request.headers.get("range");
        if (range) headers.set("Range", range);
        const upstream = await fetch(data.signedUrl, { headers, cache: "no-store", signal: request.signal, method: request.method === "HEAD" ? "HEAD" : "GET" });
        return workbookAudioStream(upstream);
      } catch {
        return new Response(null, { status: 503, headers: { "Cache-Control": "private, no-store" } });
      }
    }
    return new Response(null, { status: 307, headers: { Location: data.signedUrl, "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
  }
  const path = kind === "symbol" ? join(workbookRoot, "symbols", `${id}.jpg`) : kind === "figure" ? join(workbookRoot, "figures", `${id}.jpg`) : kind === "page" ? join(workbookRoot, "pages", `page-${id.padStart(3, "0")}.jpg`) : join(workbookRoot, "audio", `${id.padStart(2, "0")}.m4a`);
  try {
    const { size } = await stat(path);
    if (size < 1) return new Response(null, { status: 404 });
    const range = workbookByteRange(request.headers.get("range"), size);
    const headers = { "Content-Type": kind === "audio" ? "audio/mp4" : "image/jpeg", "Cache-Control": "private, no-store", "Accept-Ranges": "bytes", "X-Content-Type-Options": "nosniff", "Cross-Origin-Resource-Policy": "same-origin" };
    if (range === "invalid") return new Response(null, { status: 416, headers: { ...headers, "Content-Range": `bytes */${size}` } });
    const stream = createReadStream(path, range || undefined);
    return new Response(Readable.toWeb(stream) as ReadableStream<Uint8Array>, { status: range ? 206 : 200, headers: {
      ...headers, "Content-Length": String(range ? range.end - range.start + 1 : size),
      ...(range ? { "Content-Range": `bytes ${range.start}-${range.end}/${size}` } : {}),
    } });
  } catch { return new Response(null, { status: 404 }); }
}
