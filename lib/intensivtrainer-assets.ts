import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { TRAINER_KEY } from "./intensivtrainer";
import { requireTrainerAccess, trainerRoot } from "./intensivtrainer-server";
import { workbookError } from "./workbook-access";
import { createAdminClient } from "@/utils/supabase/admin";
export async function trainerAsset(request: Request, id: string, figure = false) {
  try {
    const access = await requireTrainerAccess(request);
    if (!(figure ? /^fig-\d{1,2}-\d{1,2}$/ : /^page-\d{2}$/).test(id)) return new Response(null, { status: 404 });
    const path = figure ? `assets/figures/${id}.jpg` : `assets/${id}.jpg`;
    const headers = { "Content-Type": "image/jpeg", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Cross-Origin-Resource-Policy": "same-origin" };
    if (access.local) {
      try { return new Response(new Uint8Array(await readFile(join(trainerRoot, path))), { headers }); }
      catch { return new Response(null, { status: 404, headers }); }
    }
    const { data, error } = await createAdminClient().storage.from("private-workbooks").createSignedUrl(`${TRAINER_KEY}/${path}`, 60);
    if (error || !data) return new Response(null, { status: 404, headers });
    const upstream = await fetch(data.signedUrl, { cache: "no-store", signal: request.signal });
    if (!upstream.ok) return new Response(null, { status: upstream.status === 404 ? 404 : 503, headers });
    return new Response(upstream.body, { headers });
  } catch (e) { return workbookError(e); }
}
