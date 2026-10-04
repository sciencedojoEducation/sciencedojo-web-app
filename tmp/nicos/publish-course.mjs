import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { validateAcademyCourse } from '../../lib/academy-course-validation.ts';
for (const line of readFileSync('.env.local','utf8').split(/\r?\n/)) {
 const match=line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
 if(match && !process.env[match[1]]) process.env[match[1]]=match[2].replace(/^[ '\"]+|[ '\"]+$/g,'');
}
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const {data:row,error}=await db.from('academy_courses').select('id,course_key,status,draft_content,draft_revision,schema_version,published_version_id,quiz_revision,assessment_fingerprint').eq('course_key','deutsch-nicos-weg-a1').single();
if(error) throw error;
if(row.status!=='published'||!row.published_version_id) throw new Error('Expected an already published course.');
const {data:old,error:oldError}=await db.from('academy_course_versions').select('id,version_number,content').eq('id',row.published_version_id).single();
if(oldError) throw oldError;
const candidate=structuredClone(row.draft_content);
const validation=validateAcademyCourse(candidate);
if(!validation.valid) throw new Error(validation.errors.join('\n'));
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,v])=>[key,canonical(v)])):value;
function unchangedCourse(input){
 const course=structuredClone(input); delete course.quizRevision;
 for(const lesson of course.lessons) for(const block of lesson.blocks){
  if(block.type==='text'&&/(?:-grammar|-models)$/.test(block.id)) delete block.content;
  if(block.type==='flashcards'&&block.id.endsWith('-words')) {block.heading='Vocabulary'; for(const card of block.items) card.body=card.body.split(' · සිංහල: ')[0];}
 }
 return JSON.stringify(canonical(course));
}
if(unchangedCourse(candidate)!==unchangedCourse(old.content)) throw new Error('Draft includes changes beyond the approved text emphasis and Sinhala vocabulary.');
const hash=createHash('sha256').update(JSON.stringify(candidate)).digest('hex');
console.log(JSON.stringify({draftRevision:row.draft_revision,draftSha256:hash,publishedVersion:old.version_number,nextVersion:old.version_number+1,valid:true,lessonIdsAndAssessmentsUnchanged:true,sinhalaCards:candidate.lessons.flatMap(l=>l.blocks).filter(b=>b.type==='flashcards').flatMap(b=>b.items).filter(c=>c.body.includes('සිංහල:')).length}));
if(!process.argv.includes('--apply')) process.exit(0);
const expected=process.argv.find(a=>a.startsWith('--expect-sha256='))?.split('=')[1];
if(expected!==hash) throw new Error('Draft changed; review again.');
const now=new Date().toISOString();
const snapshot=await db.from('academy_course_snapshots').insert({course_id:row.id,draft_revision:row.draft_revision,schema_version:row.schema_version,reason:'publish',content:candidate});
if(snapshot.error) throw snapshot.error;
const {data:version,error:versionError}=await db.from('academy_course_versions').insert({course_id:row.id,version_number:old.version_number+1,quiz_revision:row.quiz_revision,schema_version:row.schema_version,assessment_fingerprint:row.assessment_fingerprint,content:{...candidate,quizRevision:row.quiz_revision}}).select('id,version_number').single();
if(versionError) throw versionError;
const {data:activated,error:activateError}=await db.from('academy_courses').update({published_version_id:version.id,published_at:now,updated_at:now}).eq('id',row.id).eq('draft_revision',row.draft_revision).eq('published_version_id',old.id).eq('status','published').select('id,published_version_id').single();
if(activateError) throw activateError;
console.log(JSON.stringify({activated,publishedVersion:version.version_number}));
