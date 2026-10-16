import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {test} from 'node:test';
import {PGlite} from '@electric-sql/pglite';
const id=n=>`10000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
async function fixture(){
 const db=new PGlite();await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;CREATE SCHEMA auth;CREATE SCHEMA storage;
 CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb DEFAULT '{}');
 CREATE TABLE public.profiles(id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,role text,is_suspended boolean DEFAULT false);
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 GRANT USAGE ON SCHEMA public,auth TO anon,authenticated,service_role;`);
 await db.exec(await readFile(new URL('../sql/069_private_workbooks.sql',import.meta.url),'utf8'));
 for(let n=1;n<=3;n++){await db.query('INSERT INTO auth.users(id,email,email_confirmed_at) VALUES($1,$2,now())',[id(n),`learner${n}@example.test`]);await db.query('INSERT INTO profiles(id,role) VALUES($1,$2)',[id(n),n===3?'admin':'user']);}
 async function as(n,fn){await db.exec('SET ROLE authenticated');await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[id(n)]);try{return await fn();}finally{await db.exec('RESET ROLE');}}
 return{db,as};
}
test('private workbook migration: ownership, membership revocation, forged scores, private buckets',async()=>{
 const{db,as}=await fixture();try{
 await db.query("INSERT INTO workbook_memberships(user_id,book_key) VALUES($1,'aspekte-neu-b2')",[id(1)]);
 await db.query("SELECT workbook_save_state($1,'aspekte-neu-b2',0,$2)",[id(1),JSON.stringify({draft:{answers:{test:'private'}},attempts:[{score:50}]})]);
 assert.equal((await as(1,()=>db.query('SELECT * FROM workbook_learning_states'))).rows.length,1);
 assert.equal((await as(2,()=>db.query('SELECT * FROM workbook_learning_states'))).rows.length,0);
 assert.equal((await as(3,()=>db.query('SELECT * FROM workbook_learning_states'))).rows.length,0);
 await assert.rejects(as(1,()=>db.query("UPDATE workbook_learning_states SET payload='{}'")),/permission denied/);
 await assert.rejects(as(1,()=>db.query("SELECT workbook_save_state($1,'aspekte-neu-b2',1,'{}')",[id(1)])),/permission denied/);
 await assert.rejects(as(1,()=>db.query("INSERT INTO workbook_memberships(user_id,book_key) VALUES($1,'aspekte-neu-b2')",[id(2)])),/permission denied/);
 await db.query('UPDATE workbook_memberships SET active=false WHERE user_id=$1',[id(1)]);
 assert.equal((await as(1,()=>db.query('SELECT * FROM workbook_learning_states'))).rows.length,0);
 assert.deepEqual((await db.query('SELECT public FROM storage.buckets')).rows.map(r=>r.public),[false,false]);
 }finally{await db.close();}
});
test('private workbook migration: invitations are email-bound, single-use, expiring and revocable',async()=>{
 const{db,as}=await fixture();try{
 const invite=async(hash,email='learner1@example.test',extra='')=>db.query(`INSERT INTO workbook_invitations(book_key,email,token_hash,expires_at${extra?',revoked_at':''}) VALUES('aspekte-neu-b2',$1,$2,now()+interval '7 days'${extra?',now()':''})`,[email,hash]);
 const redeem=async(user,hash)=>(await db.query('SELECT workbook_redeem_invitation($1,$2) AS ok',[id(user),hash])).rows[0].ok;
 await invite('valid');assert.equal(await redeem(2,'valid'),false);assert.equal(await redeem(1,'valid'),true);assert.equal(await redeem(1,'valid'),false);
 await invite('expired');await db.exec("UPDATE workbook_invitations SET expires_at=now()-interval '1 second' WHERE token_hash='expired'");assert.equal(await redeem(1,'expired'),false);
 await invite('revoked','learner1@example.test','revoke');assert.equal(await redeem(1,'revoked'),false);
 await invite('unverified');await db.query('UPDATE auth.users SET email_confirmed_at=null WHERE id=$1',[id(1)]);assert.equal(await redeem(1,'unverified'),false);
 await db.query('UPDATE auth.users SET email_confirmed_at=now() WHERE id=$1',[id(1)]);await db.query('UPDATE profiles SET is_suspended=true WHERE id=$1',[id(1)]);assert.equal(await redeem(1,'unverified'),false);
 await assert.rejects(as(2,()=>db.query('SELECT workbook_redeem_invitation($1,$2)',[id(2),'valid'])),/permission denied/);
 assert.equal((await as(2,()=>db.query('SELECT * FROM workbook_invitations'))).rows.length,0);
 }finally{await db.close();}
});
test('private workbook migration: atomic revisions, isolated quotas, account deletion cascades',async()=>{
 const{db}=await fixture();try{
 const save=async(rev,payload)=>(await db.query("SELECT workbook_save_state($1,'aspekte-neu-b2',$2,$3) AS ok",[id(1),rev,JSON.stringify(payload)])).rows[0].ok;
 assert.equal(await save(0,{attempts:[1]}),true);assert.equal(await save(0,{attempts:[]}),false);assert.equal(await save(1,{attempts:[1,2]}),true);
 assert.deepEqual((await db.query('SELECT revision,payload FROM workbook_learning_states')).rows[0],{revision:2,payload:{attempts:[1,2]}});
 const quota=async(n)=>(await db.query('SELECT workbook_feedback_quota($1) AS ok',[id(n)])).rows[0].ok;
 for(let i=0;i<5;i++)assert.equal(await quota(1),true);assert.equal(await quota(1),false);assert.equal(await quota(2),true);
 await db.query('DELETE FROM auth.users WHERE id=$1',[id(1)]);assert.equal((await db.query('SELECT * FROM workbook_learning_states')).rows.length,0);
 }finally{await db.close();}
});
