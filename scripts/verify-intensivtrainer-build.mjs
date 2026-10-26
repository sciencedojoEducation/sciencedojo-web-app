/** Verify production artifacts exclude private book, answers and environment files. */
import assert from 'node:assert/strict';
import {readdir,readFile,realpath,stat,writeFile} from 'node:fs/promises';
import {join,resolve,basename} from 'node:path';
const root=process.cwd();
const privateRoot=await realpath(join(root,'private-materials'));
const trainerRoot=await realpath(join(root,'private-materials/aspekte-neu-b2-intensivtrainer'));
const oldRoot=await realpath(join(root,'private-materials/aspekte-neu-b2'));
const forbidden=[privateRoot,trainerRoot,oldRoot];
let traces=0,files=0,trainerRoutes=0;
async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){
 const path=join(dir,e.name);
 if(e.isDirectory())await walk(path);
 else if(e.name.endsWith('.nft.json')){
  traces++;if(path.includes('/aspekte-neu-b2-intensivtrainer/'))trainerRoutes++;
  for(const entry of JSON.parse(await readFile(path,'utf8')).files){
   const target=await realpath(resolve(path,'..',entry));files++;
   assert.ok(!forbidden.some(p=>target===p||target.startsWith(p+'/')),`Private source traced into ${path}`);
   assert.ok(!/^\.env(?:\.|$)/.test(basename(target)),`Environment file traced into ${path}`);
  }
 }
}}
await walk(join(root,'.next/server/app'));assert.ok(trainerRoutes>=5);
assert.equal(await stat(join(root,'.next/standalone/private-materials')).then(()=>true,e=>{if(e.code==='ENOENT')return false;throw e;}),false);
const report={checkedAt:new Date().toISOString(),traces,files,trainerRoutes,privateFiles:0,environmentFiles:0};
await writeFile(join(trainerRoot,'derived/native-build-verification.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
