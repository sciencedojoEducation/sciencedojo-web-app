import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {PGlite} from '@electric-sql/pglite';
import {parseLehrbuchEntry,lehrbuchLocalRequest} from '../lib/lehrbuch.ts';
const sample={id:'145be42a-dce8-4315-a40f-c93f02465f41',page:9,kind:'question',title:'Was bedeutet Heimat?',body:'Meine Antwort. සිංහල ✓',resolved:0,x:3000,y:2500,revision:0,updated:''};
test('textbook entries validate answers and pin bounds without accepting another payload shape',()=>{
 assert.equal(parseLehrbuchEntry(sample).body,sample.body);
 for(const delta of [{id:'../file'},{page:203},{x:10001},{revision:-1},{resolved:2},{kind:'script'},{body:'x'.repeat(40001)}])assert.throws(()=>parseLehrbuchEntry({...sample,...delta}));
});
test('development preview requires actual loopback host, matching origin and trusted fetch context',()=>{
 const req=(url,headers={})=>new Request(url,{headers});
 assert.equal(lehrbuchLocalRequest(req('http://localhost:3003/'),'development'),true);
 for(const [url,h,mode]of [['http://localhost:3003/',{},'production'],['http://remote.test/',{},'development'],['http://localhost:3003/',{host:'remote.test'},'development'],['http://localhost:3003/',{'x-forwarded-host':'remote.test'},'development'],['http://localhost:3003/',{origin:'https://other.test'},'development'],['http://localhost:3003/',{'sec-fetch-site':'same-site'},'development']])assert.equal(lehrbuchLocalRequest(req(url,h),mode),false);
});
test('local saving is durable, atomic and does not touch Arbeitsbuch state; hosted routes demand database-backed admin access',async()=>{
 const root=await mkdtemp(join(tmpdir(),'lehrbuch-state-'));
 const code=ts.transpileModule(await readFile(new URL('../lib/lehrbuch-server.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const access={id:'local-preview',email:'',local:true,admin:true};
 const exports={};let checkedAdmin=false;
 class AccessError extends Error{constructor(status,message){super(message);this.status=status;}}
 const modules={'server-only':{},'node:fs/promises':await import('node:fs/promises'),'node:path':await import('node:path'),'@/lib/workbook-access':{WorkbookAccessError:AccessError,async requireWorkbookAccess(request,admin){checkedAdmin=admin;throw new AccessError(401,'Sign in');}},'@/lib/lehrbuch':{LEHRBUCH_KEY:'aspekte-neu-b2-lehrbuch',lehrbuchLocalRequest},'@/utils/supabase/admin':{createAdminClient(){throw new Error('Unexpected cloud write');}}};
 runInNewContext(code,{exports,require:n=>{assert.ok(n in modules,n);return modules[n];},process:{cwd:()=>root,env:{NODE_ENV:'development'}},crypto});
 try{
 assert.equal((await exports.requireLehrbuchAccess(new Request('http://localhost:3003/'))).local,true);
 await assert.rejects(exports.requireLehrbuchAccess(new Request('https://www.sciencedojo.co.uk/')),e=>e.status===401);assert.equal(checkedAdmin,true);
 assert.deepEqual([...await exports.readLehrbuchEntries(access)],[]);
 const results=await Promise.all([exports.writeLehrbuchEntry(access,sample),exports.writeLehrbuchEntry(access,{...sample,body:'competing'})]);assert.equal(results.filter(Boolean).length,1);
 assert.equal((await exports.readLehrbuchEntries(access))[0].body,sample.body);
 assert.equal(await exports.writeLehrbuchEntry(access,{...sample,revision:1,resolved:1}),true);
 assert.equal((await exports.readLehrbuchEntries(access))[0].revision,2);
 assert.equal(await exports.writeLehrbuchEntry(access,{...sample,revision:1},true),false);
 assert.equal(await exports.writeLehrbuchEntry(access,{...sample,revision:2},true),true);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('actual SQL migration preserves own-admin privacy, service-only writes, CAS conflicts and account cleanup',async()=>{
 const db=new PGlite();const id=n=>`10000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
 try{
 await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;CREATE SCHEMA auth;CREATE SCHEMA storage;
 CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb DEFAULT '{}');
 CREATE TABLE profiles(id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,role text,is_suspended boolean DEFAULT false);
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 GRANT USAGE ON SCHEMA public,auth TO anon,authenticated,service_role;`);
 await db.exec(await readFile(new URL('../sql/069_private_workbooks.sql',import.meta.url),'utf8'));
 await db.exec(await readFile(new URL('../sql/081_workbook_reflections.sql',import.meta.url),'utf8'));
 for(let n=1;n<=3;n++){await db.query('INSERT INTO auth.users(id,email_confirmed_at)VALUES($1,now())',[id(n)]);await db.query('INSERT INTO profiles(id,role)VALUES($1,$2)',[id(n),n===3?'user':'admin']);}
 const save=async(n,rev,payload=sample)=>(await db.query('SELECT workbook_save_reflection($1,$2,$3,$4) AS ok',[id(n),sample.id,rev,JSON.stringify(payload)])).rows[0].ok;
 assert.equal(await save(1,0),true);assert.equal(await save(1,0),false);assert.equal(await save(1,1,{...sample,resolved:1}),true);assert.equal(await save(1,1),false);assert.equal(await save(3,0),false);
 const as=async(n,fn)=>{await db.exec('SET ROLE authenticated');await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[id(n)]);try{return await fn();}finally{await db.exec('RESET ROLE');}};
 assert.equal((await as(1,()=>db.query('SELECT * FROM workbook_reflections'))).rows.length,1);
 for(const n of [2,3])assert.equal((await as(n,()=>db.query('SELECT * FROM workbook_reflections'))).rows.length,0);
 await assert.rejects(as(1,()=>db.query('UPDATE workbook_reflections SET body=\'forged\'')),/permission denied/);
 await assert.rejects(as(1,()=>db.query('SELECT workbook_save_reflection($1,$2,2,$3)',[id(1),sample.id,JSON.stringify(sample)])),/permission denied/);
 await db.query('UPDATE profiles SET is_suspended=true WHERE id=$1',[id(1)]);assert.equal(await save(1,2),false);assert.equal((await as(1,()=>db.query('SELECT * FROM workbook_reflections'))).rows.length,0);
 assert.equal((await db.query('SELECT count(*)::int AS count FROM workbook_learning_states')).rows[0].count,0);
 await db.query('DELETE FROM auth.users WHERE id=$1',[id(1)]);assert.equal((await db.query('SELECT * FROM workbook_reflections')).rows.length,0);
 }finally{await db.close();}
});
