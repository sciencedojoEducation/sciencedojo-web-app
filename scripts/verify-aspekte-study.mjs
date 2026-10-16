/** Exercise the loopback development preview only; preserve its previous private state. */
import assert from 'node:assert/strict';
import {readFile,writeFile,unlink,mkdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {mergeWorkbookDraft} from '../lib/workbook-study.ts';
import {join} from 'node:path';
const origin='http://localhost:3000',url=`${origin}/api/workbook/aspekte-neu-b2`;
const root=join(process.cwd(),'private-materials/aspekte-neu-b2/derived');
const statePath=join(root,'learner-preview.json');let original=null,lastRevision=null;
try{original=await readFile(statePath);}catch(e){if(e.code!=='ENOENT')throw e;}
const call=async(input,expected=200)=>{
 const r=await fetch(`${url}/study`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({accountId:'local-preview',...input})});
 const data=await r.json();assert.equal(r.status,expected,JSON.stringify(data));if(r.ok&&data.state)lastRevision=data.state.revision;return data;
};
const report={checkedAt:new Date().toISOString(),chapters:0,pages:0,markers:{audio:0,solution:0,exam:0},audioRanges:0,checks:[]};
try{
 const initial=await(await fetch(`${url}/study`)).json();assert.equal(initial.account.local,true,'Never run this verifier against a cloud learner account');let state=initial.state;
 for(let chapter=1;chapter<=10;chapter++){
  const r=await fetch(`${url}?chapter=${chapter}`);assert.equal(r.status,200);const data=await r.json();assert.equal(data.pages.length,14);report.chapters++;
  for(const p of data.pages){report.pages++;const markers=[...(p.markers||[]),...p.exercises.flatMap(e=>e.markers||[])];for(const m of markers)report.markers[m.type]++;
   for(const e of p.exercises){assert.equal('modelAnswer'in e,false);assert.equal('solutionEvidence'in e,false);for(const f of e.fields)assert.equal('answers'in f,false);}
   assert.deepEqual([...new Set(markers.filter(m=>m.type==='audio').map(m=>m.track))].sort((a,b)=>a-b),p.tracks);
  }
 }
 assert.deepEqual(report.markers,{audio:50,solution:241,exam:21});
 for(let n=1;n<=51;n++){
  const r=await fetch(`${url}/assets/audio/${n}`,{headers:{Range:'bytes=0-63'}});assert.equal(r.status,206);assert.equal(r.headers.get('content-type'),'audio/mp4');assert.equal((await r.arrayBuffer()).byteLength,64);report.audioRanges++;
 }
 for(const kind of ['audio','solution','exam'])assert.equal((await fetch(`${url}/assets/symbol/${kind}`)).status,200);
 const baseDraft=structuredClone(state.draft),leftDraft=structuredClone(baseDraft),rightDraft=structuredClone(baseDraft);
 leftDraft.answers['6:2:1']='left device answer';rightDraft.answers['6:2:2']='right device answer';
 const saveDevice=async draft=>{const r=await fetch(`${url}/study`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({action:'save',accountId:'local-preview',revision:state.revision,draft})});return {status:r.status,data:await r.json(),draft};};
 const competing=await Promise.all([saveDevice(leftDraft),saveDevice(rightDraft)]);assert.deepEqual(competing.map(r=>r.status).sort(),[200,409]);
 const winner=competing.find(r=>r.status===200),loser=competing.find(r=>r.status===409);state=winner.data.state;lastRevision=state.revision;
 const merged=mergeWorkbookDraft(baseDraft,loser.draft,state.draft);assert.deepEqual(merged.conflicts,[]);
 state=(await call({action:'save',revision:state.revision,draft:merged.draft})).state;
 assert.equal(state.draft.answers['6:2:1'],'left device answer');assert.equal(state.draft.answers['6:2:2'],'right device answer');report.checks.push('simultaneous device saves produce one winner; independent losing edits merge without data loss');
 const draft=structuredClone(state.draft);draft.answers={};
 for(let n=6;n<20;n++){
  const p=JSON.parse(await readFile(join(root,'content',`${String(n).padStart(3,'0')}.json`),'utf8'));
  for(const e of p.exercises)for(const f of e.fields)if(['exact','set'].includes(f.evaluation))draft.answers[`${n}:${e.id}:${f.id}`]=f.evaluation==='set'?f.answers.join(', '):f.answers[0];
 }
 draft.position={...draft.position,page:10,exercise:'10:7',view:'book',track:2,seconds:12};draft.notes['6']='Temporary HTTP verification';
 state=(await call({action:'save',revision:state.revision,draft})).state;
 const stale=state.revision-1;await call({action:'save',revision:stale,draft},409);report.checks.push('stale saves return 409 without overwriting');
 const submission=randomUUID();const submitted=await call({action:'submit',kind:'chapter',id:submission,chapter:1,revision:state.revision});state=submitted.state;assert.equal(submitted.attempt.result.correct,submitted.attempt.result.scored);
 const duplicate=await call({action:'submit',kind:'chapter',id:submission,chapter:1,revision:stale});assert.equal(duplicate.attempt.id,submission);assert.equal(duplicate.state.attempts.length,state.attempts.length);report.checks.push('server scoring and idempotent submissions');
 state=(await call({action:'retry',id:randomUUID(),chapter:1,revision:state.revision})).state;
 assert.equal(Object.keys(state.draft.answers).filter(k=>Number(k.split(':')[0])<20).length,0);assert.ok(state.attempts.some(a=>a.id===submission));assert.equal(state.draft.assisted.includes(1),false);assert.equal(state.attempts.at(-1).kind,'archive');assert.deepEqual(state.attempts.at(-1).result.fields,{});report.checks.push('fresh retry preserves history, clears fields and assistance, hides keys');
 state=(await call({action:'save',revision:state.revision,draft:{...state.draft,answers:{'6:2:1':'wrong test answer'}}})).state;
 state=(await call({action:'submit',kind:'practice',exercises:['6:2'],chapter:1,id:randomUUID(),revision:state.revision})).state;assert.ok(state.reviews.some(r=>r.key==='6:2'));report.checks.push('mistakes enter revision');
 state=(await call({action:'queue',chapter:1,page:10,exercise:'7',reason:'uncertain',revision:state.revision})).state;assert.ok(state.reviews.some(r=>r.key==='10:7'&&r.reason==='uncertain'));
 const freshId=randomUUID();const fresh=await call({action:'start-session',chapter:1,exercises:['6:2'],id:freshId,revision:state.revision});state=fresh.state;assert.equal(state.draft.exerciseRuns['6:2'],freshId);assert.equal(state.draft.answers['6:2:1'],undefined);assert.equal(Object.hasOwn(state.draft.revealed,'6:2:1'),false);assert.deepEqual(fresh.attempt.result.fields,{});report.checks.push('fresh exercise hides earlier corrections and scopes recordings to its new attempt');
 state=(await call({action:'self-review',chapter:1,page:10,exercise:'7',revision:state.revision})).state;assert.ok(Date.parse(state.reviews.find(r=>r.key==='10:7').due)>Date.now());report.checks.push('open tasks can schedule self-review without numeric grading');
 await call({action:'save',revision:state.revision,draft:{...state.draft,position:{...state.draft.position,page:999}}},400);
 const reloaded=await(await fetch(`${url}/study`)).json();assert.equal(reloaded.state.draft.position.track,2);assert.equal(reloaded.state.draft.position.seconds,12);assert.equal(reloaded.state.revision,state.revision);report.checks.push('saved study and listening position survive a new request');
 await call({action:'save',accountId:'other-account',revision:state.revision,draft:state.draft},401);assert.equal((await fetch(`${url}/study?account=other-account`)).status,401);report.checks.push('account switching cannot save another learner’s draft');
 const denied=await fetch(`${url}/study`,{method:'POST',headers:{Origin:'https://evil.example','Content-Type':'application/json'},body:JSON.stringify({action:'save',revision:state.revision,draft:state.draft})});assert.equal(denied.status,403);report.checks.push('cross-origin mutation rejected');
 await writeFile(join(root,'study-http-verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{
 if(lastRevision!==null){
  const current=JSON.parse(await readFile(statePath,'utf8'));
  if(current.revision!==lastRevision){await mkdir(join(root,'test-backups'),{recursive:true});if(original)await writeFile(join(root,'test-backups',`study-before-${Date.now()}.json`),original);throw new Error('Another client changed preview progress during verification; preserved its state and the backup');}
  if(original)await writeFile(statePath,original);else await unlink(statePath);
 }
}
