import { parseLehrbuchEntry } from '@/lib/lehrbuch';
import { readLehrbuchEntries, requireLehrbuchAccess, writeLehrbuchEntry } from '@/lib/lehrbuch-server';
import { workbookRequestJson, workbookSameOrigin, WorkbookAccessError } from '@/lib/workbook-access';
export const runtime = 'nodejs';
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
function error(e: unknown) { return json({ error: e instanceof WorkbookAccessError ? e.message : 'Unable to complete this request. Please retry.' }, e instanceof WorkbookAccessError ? e.status : 500); }
export async function GET(request: Request) {
  try { const access = await requireLehrbuchAccess(request); return json({ entries: await readLehrbuchEntries(access), owner: access.id }); } catch (e) { return error(e); }
}
async function change(request: Request, remove: boolean) {
  try {
    const access = await requireLehrbuchAccess(request);
    if (!workbookSameOrigin(request)) return json({ error: 'Invalid request origin.' }, 403);
    let entry;
    try { entry = parseLehrbuchEntry(await workbookRequestJson(request, 150000)); }
    catch (e) { if (e instanceof WorkbookAccessError) throw e; return json({ error: 'Invalid journal entry.' }, 400); }
    if (!await writeLehrbuchEntry(access, entry, remove)) return json({ error: 'This entry changed in another tab or device. Your draft is preserved.' }, 409);
    return json(remove ? { ok: true } : { revision: entry.revision + 1, updated: new Date().toISOString() });
  } catch (e) { return error(e); }
}
export const PUT = (request: Request) => change(request, false);
export const DELETE = (request: Request) => change(request, true);
