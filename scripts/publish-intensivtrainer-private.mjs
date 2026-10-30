/** Bounded private source upload. No learner state, OCR helpers or source PDF included. */
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
const key='aspekte-neu-b2-intensivtrainer',root=join(process.cwd(),'private-materials',key,'derived');
const apply=process.argv.includes('--apply');
const manifest=JSON.parse(await readFile(join(root,'manifest.json'),'utf8'));
assert.equal(manifest.chapters.length,10);assert.equal(manifest.exerciseCount,283);
const files=new Set(['manifest.json']);
for(let page=4;page<=83;page++){
 files.add(`native/${page}.json`);
 const data=JSON.parse(await readFile(join(root,'native',`${page}.json`),'utf8'));
 assert.equal(data.number,page);assert.ok(data.nativeVersion>=2);
 if(data.pdfPage){assert.ok(data.pdfPage>=3&&data.pdfPage<=81);files.add(`assets/page-${String(data.pdfPage).padStart(2,'0')}.jpg`);}
 for(const exercise of data.nativeExercises)for(const block of exercise.content||[])if(block.type==='figure'){
  assert.match(block.asset,/^fig-\d{1,2}-\d+$/);files.add(`assets/figures/${block.asset}.jpg`);
 }
}
const client=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const bucket=await client.storage.getBucket('private-workbooks');
assert.ok(!bucket.error&&bucket.data&&!bucket.data.public,'The existing source bucket must be private');
// Verify the target against the already-published Arbeitsbuch source identity.
const old=await client.storage.from('private-workbooks').download('aspekte-neu-b2/manifest.json');
assert.ok(!old.error&&old.data,'Expected existing private Arbeitsbuch package');
const oldLocal=JSON.parse(await readFile(join(process.cwd(),'private-materials/aspekte-neu-b2/derived/manifest.json'),'utf8'));
assert.equal((await old.data.text().then(JSON.parse)).sourceSha256,oldLocal.sourceSha256,'Existing source identity does not match the expected ScienceDojo target');
const report={checkedAt:new Date().toISOString(),mode:apply?'upload':'dry-run',prefix:key,privateBucket:true,existingBookIdentity:true,files:[],bytes:0};
for(const name of [...files].sort()){
 const data=await readFile(join(root,name));report.bytes+=data.length;
 assert.ok(data.length>0&&data.length<50*1024*1024);
 if(apply){const uploaded=await client.storage.from('private-workbooks').upload(`${key}/${name}`,data,{contentType:name.endsWith('.json')?'application/json':'image/jpeg',upsert:true,cacheControl:'60'});if(uploaded.error)throw new Error(`Private source upload failed: ${name}`);}
 report.files.push({name,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});
}
if(apply){
 for(const sample of ['manifest.json','native/4.json','native/83.json','assets/page-03.jpg','assets/figures/fig-4-1.jpg']){
  const downloaded=await client.storage.from('private-workbooks').download(`${key}/${sample}`);assert.ok(!downloaded.error&&downloaded.data);
  assert.equal(createHash('sha256').update(Buffer.from(await downloaded.data.arrayBuffer())).digest('hex'),report.files.find(f=>f.name===sample).sha256);
 }
}
await writeFile(join(root,apply?'private-upload-verification.json':'private-upload-dry-run.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({mode:report.mode,privateBucket:report.privateBucket,existingBookIdentity:report.existingBookIdentity,files:report.files.length,bytes:report.bytes}));
