/** Audit private native source coverage and controls without publishing source text. */
import assert from 'node:assert/strict';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
const root=join(process.cwd(),'private-materials/aspekte-neu-b2-intensivtrainer/derived');
const manifest=JSON.parse(await readFile(join(root,'manifest.json'),'utf8'));
const report={checkedAt:new Date().toISOString(),pages:0,exercises:0,fields:0,inlineControls:0,wordBanks:0,figures:0,words:0,damaged:[],missing:[]};
for(let number=4;number<=83;number++){
 const page=JSON.parse(await readFile(join(root,'native',`${number}.json`),'utf8'));
 assert.equal(page.number,number);assert.ok(page.nativeVersion>=2);report.pages++;
 if(page.status!=='ready')report[page.status].push(number);
 report.words+=page.words.length;
 assert.equal(new Set(page.nativeExercises.map(e=>e.id)).size,page.nativeExercises.length);
 for(const e of page.nativeExercises){
  report.exercises++;report.fields+=e.fields.length;if(e.wordBank.length)report.wordBanks++;
  assert.ok(e.instruction.trim());assert.ok(e.fields.length);
  assert.equal(new Set(e.fields.map(f=>f.id)).size,e.fields.length);
  const placed=new Set();
  for(const b of e.content||[]){
   assert.notEqual(b.readingImage,true,'Whole exercise scans are not the interactive reading view');
   if(b.type==='figure'){assert.match(b.asset,/^fig-\d{1,2}-\d+$/);assert.ok((await stat(join(root,'assets/figures',`${b.asset}.jpg`))).size>0);report.figures++;}
   for(const text of [b.text||'',...(b.rows||[]).flat()])for(const [,reference] of text.matchAll(/\{\{([^}]+)\}\}/g)){
    const [id,segment]=reference.split('#'),field=e.fields.find(f=>f.id===id);assert.ok(field,`Missing field ${number}:${e.id}:${id}`);
    assert.ok(!placed.has(reference),`Repeated control ${number}:${e.id}:${reference}`);placed.add(reference);report.inlineControls++;
    if(segment)assert.ok(Number(segment)>=1&&Number(segment)<=(field.segments||1));
   }
  }
  for(const field of e.fields){assert.deepEqual(field.answers,[],'No missing published key may be fabricated');assert.ok(['self','review'].includes(field.evaluation));}
 }
}
assert.equal(report.pages,80);assert.equal(report.exercises,manifest.exerciseCount);assert.equal(report.words,manifest.wordCount);
assert.deepEqual(report.damaged,[39,40,41,42]);assert.deepEqual(report.missing,[43]);
await writeFile(join(root,'native-audit.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
