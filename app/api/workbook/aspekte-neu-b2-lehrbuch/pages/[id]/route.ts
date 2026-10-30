import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { lehrbuchRoot, requireLehrbuchAccess } from '@/lib/lehrbuch-server';
import { workbookError } from '@/lib/workbook-access';
import { createAdminClient } from '@/utils/supabase/admin';
export const runtime = 'nodejs';
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  let access; try { access = await requireLehrbuchAccess(request); } catch (e) { return workbookError(e); }
  const { id } = await context.params;
  if (!/^[1-9]\d{0,2}$/.test(id) || Number(id) > 202) return new Response(null, { status: 404 });
  const object = `pages/page-${id.padStart(3, '0')}.jpg`;
  const headers = { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Cross-Origin-Resource-Policy': 'same-origin' };
  try {
    if (access.local) return new Response(new Uint8Array(await readFile(join(lehrbuchRoot, object))), { headers });
    const { data, error } = await createAdminClient().storage.from('private-workbooks').createSignedUrl(`aspekte-neu-b2-lehrbuch/${object}`, 60);
    if (error || !data) return new Response(null, { status: 404 });
    const upstream = await fetch(data.signedUrl, { cache: 'no-store', signal: request.signal });
    if (!upstream.ok) return new Response(null, { status: 503, headers });
    return new Response(upstream.body, { headers });
  } catch { return new Response(null, { status: 503, headers }); }
}
