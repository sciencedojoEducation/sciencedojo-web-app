/** Local native source/access audit. Source and evidence remain gitignored. */
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
const origin=new URL(process.argv[2] || 'http://localhost:3002');
assert.ok(origin.protocol==='http:' && ['localhost','127.0.0.1','[::1]'].includes(origin.hostname),'Only the local private preview may be audited');
const base=origin.origin+'/api/workbook/aspekte-neu-b2-intensivtrainer';
const root=process.cwd()+'/private-materials/aspekte-neu-b2-intensivtrainer/derived';
const report={checkedAt:new Date().toISOString(),pages:0,exercises:0,words:0,fields:0,assets:0,damaged:[],missing:[],denials:[]};
const seen=new Set();
for(let number=4;number<=83;number++){
 const response=await fetch(`${base}?page=${number}`);assert.equal(response.status,200);assert.match(response.headers.get('cache-control'),/no-store/);
 const {page}=await response.json();assert.equal(page.number,number);report.pages++;
 if(page.status!=='ready')report[page.status].push(number);
 assert.equal(new Set(page.exercises.map(e=>e.id)).size,page.exercises.length);
 report.exercises+=page.exercises.length;report.words+=page.words.length;
 assert.equal(page.nativeExercises.length,page.exercises.length);
 for(const e of page.nativeExercises){assert.ok(e.instruction);assert.ok(e.fields.length);report.fields+=e.fields.length;
  for(const field of e.fields){assert.ok(!field.answers?.length);assert.ok(!field.modelAnswer);assert.ok(!field.solutionEvidence);}
  for(const block of e.content||[])if(block.type==='figure')seen.add(`figure/${block.asset}`);
 }
 if(page.pdfPage)seen.add(`page-${String(page.pdfPage).padStart(2,'0')}`);
}
for(const asset of seen){const r=await fetch(`${base}/assets/${asset}`);assert.equal(r.status,200,asset);assert.equal(r.headers.get('content-type'),'image/jpeg');assert.match(r.headers.get('cache-control'),/no-store/);const image=new Uint8Array(await r.arrayBuffer());assert.equal(image[0],255);assert.equal(image[1],216);report.assets++;}
for(const suffix of ['?page=3','?page=84','?page=4.2','/assets/manifest','/assets/page-82','/assets/task-4-missing']){assert.equal((await fetch(base+suffix)).status,404,suffix);report.denials.push(suffix);}
for(const headers of [{Origin:'https://example.com'},{'Sec-Fetch-Site':'cross-site'},{'Sec-Fetch-Site':'same-site'}]){assert.ok([401,403,404].includes((await fetch(`${base}?page=4`,{headers})).status),JSON.stringify(headers));assert.ok([401,403,404].includes((await fetch(`${base}/assets/page-03`,{headers})).status));report.denials.push(headers);}
const hostStatus=await new Promise((resolve,reject)=>{http.get(base+'?page=4',{headers:{Host:'example.com'}},r=>{r.resume();resolve(r.statusCode);}).on('error',reject);});assert.ok([401,403,404].includes(hostStatus));report.denials.push('actual remote HTTP Host');
const accountResponse=await fetch(base+'/study');assert.equal(accountResponse.status,200);
const account=await accountResponse.json();assert.equal(account.account.local,true);
assert.equal((await fetch(base+'/study?account=another-account')).status,401);
const save=(body,headers={})=>fetch(base+'/study',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin.origin,...headers},body:JSON.stringify(body)});
const input={accountId:account.account.id,revision:account.revision,state:account.state};
assert.equal((await save({...input,accountId:'another-account'})).status,401);
assert.ok([401,403,404].includes((await save(input,{Origin:'https://example.com'})).status));
assert.equal((await save({...input,state:{...account.state,book:'wrong-book'}})).status,400);
report.denials.push('account mismatch','cross-origin save','wrong-book save');
const manifest=JSON.parse(await readFile(root+'/manifest.json','utf8'));assert.equal(manifest.exerciseCount,report.exercises);assert.equal(manifest.wordCount,report.words);
await writeFile(root+'/http-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
