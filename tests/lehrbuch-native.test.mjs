import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,mkdir,writeFile,rm,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {collectLehrbuchNative} from '../scripts/lehrbuch-native-package.mjs';
const load=async(path,modules,extra={})=>{const exports={};runInNewContext(ts.transpileModule(await readFile(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:n=>{assert.ok(n in modules,n);return modules[n];},Response,...extra});return exports;};
class AccessError extends Error{constructor(status,message){super(message);this.status=status;}}
const request=new Request('https://sciencedojo.test/api');
test('native source and figures require the existing admin gate before accessing source storage',async()=>{
 for(const path of ['../app/api/workbook/aspekte-neu-b2-lehrbuch/content/[id]/route.ts','../app/api/workbook/aspekte-neu-b2-lehrbuch/assets/figure/[id]/route.ts']){
  let reads=0;const api=await load(path,{'@/lib/lehrbuch-server':{requireLehrbuchAccess:async()=>{throw new AccessError(401,'Sign in');},readLehrbuchNativePage:async()=>{reads++;},lehrbuchRoot:'/private'},'@/lib/workbook-access':{workbookError:e=>Response.json({error:e.message},{status:e.status})},'node:fs/promises':{readFile:async()=>{reads++;}},'node:path':{join},'@/utils/supabase/admin':{createAdminClient:()=>{reads++;throw new Error('Unexpected access');}}});
  assert.equal((await api.GET(request,{params:Promise.resolve({id:'10'})})).status,401);assert.equal(reads,0);
 }
});
test('native page route bounds the source id, returns private no-store and never leaks storage URLs',async()=>{
 let reads=0;const api=await load('../app/api/workbook/aspekte-neu-b2-lehrbuch/content/[id]/route.ts',{'@/lib/lehrbuch-server':{requireLehrbuchAccess:async()=>({id:'admin'}),readLehrbuchNativePage:async n=>{reads++;return{pdfPage:n,exercises:[]};}},'@/lib/workbook-access':{workbookError:()=>new Response(null,{status:503})}});
 for(const id of ['0','203','01','../10','10.json'])assert.equal((await api.GET(request,{params:Promise.resolve({id})})).status,404);
 assert.equal(reads,0);const r=await api.GET(request,{params:Promise.resolve({id:'10'})});assert.equal(r.headers.get('cache-control'),'private, no-store');assert.equal((await r.json()).pdfPage,10);
});
test('journal pagination loads beyond Supabase default limits while always scoping owner and book',async()=>{
 const total=1207,seen=[];let range;
 const chain={select(){return this;},eq(k,v){seen.push([k,v]);return this;},order(k){assert.equal(k,'id');return this;},async range(a,b){range=[a,b];return{data:Array.from({length:Math.max(0,Math.min(500,total-a))},(_,i)=>({id:String(a+i),resolved:false,updated:String(a+i).padStart(5,'0')})),error:null};}};
 const server=await load('../lib/lehrbuch-server.ts',{'server-only':{},'node:fs/promises':{},'node:path':{join},'@/lib/workbook-access':{WorkbookAccessError:AccessError},'@/lib/lehrbuch':{LEHRBUCH_KEY:'aspekte-neu-b2-lehrbuch'},'@/utils/supabase/admin':{createAdminClient:()=>({from:name=>{assert.equal(name,'workbook_reflections');return chain;}})}},{process:{cwd:()=>'/private',env:{}}});
 const entries=await server.readLehrbuchEntries({id:'owner',local:false});assert.equal(entries.length,total);assert.deepEqual(range,[1000,1499]);assert.equal(entries[0].id,'1206');assert.equal(seen.filter(([k,v])=>k==='user_id'&&v==='owner').length,3);assert.equal(seen.filter(([k,v])=>k==='book_key'&&v==='aspekte-neu-b2-lehrbuch').length,3);
});
test('native package rejects orphan tokens and any unverified exact answer key',async()=>{
 const root=await mkdtemp(join(tmpdir(),'lehrbuch-package-'));await mkdir(join(root,'native/v1'),{recursive:true});
 const page={nativeVersion:1,pdfPage:1,bookPage:0,content:[],exercises:[{id:'1',fields:[{id:'a',evaluation:'exact',answers:['invented']}],content:[]}],entryIds:{},exerciseNotes:{}};
 try{await writeFile(join(root,'native/v1/001.json'),JSON.stringify(page));await assert.rejects(collectLehrbuchNative(root),/unverified answer key/);
 page.exercises=[];page.content=[{type:'text',text:'{{missing}}'}];await writeFile(join(root,'native/v1/001.json'),JSON.stringify(page));await assert.rejects(collectLehrbuchNative(root),/no field/);
 }finally{await rm(root,{recursive:true,force:true});}
});
const privateRoot=join(process.cwd(),'private-materials/aspekte-neu-b2-lehrbuch/derived');
let supplied=false;try{await access(join(privateRoot,'native/v1/manifest.json'));supplied=true;}catch{}
test('all locally supplied native pages have stable bindings, source-task coverage and existing private figures',{skip:!supplied},async()=>{
 const {files,stats}=await collectLehrbuchNative(privateRoot);assert.equal(stats.pages,202);assert.ok(stats.exercises>500);assert.ok(stats.inline>400);assert.ok(files.every(f=>/^(native\/v1\/(\d{3}|manifest)\.json|figures\/v1\/p\d+-f\d+\.jpg)$/.test(f.path)));
 const first=JSON.parse(files.find(f=>f.path==='native/v1/011.json').data);assert.ok(first.exercises.some(e=>e.wordBank.length===12));assert.ok(first.exercises.some(e=>e.content.some(b=>b.type==='table')));
});
