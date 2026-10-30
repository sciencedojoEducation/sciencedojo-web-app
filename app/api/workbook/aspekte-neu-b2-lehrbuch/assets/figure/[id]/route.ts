import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { requireLehrbuchAccess, lehrbuchRoot } from '@/lib/lehrbuch-server';
import { workbookError } from '@/lib/workbook-access';
import { createAdminClient } from '@/utils/supabase/admin';
export const runtime = 'nodejs';
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  let access; try { access = await requireLehrbuchAccess(request); } catch (error) { return workbookError(error); }
  const { id } = await context.params;
  if (!/^p[1-9]\d{0,2}-f[1-9]\d?$/.test(id) || Number(id.match(/^p(\d+)/)?.[1]) > 202) return new Response(null, { status: 404 });
  const object = `figures/v1/${id}.jpg`;
  const headers = { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Cross-Origin-Resource-Policy': 'same-origin' };
  try {
    if (access.local && process.env.WORKBOOK_STORAGE !== 'supabase') return new Response(new Uint8Array(await readFile(join(lehrbuchRoot, object))), { headers });
    const { data, error } = await createAdminClient().storage.from('private-workbooks').createSignedUrl(`aspekte-neu-b2-lehrbuch/${object}`, 60);
    if (error || !data) return new Response(null, { status: 404, headers });
    const upstream = await fetch(data.signedUrl, { signal: request.signal, cache: 'no-store' });
    return new Response(upstream.ok ? upstream.body : null, { status: upstream.ok ? 200 : 503, headers });
  } catch { return new Response(null, { status: 503, headers }); }
}
