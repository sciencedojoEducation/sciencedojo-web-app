// Read-only by default. Appends libraries to the existing draft, never publishes.
import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { appendNicosA1Libraries } from '../lib/nicos-weg-a1-library.ts';
import { validateAcademyCourse } from '../lib/academy-course-validation.ts';

const root = resolve(import.meta.dirname, '..');
for (const line of readFileSync(resolve(root, '.env.local'), 'utf8').split(/\r?\n/)) {
  const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^[ '\"]+|[ '\"]+$/g, '');
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {auth: {persistSession: false}});
const {data: row, error} = await supabase.from('academy_courses').select('id,status,draft_revision,schema_version,draft_content,published_version_id').eq('course_key', 'deutsch-nicos-weg-a1').single();
if (error) throw error;
if (!['draft', 'published'].includes(row.status)) throw new Error('Course draft is not editable.');
const hash = createHash('sha256').update(JSON.stringify(row.draft_content)).digest('hex');
const candidate = appendNicosA1Libraries(row.draft_content);
const validation = validateAcademyCourse(candidate);
if (!validation.valid) throw new Error(validation.errors.join('\n'));
const added = candidate.lessons.length - row.draft_content.lessons.length;
const apply = process.argv.includes('--apply');
const preview = 'https://www.sciencedojo.co.uk/dashboard/admin/academy/deutsch-nicos-weg-a1/preview';
console.log(JSON.stringify({draftRevision: row.draft_revision, draftSha256: hash, newLessons: added, grammarLessons: 19, vocabularyDecks: 76, cards: 608, valid: true, apply, preview}));
if (!apply || !added) process.exit(0);
const expected = process.argv.find(a => a.startsWith('--expect-draft-sha256='))?.split('=')[1];
if (expected !== hash) throw new Error('Supply the hash from the current read-only preview.');
// Archive an exact local copy as well as the existing database snapshot.
const backup = resolve(root, 'tmp/nicos/library-backups');
mkdirSync(backup, {recursive: true});
writeFileSync(resolve(backup, `draft-${row.draft_revision}-${hash.slice(0,12)}.json`), JSON.stringify(row.draft_content, null, 2));
const snapshot = await supabase.from('academy_course_snapshots').insert({course_id: row.id, draft_revision: row.draft_revision, schema_version: row.schema_version, reason: 'migration', content: row.draft_content});
if (snapshot.error) throw snapshot.error;
const stamp = new Date().toISOString();
let update = supabase.from('academy_courses').update({draft_content: candidate, draft_revision: row.draft_revision + 1, updated_at: stamp, autosaved_at: stamp}).eq('id', row.id).eq('draft_revision', row.draft_revision).eq('status', row.status);
update = row.published_version_id ? update.eq('published_version_id', row.published_version_id) : update.is('published_version_id', null);
const updated = await update.select('id,draft_revision,published_version_id').single();
if (updated.error) throw updated.error;
if (updated.data.published_version_id !== row.published_version_id) throw new Error('Published pointer changed unexpectedly.');
console.log(JSON.stringify({savedDraft: updated.data.draft_revision, addedLessons: added, publishedVersionUnchanged: true, preview}));
