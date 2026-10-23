import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
const origin=process.argv[2]||'http://localhost:3003';
if(!['localhost','127.0.0.1'].includes(new URL(origin).hostname))throw new Error('This verifier is restricted to the local synthetic preview.');
const api=`${origin}/api/workbook/aspekte-neu-b2-lehrbuch`;
const id=randomUUID();let revision=0;
const entry={id,page:9,kind:'question',title:'Synthetic persistence check',body:'Meine Antwort. සිංහල ✓',resolved:0,x:3000,y:2500,revision,updated:''};
async function call(method,body,from=origin){return fetch(`${api}/entries`,{method,headers:{'Content-Type':'application/json',Origin:from},body:JSON.stringify(body)});}
try{
 assert.ok([401,403].includes((await call('PUT',entry,'https://other.test')).status));
 let response=await call('PUT',entry);assert.equal(response.status,200);revision=(await response.json()).revision;assert.equal(revision,1);
 assert.equal((await call('PUT',entry)).status,409);
 const all=await(await fetch(`${api}/entries`)).json();assert.equal(all.entries.find(e=>e.id===id).body,entry.body);
 response=await call('PUT',{...entry,resolved:1,revision});assert.equal(response.status,200);revision=(await response.json()).revision;
 assert.equal((await call('DELETE',{...entry,revision:1})).status,409);
 for(let start=1;start<=202;start+=5)await Promise.all(Array.from({length:Math.min(5,203-start)},(_,i)=>start+i).map(async n=>{
  const r=await fetch(`${api}/pages/${n}`);assert.equal(r.status,200,`source page ${n}`);assert.match(r.headers.get('cache-control'),/no-store/);
  const bytes=Buffer.from(await r.arrayBuffer());const original=await readFile(`private-materials/aspekte-neu-b2-lehrbuch/derived/pages/page-${String(n).padStart(3,'0')}.jpg`);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),createHash('sha256').update(original).digest('hex'));
 }));
 for(const n of ['0','203','1.jpg','%2e%2e'])assert.equal((await fetch(`${api}/pages/${n}`)).status,404);
 const remote=await fetch(`${api}/entries`,{headers:{Origin:'https://other.test'}});assert.notEqual(remote.status,200);
 console.log(JSON.stringify({pages:202,sourceHashes:true,unicodeSave:true,reload:true,staleConflict:true,originRejection:true,syntheticFixtureOnly:true}));
}finally{if(revision){const r=await call('DELETE',{...entry,revision});assert.equal(r.status,200);}}
