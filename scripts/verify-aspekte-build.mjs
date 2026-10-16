/** Inspect the actual production traces, rather than assuming ignored source files stay out. */
import assert from 'node:assert/strict';
import {readdir, readFile, stat, mkdir, writeFile} from 'node:fs/promises';
import {join, resolve, relative} from 'node:path';
const root=process.cwd(),build=join(root,'.next/server/app/api/workbook/aspekte-neu-b2');
async function traces(directory){
 const found=[];
 for(const entry of await readdir(directory,{withFileTypes:true})){
  const path=join(directory,entry.name);
  if(entry.isDirectory())found.push(...await traces(path));
  else if(entry.name.endsWith('.nft.json'))found.push(path);
 }
 return found;
}
const files=await traces(build);assert.ok(files.length>=8,'Build workbook routes before auditing traces');
const routes=[];
for(const trace of files){
 const data=JSON.parse(await readFile(trace,'utf8'));let bytes=0;
 for(const entry of data.files){
  const path=resolve(trace,'..',entry),name=relative(root,path).split('\\').join('/');
  assert.ok(!name.startsWith('private-materials/'),`Private source or learner file traced into ${relative(build,trace)}`);
  assert.ok(!name.startsWith('public/'),`Static CDN asset traced into workbook function ${relative(build,trace)}`);
  bytes+=(await stat(path)).size;
 }
 routes.push({route:relative(build,trace),files:data.files.length,bytes});
}
const serverTraces=await traces(join(root,'.next/server/app'));
for(const trace of serverTraces)for(const entry of JSON.parse(await readFile(trace,'utf8')).files){
 assert.ok(!relative(root,resolve(trace,'..',entry)).split('\\').join('/').startsWith('private-materials/'),`Private file traced into ${relative(root,trace)}`);
}
const standalonePrivate=await stat(join(root,'.next/standalone/private-materials')).then(()=>true,error=>{if(error.code==='ENOENT')return false;throw error;});
assert.equal(standalonePrivate,false,'Private materials were copied into the standalone deployment');
const report={checkedAt:new Date().toISOString(),serverTraces:serverTraces.length,privateSourceFiles:0,staticPublicFiles:0,standalonePrivateFiles:false,routes};
const evidence=join(root,'private-materials/aspekte-neu-b2/derived');await mkdir(evidence,{recursive:true});
await writeFile(join(evidence,'build-trace-verification.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
