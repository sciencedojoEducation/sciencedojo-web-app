/** Cloud recording acceptance with generated fixtures and disposable identities only. */
import assert from 'node:assert/strict';
import {readFile,writeFile,unlink} from 'node:fs/promises';
import {createHash,randomUUID,randomBytes} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';

assert.ok(process.argv.includes('--test-accounts'),'Use --test-accounts with generated audio fixtures; never real learner credentials.');
const origin=process.env.WORKBOOK_VERIFY_ORIGIN || 'http://localhost:3002';
assert.ok(origin==='https://www.sciencedojo.co.uk'||origin==='http://localhost:3002','Use the canonical workbook or isolated loopback production server.');
const fixtures=await Promise.all(process.argv.filter(a=>a.startsWith('--fixture=')).map(async a=>({bytes:await readFile(a.slice(10))})));
assert.ok(fixtures.length>=2&&fixtures.some(f=>f.bytes.length>4.5*1024*1024),'Supply small and larger-than-function-limit synthetic M4A fixtures.');
const project=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const admin=createClient(project,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const base=origin+'/api/workbook/aspekte-neu-b2',book='aspekte-neu-b2',bucket=admin.storage.from('workbook-recordings');
const root='private-materials/aspekte-neu-b2/derived',users=[],paths=[];
const report={checkedAt:new Date().toISOString(),origin,complete:false,checks:[],fixtures:[],microphoneAccessed:false,geminiProviderCalled:null};
const ok=(r,label)=>{assert.equal(r.error,null,label+': '+r.error?.message);return r.data;};
const hash=b=>createHash('sha256').update(b).digest('hex');
let recoveryQueue=Promise.resolve();
const recovery=()=>{recoveryQueue=recoveryQueue.then(()=>writeFile(root+'/recording-upload-cleanup.json',JSON.stringify({userIds:users.map(u=>u.id),paths},null,2)));return recoveryQueue;};
async function session(user){const cookies=new Map();const client=createServerClient(project,key,{cookies:{getAll:()=>[...cookies].map(([name,value])=>({name,value})),setAll:values=>values.forEach(c=>cookies.set(c.name,c.value))}});ok(await client.auth.signInWithPassword({email:user.email,password:user.password}),'test session');return [...cookies].map(([k,v])=>k+'='+v).join('; ');}
async function call(cookie,path,body,expected=200,init={}){
 const response=await fetch(base+path,{...init,headers:{Cookie:cookie,Origin:origin,...(body?{'Content-Type':'application/json'}:{}),...init.headers},...(body?{method:'POST',body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(90000)});
 assert.equal(response.status,expected,`${path}: ${response.status} ${response.status===expected?'':await response.clone().text()}`);return response;
}
async function missing(path){const index=path.lastIndexOf('/');const files=ok(await bucket.list(path.slice(0,index),{search:path.slice(index+1)}),'storage metadata after deletion');assert.ok(!files.some(f=>f.name===path.slice(index+1)),'object metadata must have been removed');}
try{
 for(let i=0;i<2;i++){
  const password=randomBytes(32).toString('hex');
  const user=ok(await admin.auth.admin.createUser({email:'workbook-recording-'+randomUUID()+'@example.test',password,email_confirm:true,user_metadata:{role:'user',full_name:'Disposable recording acceptance'}}),'create test identity').user;
  users.push({...user,password});await recovery();ok(await admin.from('workbook_memberships').insert({user_id:user.id,book_key:book,active:true}),'test membership');
 }
 const a=await session(users[0]),second=await session(users[0]),b=await session(users[1]);
 const chapter=await(await call(a,'?chapter=1')).json(),speaking=chapter.pages.flatMap(p=>p.exercises.map(e=>({...e,page:p.bookPage}))).find(e=>e.mode==='speaking');assert.ok(speaking);
 const exercise=`${speaking.page}:${speaking.id}`,endpoint=`/recordings?exercise=${exercise}&account=${users[0].id}`,upload=endpoint.replace('/recordings?','/recordings/upload?');
 async function prepare(bytes=fixtures[0].bytes,purpose='account'){
  const grant=await(await call(a,upload,{action:'prepare',mime:'audio/mp4',bytes:bytes.length,purpose})).json();paths.push(grant.path);await recovery();
  const storage=createClient(project,key,{auth:{persistSession:false,autoRefreshToken:false}}).storage.from('workbook-recordings');
  ok(await storage.uploadToSignedUrl(grant.path,grant.token,new Blob([bytes],{type:'audio/mp4'}),{contentType:'audio/mp4',cacheControl:'0'}),'direct signed upload');return grant;
 }
 await call('',upload,{action:'prepare',mime:'audio/mp4',bytes:100},401);
 await call(a,upload,{action:'prepare',mime:'audio/mp4',bytes:100},403,{headers:{Origin:'https://wrong.example'}});
 await call(a,upload,{action:'prepare',mime:'audio/mp4',bytes:10*1024*1024+1},400);
 await call(a,upload,{action:'prepare',mime:'text/plain',bytes:100},400);
 await call(a,upload.replace(`exercise=${exercise}`,`exercise=${exercise}:extra`),{action:'prepare',mime:'audio/mp4',bytes:100},404);
 for(const fixture of fixtures){
  const grant=await prepare(fixture.bytes);await call(a,upload,{action:'complete',ticket:grant.ticket});
  await call(second,upload,{action:'complete',ticket:grant.ticket}); // Lost success response retry.
  const recording=(await(await call(second,endpoint)).json()).recording;assert.ok(recording.url);
  assert.match(recording.url,/^\/api\/workbook\/aspekte-neu-b2\/recordings\/media\//);
  const media=new URL(recording.url,origin),full=await fetch(media,{headers:{Cookie:second}});assert.equal(full.status,200);assert.match(full.headers.get('cache-control'),/private, no-store/);assert.equal(hash(Buffer.from(await full.arrayBuffer())),hash(fixture.bytes));
  const seek=await fetch(media,{headers:{Cookie:second,Range:'bytes=50000-50063'}});assert.equal(seek.status,206);assert.deepEqual(Buffer.from(await seek.arrayBuffer()),fixture.bytes.subarray(50000,50064));
  const head=await fetch(media,{method:'HEAD',headers:{Cookie:second}});assert.equal(head.status,200);assert.equal(Number(head.headers.get('content-length')),fixture.bytes.length);
  assert.equal((await fetch(media)).status,401);assert.equal((await fetch(media,{headers:{Cookie:b}})).status,401);assert.equal((await fetch(new URL(recording.url.replace(users[0].id,users[1].id),origin),{headers:{Cookie:b}})).status,404);
  await call(b,upload.replace(users[0].id,users[1].id),{action:'complete',ticket:grant.ticket},400);
  await call(a,upload,{action:'cancel',ticket:grant.ticket});assert.ok((await bucket.download(grant.path)).data,'cancel cannot delete a committed recording');
  await call(second,endpoint,null,200,{method:'DELETE'});assert.equal((await(await call(a,endpoint)).json()).recording,null);await missing(grant.path);assert.equal((await fetch(media,{headers:{Cookie:a}})).status,404,'old media URL must stop working immediately after deletion');
  report.fixtures.push({bytes:fixture.bytes.length,sha256:hash(fixture.bytes),directUpload:true,independentSessionHashMatches:true,seeking:true,idempotentComplete:true,deletedAcrossSessionsAndStorage:true});
 }
 report.checks.push('10 MB limit validation, anonymous/origin/account isolation, direct upload, exact cross-session hashes, seeking and deletion');
 const concurrent=await Promise.all([prepare(),prepare()]);
 const results=await Promise.all(concurrent.map(g=>fetch(base+upload,{method:'POST',headers:{Cookie:a,Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({action:'complete',ticket:g.ticket})})));
 assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);const winner=concurrent[results.findIndex(r=>r.status===200)],loser=concurrent[results.findIndex(r=>r.status===409)];await missing(loser.path);
 await call(a,upload,{action:'complete',ticket:winner.ticket});
 const replacement=await prepare(fixtures[1].bytes);await call(a,upload,{action:'complete',ticket:replacement.ticket});await missing(winner.path);
 report.checks.push('concurrent saves keep exactly one winner; retry is idempotent; replacement removes the earlier object');
 const stale=await prepare();
 const state=(await(await call(a,'/study')).json()).state;
 await call(a,'/study',{action:'start-session',accountId:users[0].id,revision:state.revision,id:randomUUID(),chapter:1,exercises:[exercise]});
 await call(a,upload,{action:'complete',ticket:stale.ticket},409);await missing(stale.path);
 assert.equal((await(await call(second,endpoint)).json()).recording,null);
 const history=(await(await call(second,'/recordings/history?account='+users[0].id)).json()).recordings;assert.equal(history.length,1);
 await call(second,`/recordings/history?account=${users[0].id}&id=${history[0].id}`,null,200,{method:'DELETE'});await missing(replacement.path);
 report.checks.push('a fresh attempt rejects stale uploads and preserves prior recordings in history; history deletion removes the object');
 const wrongSize=await(await call(a,upload,{action:'prepare',mime:'audio/mp4',bytes:fixtures[0].bytes.length+1})).json();paths.push(wrongSize.path);await recovery();
 ok(await bucket.upload(wrongSize.path,fixtures[0].bytes,{contentType:'audio/mp4'}),'mismatched-size fixture');await call(a,upload,{action:'complete',ticket:wrongSize.ticket},400);await missing(wrongSize.path);
 const feedback=await prepare(fixtures.at(-1).bytes,'feedback');await call(a,upload,{action:'complete',ticket:feedback.ticket},400);
 ok(await admin.from('workbook_feedback_requests').insert(Array.from({length:30},()=>({user_id:users[0].id,requested_at:new Date(Date.now()-120_000).toISOString()}))),'exhaust disposable hourly quota');
 assert.equal(ok(await admin.rpc('workbook_feedback_quota',{target_user:users[0].id}),'persistent hourly limit'),false);
 const form=new FormData();form.set('accountId',users[0].id);form.set('page',String(speaking.page));form.set('exercise',speaking.id);form.set('audioTicket',feedback.ticket);
 await call(a,'/feedback',null,429,{method:'POST',body:form});report.geminiProviderCalled=false;await missing(feedback.path);
 assert.equal((await(await call(a,endpoint)).json()).recording,null);
 report.checks.push('metadata mismatch is rejected; feedback-only audio cannot become an account recording; a large temporary feedback upload reaches persistent quota checking and is removed without calling Gemini');
 const retained=await prepare();await call(a,upload,{action:'complete',ticket:retained.ticket});const retainedMedia=(await(await call(a,endpoint)).json()).recording.url;
 const revoked=await prepare();ok(await admin.from('workbook_memberships').update({active:false}).eq('user_id',users[0].id),'revoke only test membership');await call(a,upload,{action:'complete',ticket:revoked.ticket},403);assert.equal((await fetch(new URL(retainedMedia,origin),{headers:{Cookie:a}})).status,403);
 report.checks.push('membership revocation rejects both existing recording playback and finalization of previously authorized uploads');
 report.complete=true;
}catch(error){report.failure=error.message;throw error;
}finally{
 const errors=[];
 if(paths.length){const r=await bucket.remove([...new Set(paths)]);if(r.error)errors.push('test objects');}
 for(const user of users){const r=await bucket.list(`${user.id}/${book}`);if(r.error||r.data.length)errors.push('test object metadata');}
 for(const user of users){const r=await admin.auth.admin.deleteUser(user.id);if(r.error)errors.push('test identity '+user.id);}
 report.disposableIdentitiesAndObjectsRemoved=users.length===2&&!errors.length;
 await writeFile(root+'/recording-direct-upload-verification.json',JSON.stringify(report,null,2)+'\n');
 if(errors.length)throw new Error('See private recording-upload-cleanup.json: '+errors.join(', '));
 await unlink(root+'/recording-upload-cleanup.json').catch(e=>{if(e.code!=='ENOENT')throw e});
}
console.log(JSON.stringify(report,null,2));
