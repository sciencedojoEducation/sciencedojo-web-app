/** Opt-in live account/API acceptance. Creates and removes only owned disposable fixtures. */
import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
import {emptyTrainerState,TRAINER_KEY} from '../lib/intensivtrainer.ts';
import {emptyWorkbookLearningState} from '../lib/workbook-study.ts';
assert.ok(process.argv.includes('--test-accounts'),'Explicit --test-accounts is required');
const origin=new URL(process.env.WORKBOOK_VERIFY_ORIGIN||'http://localhost:3005');
assert.equal(origin.href,origin.origin+'/');
assert.ok(origin.protocol==='http:'&&['localhost','127.0.0.1'].includes(origin.hostname)&&origin.port||origin.origin==='https://www.sciencedojo.co.uk','Use the isolated loopback production server or the canonical ScienceDojo domain');
const project=process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,service=process.env.SUPABASE_SERVICE_ROLE_KEY;
assert.ok(project&&anon&&service,'Existing ScienceDojo credentials are required');
const options={auth:{persistSession:false,autoRefreshToken:false}},admin=createClient(project,service,options);
const root=join(process.cwd(),'private-materials',TRAINER_KEY,'derived'),run=randomUUID(),users=[];
const report={checkedAt:new Date().toISOString(),origin:origin.origin,run,checks:[],passed:false,testAccountsRemoved:false};
const evidence=join(root,`account-verification-${run}.json`),recovery=join(root,`account-fixtures-${run}.json`);
const data=(result,label)=>{assert.equal(result.error,null,`${label}: ${result.error?.message}`);return result.data;};
async function signedIn(user){
 const client=createClient(project,anon,options),session=data(await client.auth.signInWithPassword({email:user.email,password:user.password}),'fixture sign-in').session;
 const jar=new Map(),ssr=createServerClient(project,anon,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:values=>values.forEach(c=>jar.set(c.name,c.value))}});
 data(await ssr.auth.setSession(session),'fixture session');return {client,id:user.id,cookie:[...jar].map(([name,value])=>`${name}=${value}`).join('; ')};
}
async function request(account,path,body,expected=200,headers={}){
 const response=await fetch(`${origin.origin}/api/workbook/${TRAINER_KEY}${path}`,{redirect:'manual',headers:{Cookie:account?.cookie||'',Origin:origin.origin,...(body?{'Content-Type':'application/json'}:{}),...headers},...(body?{method:'POST',body:JSON.stringify(body)}:{})});
 assert.equal(response.status,expected,`${path}: expected ${expected}, got ${response.status}`);assert.match(response.headers.get('cache-control')||'',/no-store/);return response;
}
async function state(account){return (await request(account,'/study')).json();}
async function save(account,saved,next=saved.state,expected=200,headers={}){return request(account,'/study',{accountId:account.id,revision:saved.revision,state:next},expected,headers);}
// Do not provision fixtures until the hosted schema is ready.
const schema=await fetch(project+'/rest/v1/',{headers:{apikey:service,Authorization:`Bearer ${service}`,Accept:'application/openapi+json'}});assert.ok(schema.ok);
assert.ok((await schema.json()).paths?.['/rpc/intensivtrainer_save_state'],'Apply migration 082 before running account acceptance');
assert.equal(data(await admin.storage.getBucket('private-workbooks'),'private bucket').public,false);
try {
 for(const role of ['admin','admin','user']){
  const email=`trainer-qa-${randomUUID()}@example.test`,password=randomBytes(32).toString('hex');
  const user=data(await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:'Disposable Intensivtrainer verification',role:'user'}}),'create fixture').user;
  users.push({id:user.id,email,password});
  await writeFile(recovery,JSON.stringify({run,userIds:users.map(u=>u.id),cleaned:false},null,2));
  data(await admin.from('profiles').update({role,is_suspended:false}).eq('id',user.id).select('id').single(),'fixture database role');
 }
 const [a,b,learner]=await Promise.all(users.map(signedIn)),otherSession=await signedIn(users[0]);
 await request(null,'?page=4',null,401);await request(null,'/study',null,401);await request(null,'/assets/page-03',null,401);
 await request(learner,'?page=4',null,403);await request(learner,'/study',null,403);await request(learner,'/assets/page-03',null,403);
 report.checks.push('anonymous and verified nonadmin accounts cannot open content, source or state');
 const page=(await (await request(a,'?page=4')).json()).page;
 assert.ok(page.nativeExercises.length>0);
 for(const exercise of page.nativeExercises){assert.equal('modelAnswer' in exercise,false);assert.equal('solutionEvidence' in exercise,false);for(const field of exercise.fields)assert.equal('answers' in field,false);}
 for(const path of ['/assets/page-03','/assets/figure/fig-4-1']){const response=await request(a,path);assert.equal(response.headers.get('content-type'),'image/jpeg');assert.equal(response.headers.get('location'),null);const bytes=new Uint8Array(await response.arrayBuffer());assert.equal(bytes[0],255);assert.equal(bytes[1],216);}
 await request(a,'?page=84',null,404);await request(a,'/assets/manifest',null,404);
 report.checks.push('admin native content withholds keys; protected source/figure streams stay on the application origin');
 const initial=await state(a);assert.equal(initial.account.local,false);assert.equal(initial.account.id,a.id);assert.equal(initial.revision,0);
 const next=emptyTrainerState();next.answers['4:1a:1']='synthetic private admin answer';next.notes['4']='synthetic page note';next.review['4:1a']='again';
 next.history=[{id:randomUUID(),at:new Date().toISOString(),page:4,exercise:'1a',answers:{'4:1a:1':'synthetic earlier answer'}}];
 await save(a,initial,next);
 const resumed=await state(otherSession);assert.equal(resumed.state.answers['4:1a:1'],next.answers['4:1a:1']);assert.equal(resumed.state.history.length,1);
 assert.deepEqual((await state(b)).state.answers,{});
 await request(b,`/study?account=${a.id}`,null,401);await request(b,'/study',{accountId:a.id,revision:resumed.revision,state:next},401);
 await save(a,resumed,next,403,{Origin:'https://example.com'});await save(a,resumed,{...next,book:'aspekte-neu-b2'},400);
 const concurrent=await Promise.all([fetch(`${origin.origin}/api/workbook/${TRAINER_KEY}/study`,{method:'POST',headers:{Cookie:a.cookie,Origin:origin.origin,'Content-Type':'application/json'},body:JSON.stringify({accountId:a.id,revision:resumed.revision,state:{...next,notes:{4:'device one'}}})}),fetch(`${origin.origin}/api/workbook/${TRAINER_KEY}/study`,{method:'POST',headers:{Cookie:otherSession.cookie,Origin:origin.origin,'Content-Type':'application/json'},body:JSON.stringify({accountId:a.id,revision:resumed.revision,state:{...next,notes:{4:'device two'}}})})]);
 assert.deepEqual(concurrent.map(r=>r.status).sort(),[200,409]);
 const current=await state(a);assert.equal(current.revision,resumed.revision+1);assert.equal(current.state.answers['4:1a:1'],next.answers['4:1a:1']);
 report.checks.push('independent sessions resume answers/notes/review/history; accounts stay isolated and simultaneous saves produce one conflict');
 assert.ok((await a.client.rpc('intensivtrainer_save_state',{target_user:a.id,expected_revision:current.revision,next_payload:next})).error);
 const forged=await a.client.from('workbook_learning_states').update({payload:{forged:true}}).eq('user_id',a.id).eq('book_key',TRAINER_KEY).select();assert.ok(forged.error||!forged.data.length);
 assert.equal((await state(a)).state.answers['4:1a:1'],next.answers['4:1a:1']);
 assert.deepEqual(data(await b.client.from('workbook_learning_states').select('user_id').eq('book_key',TRAINER_KEY),'other account RLS'),[]);
 for(const account of [a,learner]){assert.ok((await account.client.storage.from('private-workbooks').download(`${TRAINER_KEY}/manifest.json`)).error);assert.ok((await account.client.storage.from('private-workbooks').createSignedUrl(`${TRAINER_KEY}/manifest.json`,60)).error);}
 report.checks.push('authenticated raw-source signing/downloads and direct client state writes/RPC execution are denied');
 const old=emptyWorkbookLearningState();old.draft.answers['6:2:1']='separate synthetic Arbeitsbuch answer';
 data(await admin.from('workbook_memberships').insert({user_id:a.id,book_key:'aspekte-neu-b2',active:true}),'old-book fixture membership');
 data(await admin.from('workbook_learning_states').insert({user_id:a.id,book_key:'aspekte-neu-b2',revision:7,payload:old}),'old-book fixture state');
 data(await admin.from('profiles').update({role:'user'}).eq('id',a.id),'demote fixture');await request(a,'/study',null,403);await request(a,'?page=4',null,403);
 assert.deepEqual(data(await a.client.from('workbook_learning_states').select('user_id').eq('book_key',TRAINER_KEY),'demoted RLS'),[]);
 assert.equal(data(await admin.rpc('intensivtrainer_save_state',{target_user:a.id,expected_revision:current.revision,next_payload:next}),'demoted writer'),false);
 assert.deepEqual(data(await a.client.from('workbook_learning_states').select('revision,payload').eq('book_key','aspekte-neu-b2').single(),'preserved old book'),{revision:7,payload:old});
 data(await admin.from('profiles').update({role:'admin',is_suspended:true}).eq('id',a.id),'suspend fixture');await request(a,'/study',null,403);
 data(await admin.from('profiles').update({is_suspended:false}).eq('id',a.id),'restore fixture role');
 data(await admin.from('workbook_memberships').update({active:false}).eq('user_id',a.id).eq('book_key',TRAINER_KEY),'revoke fixture');await request(a,'/study',null,403);await request(a,'/assets/page-03',null,403);
 assert.equal(data(await admin.rpc('intensivtrainer_save_state',{target_user:a.id,expected_revision:current.revision,next_payload:next}),'revoked writer'),false);
 report.checks.push('demotion, suspension and revocation close access/writes; existing Arbeitsbuch state and learner behavior remain separate');
 report.passed=true;
} finally {
 const errors=[];
 for(const user of users){const result=await admin.auth.admin.deleteUser(user.id);if(result.error)errors.push(user.id);}
 if(!errors.length&&users.length){
  for(const table of ['workbook_memberships','workbook_learning_states']){const remaining=await admin.from(table).select('user_id').in('user_id',users.map(u=>u.id));if(remaining.error||remaining.data.length)errors.push(table);}
 }
 report.testAccountsRemoved=users.length===3&&!errors.length;
 if(errors.length)report.passed=false;
 await writeFile(recovery,JSON.stringify({run,userIds:users.map(u=>u.id),cleaned:!errors.length,cleanupErrors:errors},null,2));
 await writeFile(evidence,JSON.stringify(report,null,2));
 assert.equal(errors.length,0,'Owned fixture cleanup needs attention; see private account-fixtures record');
}
console.log(JSON.stringify(report));
