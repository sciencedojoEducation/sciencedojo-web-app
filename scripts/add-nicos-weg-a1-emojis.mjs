// Meaningful learning emojis only. Reads by default, snapshots and updates the draft with --apply.
import {isDeepStrictEqual} from 'node:util';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createClient} from '@supabase/supabase-js';
import {nicosWegA1Course} from '../lib/nicos-weg-a1-course.ts';
import {addNicosLearningEmojis} from '../lib/nicos-weg-a1-emojis.ts';
import {validateAcademyCourse} from '../lib/academy-course-validation.ts';
for(const line of readFileSync(resolve(import.meta.dirname,'../.env.local'),'utf8').split(/\r?\n/)){
 const m=line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
 if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^[ '\"]+|[ '\"]+$/g,'');
}
const client=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const {data:row,error}=await client.from('academy_courses').select('id,status,draft_revision,schema_version,draft_content,published_version_id').eq('course_key',nicosWegA1Course.key).single();
if(error)throw error;
if(!['draft','published'].includes(row.status))throw new Error('Course draft is not editable.');
const hash=createHash('sha256').update(JSON.stringify(row.draft_content)).digest('hex');
const candidate=addNicosLearningEmojis(row.draft_content);
const check=validateAcademyCourse(candidate);if(!check.valid)throw new Error(check.errors.join('\n'));
let changed=0;
for(let i=0;i<candidate.lessons.length;i++)for(let j=0;j<candidate.lessons[i].blocks.length;j++){
 if(!isDeepStrictEqual(candidate.lessons[i].blocks[j],row.draft_content.lessons[i].blocks[j]))changed++;
}
console.log(JSON.stringify({draftRevision:row.draft_revision,draftSha256:hash,updatedBlocks:changed,vocabularyCues:candidate.lessons.flatMap(l=>l.blocks.filter(b=>b.type==='flashcards').flatMap(b=>b.items)).filter(c=>c.emoji).length,valid:true,apply:process.argv.includes('--apply')}));
if(!changed||!process.argv.includes('--apply'))process.exit(0);
if(process.argv.find(a=>a.startsWith('--expect-draft-sha256='))?.split('=')[1]!==hash)throw new Error('Use the hash from the current read-only preview.');
const snap=await client.from('academy_course_snapshots').insert({course_id:row.id,draft_revision:row.draft_revision,schema_version:row.schema_version,reason:'migration',content:row.draft_content});if(snap.error)throw snap.error;
let query=client.from('academy_courses').update({draft_content:candidate,draft_revision:row.draft_revision+1,updated_at:new Date().toISOString(),autosaved_at:new Date().toISOString()}).eq('id',row.id).eq('draft_revision',row.draft_revision).eq('status',row.status);
query=row.published_version_id?query.eq('published_version_id',row.published_version_id):query.is('published_version_id',null);
const saved=await query.select('draft_revision,published_version_id').single();if(saved.error)throw saved.error;
console.log(JSON.stringify({savedDraft:saved.data.draft_revision,updatedBlocks:changed,publishedVersionUnchanged:saved.data.published_version_id===row.published_version_id}));
