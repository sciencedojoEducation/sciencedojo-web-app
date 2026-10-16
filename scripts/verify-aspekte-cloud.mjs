/** Verify deployed database/storage with disposable identities; never uses real learner data. */
import assert from 'node:assert/strict';
import {createHash, randomUUID, randomBytes} from 'node:crypto';
import {readFile, readdir, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';

const project=process.env.NEXT_PUBLIC_SUPABASE_URL,anonKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const options={auth:{persistSession:false,autoRefreshToken:false}};
const admin=createClient(project,process.env.SUPABASE_SERVICE_ROLE_KEY,options);
const anon=createClient(project,anonKey,options);
const root=join(process.cwd(),'private-materials/aspekte-neu-b2/derived');
const book='aspekte-neu-b2',bucket='private-workbooks';
const report={checkedAt:new Date().toISOString(),objectsVerified:0,bytesVerified:0,checks:[],testAccountsRemoved:false};
const testAccounts=process.argv.includes('--test-accounts');
const apiOnly=process.argv.includes('--api-only');
const origin=process.env.WORKBOOK_VERIFY_ORIGIN;
const users=[],invitations=[],recordingPaths=[];
function ok(result,label){assert.equal(result.error,null,`${label}: ${result.error?.message}`);return result.data;}
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
async function clientFor(user){
 const client=createClient(project,anonKey,options);
 const data=ok(await client.auth.signInWithPassword({email:user.email,password:user.password}),'test sign in');
 const cookies=new Map();
 const ssr=createServerClient(project,anonKey,{cookies:{getAll:()=>[...cookies].map(([name,value])=>({name,value})),setAll:values=>values.forEach(c=>cookies.set(c.name,c.value))}});
 ok(await ssr.auth.setSession(data.session),'test session');
 return {client,cookie:[...cookies].map(([name,value])=>`${name}=${value}`).join('; ')};
}
async function request(account,path,body,expected=200,extra={}){
 const response=await fetch(`${origin}/api/workbook/${book}${path}`,{...extra,headers:{Cookie:account?.cookie||'',Origin:origin,...(body?{'Content-Type':'application/json'}:{}),...extra.headers},...(body?{method:'POST',body:JSON.stringify(body)}:{})});
 const errorMessage=response.status===expected?'':(await response.clone().json().catch(()=>({}))).message||'';
 assert.equal(response.status,expected,`API ${path} returned ${response.status}, expected ${expected}: ${errorMessage}`);
 return response;
}
try{
 for(const name of [bucket,'workbook-recordings'])assert.equal(ok(await admin.storage.getBucket(name),'private bucket').public,false);
 if(!apiOnly){
 const files=['manifest.json'];
 for(const directory of ['content','pages','figures','symbols','audio'])for(const file of await readdir(join(root,directory))){
  if(directory==='content'&&!/^\d{3}\.json$/.test(file))continue;
  if(['pages','figures','symbols'].includes(directory)&&!file.endsWith('.jpg'))continue;
  if(directory==='audio'&&!/^\d{2}\.m4a$/.test(file))continue;
  files.push(`${directory}/${file}`);
 }
 for(let index=0;index<files.length;index+=4)await Promise.all(files.slice(index,index+4).map(async file=>{
  const local=await readFile(join(root,file));
  const remote=Buffer.from(await ok(await admin.storage.from(bucket).download(`${book}/${file}`),'private object').arrayBuffer());
  assert.equal(hash(remote),hash(local),`Cloud object differs: ${file}`);report.objectsVerified++;report.bytesVerified+=remote.length;
 }));
 report.checks.push('every private runtime object matches its local SHA-256');
 await writeFile(join(root,'cloud-assets-verification.json'),JSON.stringify(report,null,2)+'\n');
 }
 assert.ok((await anon.storage.from(bucket).download(`${book}/manifest.json`)).error,'anonymous private object download must fail');
 assert.ok((await anon.storage.from(bucket).createSignedUrl(`${book}/manifest.json`,60)).error,'anonymous signing must fail');
 assert.ok(!(await fetch(`${project}/storage/v1/object/public/${bucket}/${book}/manifest.json`)).ok,'public object URL must fail');
 report.checks.push('anonymous and public storage URLs cannot expose workbook source');
 if(testAccounts){
  if(origin)assert.ok(/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin),'API tests require a loopback production test server');
  for(let n=0;n<2;n++){
   const email=`workbook-verification-${randomUUID()}@example.test`,password=randomBytes(32).toString('hex');
   const user=ok(await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{role:'user',full_name:'Disposable workbook verification'}}),'create disposable account').user;
   users.push({...user,password});
   assert.ok(ok(await admin.from('profiles').select('id').eq('id',user.id).single(),'test account profile'));
  }
  const [a,b]=await Promise.all(users.map(clientFor));
  const invite=async(email,overrides={})=>{
   const token=randomBytes(32).toString('hex');
   const row=ok(await admin.from('workbook_invitations').insert({book_key:book,email,token_hash:hash(token),expires_at:new Date(Date.now()+7*86400000).toISOString(),...overrides}).select('id').single(),'test invitation');
   invitations.push(row.id);return token;
  };
  const redeem=async(user,token)=>ok(await admin.rpc('workbook_redeem_invitation',{target_user:user.id,invitation_hash:hash(token)}),'redeem');
  const token=await invite(users[0].email);
  assert.equal(await redeem(users[1],token),false);assert.equal(await redeem(users[0],token),true);assert.equal(await redeem(users[0],token),false);
  assert.equal(await redeem(users[1],await invite(users[1].email,{expires_at:new Date(Date.now()-10000).toISOString()})),false);
  assert.equal(await redeem(users[1],await invite(users[1].email,{revoked_at:new Date().toISOString()})),false);
  assert.equal(await redeem(users[1],await invite(users[1].email)),true);
  assert.ok((await a.client.rpc('workbook_redeem_invitation',{target_user:users[1].id,invitation_hash:hash(token)})).error);
  report.checks.push('email-bound invitations are single-use, expiring, revocable and service-only');
  const payload={draft:{answers:{test:'disposable private response'}},attempts:[]};
  const save=revision=>admin.rpc('workbook_save_state',{target_user:users[0].id,target_book:book,expected_revision:revision,next_payload:payload});
  assert.equal(ok(await save(0),'initial CAS'),true);assert.equal(ok(await save(0),'stale CAS'),false);
  assert.equal(ok(await a.client.from('workbook_learning_states').select('user_id'),'own state').length,1);
  assert.deepEqual(ok(await b.client.from('workbook_learning_states').select('user_id'),'other state'),[]);
  const forged=await a.client.from('workbook_learning_states').update({payload:{attempts:[{score:100}]}}).eq('user_id',users[0].id).select();
  assert.ok(forged.error||forged.data?.length===0);assert.deepEqual(ok(await admin.from('workbook_learning_states').select('payload').eq('user_id',users[0].id).single(),'unchanged private state').payload,payload);
  assert.ok((await a.client.rpc('workbook_save_state',{target_user:users[0].id,target_book:book,expected_revision:1,next_payload:{}})).error);
  ok(await admin.from('workbook_learning_states').delete().in('user_id',users.map(u=>u.id)),'reset disposable state');
  report.checks.push('live RLS isolates progress; learner writes and score-forging RPCs denied; CAS rejects stale revisions');
  assert.ok((await a.client.storage.from(bucket).download(`${book}/manifest.json`)).error);
  assert.ok((await a.client.storage.from(bucket).createSignedUrl(`${book}/manifest.json`,60)).error);
  report.checks.push('even invited learners cannot read raw source or create storage signatures');
  for(let n=0;n<5;n++)assert.equal(ok(await admin.rpc('workbook_feedback_quota',{target_user:users[0].id}),'quota'),true);
  assert.equal(ok(await admin.rpc('workbook_feedback_quota',{target_user:users[0].id}),'quota exhausted'),false);
  assert.equal(ok(await admin.rpc('workbook_feedback_quota',{target_user:users[1].id}),'isolated quota'),true);
  report.checks.push('persistent feedback limits reject the sixth minute request and isolate learners');
  if(origin){
   await request(null,'/study',null,401);
   let state=(await(await request(a,'/study')).json()).state;
   const chapter=await(await request(a,'?chapter=1')).json();assert.equal(chapter.pages.length,14);
   for(const p of chapter.pages)for(const e of p.exercises){assert.equal('modelAnswer' in e,false);for(const f of e.fields)assert.equal('answers' in f,false);}
   const draft=structuredClone(state.draft);draft.answers['6:2:1']='temporary cloud answer';draft.position={...draft.position,page:10,track:2,seconds:12,view:'book'};
   const saved=await(await request(a,'/study',{action:'save',accountId:users[0].id,revision:state.revision,draft})).json();state=saved.state;
   const anotherDevice=await clientFor(users[0]);
   assert.equal((await(await request(anotherDevice,'/study')).json()).state.draft.answers['6:2:1'],'temporary cloud answer');
   assert.equal((await(await request(b,'/study')).json()).state.draft.answers['6:2:1'],undefined);
   await request(b,'/study',{action:'save',accountId:users[0].id,revision:state.revision,draft},401);
   await request(a,'/study',{action:'save',accountId:users[0].id,revision:0,draft},409);
   const id=randomUUID();const submitted=await(await request(a,'/study',{action:'submit',accountId:users[0].id,revision:state.revision,chapter:1,kind:'practice',exercises:['6:2'],id})).json();
   state=submitted.state;assert.ok(submitted.attempt.result.scored>0);assert.equal(submitted.attempt.result.correct,0);
   const repeated=await(await request(a,'/study',{action:'submit',accountId:users[0].id,revision:state.revision,chapter:1,kind:'practice',exercises:['6:2'],id})).json();assert.equal(repeated.state.attempts.length,state.attempts.length);
   state=(await(await request(a,'/study',{action:'start-session',accountId:users[0].id,revision:state.revision,chapter:1,exercises:['6:2'],id:randomUUID()})).json()).state;
   assert.equal(state.draft.answers['6:2:1'],undefined);assert.equal(Object.hasOwn(state.draft.revealed,'6:2:1'),false);
   report.checks.push('production API uses cloud chapters, withholds keys, saves across independent sessions, isolates accounts, grades on server and preserves fresh attempts');
   const media=await request(a,'/assets/audio/2',null,307,{redirect:'manual'});const signed=media.headers.get('location');assert.ok(signed);
   const audio=await fetch(signed,{headers:{Range:'bytes=0-63'}});assert.equal(audio.status,206);assert.equal((await audio.arrayBuffer()).byteLength,64);
   await request(null,'/assets/audio/2',null,401);
   report.checks.push('authorized audio redirects to private signed stream with byte-range support');
   const speaking=chapter.pages.flatMap(p=>p.exercises.map(e=>({...e,page:p.bookPage}))).find(e=>e.mode==='speaking');assert.ok(speaking);
   const path=`/recordings?account=${users[0].id}&exercise=${speaking.page}:${speaking.id}`;
   const form=new FormData();form.set('audio',new Blob([new Uint8Array([0x1a,0x45,0xdf,0xa3,0x80])],{type:'audio/webm'}),'disposable.webm');
   await request(a,path,null,200,{method:'POST',body:form});
   const row=ok(await admin.from('workbook_recordings').select('storage_path').eq('user_id',users[0].id).single(),'disposable recording');recordingPaths.push(row.storage_path);
   assert.ok((await b.client.storage.from('workbook-recordings').download(row.storage_path)).error);
   assert.deepEqual(ok(await b.client.from('workbook_recordings').select('id'),'other recordings'),[]);
   const recording=(await(await request(anotherDevice,path)).json()).recording;assert.ok(recording.url);assert.equal((await fetch(recording.url)).status,200);
   await request(a,path,null,200,{method:'DELETE'});
   assert.equal((await(await request(anotherDevice,path)).json()).recording,null);
   assert.ok((await admin.storage.from('workbook-recordings').download(row.storage_path)).error);
   report.checks.push('synthetic recording upload, private cross-session retrieval, isolation and storage deletion pass; real microphone remains unverified');
  }
  ok(await admin.from('workbook_memberships').update({active:false}).eq('user_id',users[0].id),'revoke test membership');
  assert.deepEqual(ok(await a.client.from('workbook_learning_states').select('user_id'),'revoked progress'),[]);
  if(origin)await request(a,'/study',null,403);
  report.checks.push('membership revocation blocks progress and new API requests');
 }
}finally{
 const cleanupErrors=[];
 if(recordingPaths.length){const removed=await admin.storage.from('workbook-recordings').remove(recordingPaths);if(removed.error)cleanupErrors.push('recording objects');}
 if(invitations.length){const removed=await admin.from('workbook_invitations').delete().in('id',invitations);if(removed.error)cleanupErrors.push('test invitations');}
 for(const user of users){const deleted=await admin.auth.admin.deleteUser(user.id);if(deleted.error)cleanupErrors.push(`test account ${user.id}`);}
 report.testAccountsRemoved=testAccounts&&users.length===2&&!cleanupErrors.length;
 if(cleanupErrors.length){await writeFile(join(root,'cloud-verification-cleanup.json'),JSON.stringify({userIds:users.map(u=>u.id),invitations,recordingPaths,cleanupErrors},null,2));throw new Error('Disposable verification cleanup needs attention; see private cloud-verification-cleanup.json');}
}
await writeFile(join(root,apiOnly?'cloud-api-verification.json':testAccounts?'cloud-verification.json':'cloud-assets-verification.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
