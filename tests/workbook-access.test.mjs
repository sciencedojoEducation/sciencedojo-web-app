import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
const compiled=ts.transpileModule(readFileSync(new URL('../lib/workbook-access.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const request=new Request('https://example.test/workbooks/aspekte-neu-b2?user_id=another-user');
function fixture(options={}) {
 const user={id:'current-user',email:'learner@example.test',email_confirmed_at:'confirmed',user_metadata:{},...options.user};
 let membership=options.membership??null,reads=0,writes=0,adminClients=0;
 const client={auth:{getUser:async()=>({data:{user:options.anonymous?null:user}})},from(table){
  const filters={};
  return {select(){return this;},eq(key,value){filters[key]=value;return this;},async maybeSingle(){
   assert.equal(filters.id??filters.user_id,user.id);
   if(table==='profiles') return {data:options.missingProfile?null:{role:'user',is_suspended:false,...options.profile},error:options.profileError??null};
   assert.equal(table,'workbook_memberships');assert.equal(filters.book_key,'aspekte-neu-b2');reads++;
   return {data:membership,error:reads===1?options.readError:options.recheckError};
  }};
 }};
 const modules={
  'server-only':{},
  '@/utils/supabase/server':{createClient:async()=>client},
  '@/lib/aspekte-workbook':{isLocalWorkbookRequest:()=>true},
  '@/utils/supabase/admin':{createAdminClient(){adminClients++;return {from(table){assert.equal(table,'workbook_memberships');return {async upsert(row,config){
   writes++;assert.equal(row.user_id,user.id);assert.equal(row.book_key,'aspekte-neu-b2');assert.equal(row.active,true);
   assert.equal(config.onConflict,'user_id,book_key');assert.equal(config.ignoreDuplicates,true);
   if(options.concurrentRevocation) membership={active:false};
   if(!options.writeError&&!options.missingAfterInsert&&!membership) membership={active:true};
   return {error:options.writeError??null};
  }}}};}},
 };
 const exports={};runInNewContext(compiled,{exports,require:name=>{assert.ok(name in modules,name);return modules[name];},process:{env:{NODE_ENV:'production',WORKBOOK_ENABLED:'true',...options.env}},Response,Buffer});
 return {access:adminOnly=>exports.requireWorkbookAccess(request,adminOnly),state:()=>({membership,reads,writes,adminClients})};
}
const status=code=>error=>error.status===code;
test('verified first visit automatically enrolls only the signed-in account and confirms persisted membership',async()=>{
 const f=fixture();const result=await f.access();assert.equal(result.id,'current-user');assert.equal(result.local,false);assert.equal(result.admin,false);assert.deepEqual(f.state(),{membership:{active:true},reads:2,writes:1,adminClients:1});
 await f.access();assert.equal(f.state().writes,1,'repeat visits do not rewrite access');
});
test('concurrent first visits converge on one active membership',async()=>{const f=fixture();await Promise.all([f.access(),f.access(),f.access()]);assert.deepEqual(f.state().membership,{active:true});});
test('existing membership works without privileged writes',async()=>{const f=fixture({membership:{active:true}});await f.access();assert.equal(f.state().adminClients,0);});
test('existing revocation and a revocation racing first enrollment are never overwritten',async()=>{
 for(const options of [{membership:{active:false}},{concurrentRevocation:true}]){const f=fixture(options);await assert.rejects(f.access(),status(403));assert.deepEqual(f.state().membership,{active:false});}
});
test('anonymous, unverified, missing-profile and suspended users cannot create membership',async()=>{
 for(const options of [{anonymous:true},{user:{email_confirmed_at:null}},{missingProfile:true},{profile:{is_suspended:true}},{user:{user_metadata:{is_suspended:true}}}]){
  const f=fixture(options);await assert.rejects(f.access(),status(options.anonymous?401:403));assert.equal(f.state().writes,0);assert.equal(f.state().adminClients,0);
 }
});
test('database failures fail closed before serving private content',async()=>{
 for(const options of [{profileError:'offline'},{readError:'offline'},{writeError:'offline'},{recheckError:'offline'},{missingAfterInsert:true}]){const f=fixture(options);await assert.rejects(f.access(),status(503));}
});
test('automatic learner enrollment never grants administrator access, including forged auth metadata',async()=>{
 const f=fixture({user:{user_metadata:{role:'admin'}}});await assert.rejects(f.access(true),status(403));assert.equal(f.state().writes,0);
 const admin=fixture({profile:{role:'admin'}});assert.equal((await admin.access(true)).admin,true);assert.equal(admin.state().reads,0);assert.equal(admin.state().writes,0);
});
test('disabled workbook rejects access before enrollment; production cannot use the local preview bypass',async()=>{
 const disabled=fixture({env:{WORKBOOK_ENABLED:'false'}});await assert.rejects(disabled.access(),status(404));assert.equal(disabled.state().writes,0);
 const production=fixture({anonymous:true});await assert.rejects(production.access(),status(401));assert.equal(production.state().writes,0);
});
