import 'server-only';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { requireWorkbookAccess, WorkbookAccessError, type WorkbookAccess } from '@/lib/workbook-access';
import { LEHRBUCH_KEY, lehrbuchLocalRequest, type LehrbuchEntry } from '@/lib/lehrbuch';
import { createAdminClient } from '@/utils/supabase/admin';
export const lehrbuchRoot = join(process.cwd(), 'private-materials', LEHRBUCH_KEY, 'derived');
const statePath = join(lehrbuchRoot, 'reflections-preview.json');
let queue = Promise.resolve();
export async function requireLehrbuchAccess(request: Request): Promise<WorkbookAccess> {
  if (process.env.WORKBOOK_ENABLED === 'false') throw new WorkbookAccessError(404, 'Book unavailable.');
  if (process.env.WORKBOOK_ACCOUNT_MODE !== 'true' && lehrbuchLocalRequest(request, process.env.NODE_ENV)) return { id: 'local-preview', email: '', local: true, admin: true };
  return requireWorkbookAccess(request, true);
}
export async function readLehrbuchEntries(access: WorkbookAccess): Promise<LehrbuchEntry[]> {
  if (access.local) {
    try { return JSON.parse(await readFile(statePath, 'utf8')); }
    catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return []; throw e; }
  }
  const all: LehrbuchEntry[] = [];
  const client = createAdminClient();
  for (let offset = 0; offset < 10000; offset += 500) {
    const { data, error } = await client.from('workbook_reflections').select('id,page,kind,title,body,resolved,x,y,revision,updated').eq('user_id', access.id).eq('book_key', LEHRBUCH_KEY).order('id', { ascending: true }).range(offset, offset + 499);
    if (error) throw new WorkbookAccessError(503, 'Your textbook answers could not be loaded. Your device drafts are safe.');
    all.push(...(data || []).map(e => ({ ...e, resolved: e.resolved ? 1 : 0 })));
    if (!data || data.length < 500) return all.sort((a, b) => b.updated.localeCompare(a.updated));
  }
  throw new WorkbookAccessError(503, 'This journal is too large to load safely. Please contact support before adding more entries.');
}
export async function writeLehrbuchEntry(access: WorkbookAccess, entry: LehrbuchEntry, remove = false): Promise<boolean> {
  if (access.local) {
    let saved = false;
    const operation = queue.then(async () => {
      const all = await readLehrbuchEntries(access), current = all.find(e => e.id === entry.id);
      if ((current?.revision || 0) !== entry.revision || remove && !current) return;
      const next = all.filter(e => e.id !== entry.id);
      if (!remove) next.unshift({ ...entry, revision: entry.revision + 1, updated: new Date().toISOString() });
      await mkdir(lehrbuchRoot, { recursive: true });
      const temporary = `${statePath}.${crypto.randomUUID()}.tmp`;
      await writeFile(temporary, JSON.stringify(next)); await rename(temporary, statePath); saved = true;
    });
    queue = operation.catch(() => {}); await operation; return saved;
  }
  const client = createAdminClient();
  if (remove) {
    const { data, error } = await client.from('workbook_reflections').delete().eq('user_id', access.id).eq('book_key', LEHRBUCH_KEY).eq('id', entry.id).eq('revision', entry.revision).select('id');
    if (error) throw new WorkbookAccessError(503, 'Unable to delete the saved entry.');
    return data?.length === 1;
  }
  const { data, error } = await client.rpc('workbook_save_reflection', { target_user: access.id, entry_id: entry.id, expected_revision: entry.revision, entry_payload: entry });
  if (error) throw new WorkbookAccessError(503, 'Your entry could not be saved. Please retry.');
  return data === true;
}

const nativeSourceCache = new Map<number, { expires: number; page: import('./lehrbuch').LehrbuchNativePage }>();
export async function readLehrbuchNativePage(pdfPage: number): Promise<import('./lehrbuch').LehrbuchNativePage> {
  if (!Number.isInteger(pdfPage) || pdfPage < 1 || pdfPage > 202) throw new WorkbookAccessError(404, 'Page unavailable.');
  const existing = nativeSourceCache.get(pdfPage);
  if (existing && existing.expires > Date.now()) return existing.page;
  const object = `native/v1/${String(pdfPage).padStart(3, '0')}.json`;
  let text: string;
  if (process.env.WORKBOOK_STORAGE !== 'supabase' && process.env.NODE_ENV !== 'production') text = await readFile(join(lehrbuchRoot, object), 'utf8');
  else {
    const { data, error } = await createAdminClient().storage.from('private-workbooks').download(`${LEHRBUCH_KEY}/${object}`);
    if (error || !data) throw new WorkbookAccessError(503, 'The interactive page could not load. Your answers are safe; please retry.');
    text = await data.text();
  }
  const page = JSON.parse(text);
  if (page.nativeVersion !== 1 || page.pdfPage !== pdfPage || !Array.isArray(page.exercises) || !Array.isArray(page.content) || !page.entryIds || !page.exerciseNotes) throw new WorkbookAccessError(503, 'The interactive page is unavailable.');
  nativeSourceCache.set(pdfPage, { page, expires: Date.now() + 60000 });
  return page;
}
