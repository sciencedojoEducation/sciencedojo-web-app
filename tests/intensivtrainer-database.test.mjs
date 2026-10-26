import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
const book='aspekte-neu-b2-intensivtrainer';
const id=n=>`10000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
async function fixture(){
 const db=new PGlite();
 await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;CREATE SCHEMA auth;CREATE SCHEMA storage;
 CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb DEFAULT '{}');
 CREATE TABLE profiles(id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,role text,is_suspended boolean DEFAULT false);
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 GRANT USAGE ON SCHEMA public,auth TO anon,authenticated,service_role;`);
 await db.exec(await readFile(new URL('../sql/069_private_workbooks.sql',import.meta.url),'utf8'));
 await db.exec(await readFile(new URL('../sql/082_intensivtrainer.sql',import.meta.url),'utf8'));
 for(let n=1;n<=3;n++){
  await db.query('INSERT INTO auth.users(id,email,email_confirmed_at) VALUES($1,$2,now())',[id(n),`qa${n}@example.test`]);
  await db.query('INSERT INTO profiles(id,role) VALUES($1,$2)',[id(n),n<3?'admin':'user']);
  await db.query('INSERT INTO workbook_memberships(user_id,book_key) VALUES($1,$2)',[id(n),book]);
 }
 const as=async(n,fn)=>{await db.exec('SET ROLE authenticated');await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[id(n)]);try{return await fn();}finally{await db.exec('RESET ROLE');}};
 const save=async(n,revision,payload)=>(await db.query('SELECT intensivtrainer_save_state($1,$2,$3) AS ok',[id(n),revision,JSON.stringify(payload)])).rows[0].ok;
 return {db,as,save};
}
test('Intensivtrainer state is admin-only and each admin owns only their own work',async()=>{
 const {db,as,save}=await fixture();try{
  assert.equal(await save(1,0,{answers:{private:'first admin'}}),true);
  assert.equal(await save(2,0,{answers:{private:'second admin'}}),true);
  assert.equal(await save(3,0,{answers:{private:'learner forged'}}),false);
  for(const n of [1,2]){const rows=(await as(n,()=>db.query('SELECT user_id,payload FROM workbook_learning_states WHERE book_key=$1',[book]))).rows;assert.equal(rows.length,1);assert.equal(rows[0].user_id,id(n));}
  assert.equal((await as(3,()=>db.query('SELECT * FROM workbook_learning_states WHERE book_key=$1',[book]))).rows.length,0);
  assert.equal((await as(3,()=>db.query('SELECT * FROM workbook_memberships WHERE book_key=$1',[book]))).rows.length,0);
  await assert.rejects(as(1,()=>db.query("UPDATE workbook_learning_states SET payload='{}'")),/permission denied/);
  await assert.rejects(as(1,()=>db.query("SELECT intensivtrainer_save_state($1,1,'{}')",[id(1)])),/permission denied/);
  await db.exec('SET ROLE anon');await assert.rejects(db.query('SELECT * FROM workbook_learning_states'),/permission denied/);await db.exec('RESET ROLE');
 }finally{await db.close();}
});
test('database writer and RLS close on revocation, suspension, unverified email and admin demotion',async()=>{
 const {db,as,save}=await fixture();try{
  assert.equal(await save(1,0,{answers:{retained:'yes'}}),true);
  await db.query('UPDATE profiles SET role=$1 WHERE id=$2',['user',id(1)]);assert.equal(await save(1,1,{}),false);
  assert.equal((await as(1,()=>db.query('SELECT * FROM workbook_learning_states WHERE book_key=$1',[book]))).rows.length,0);
  await db.query("UPDATE profiles SET role='admin',is_suspended=true WHERE id=$1",[id(1)]);assert.equal(await save(1,1,{}),false);
  await db.query('UPDATE profiles SET is_suspended=false WHERE id=$1',[id(1)]);
  await db.query('UPDATE auth.users SET email_confirmed_at=null WHERE id=$1',[id(1)]);assert.equal(await save(1,1,{}),false);
  await db.query('UPDATE auth.users SET email_confirmed_at=now() WHERE id=$1',[id(1)]);
  await db.query("UPDATE auth.users SET raw_user_meta_data='{"+'"is_suspended":true'+"}' WHERE id=$1",[id(1)]);assert.equal(await save(1,1,{}),false);
  await db.query("UPDATE auth.users SET raw_user_meta_data='{}' WHERE id=$1",[id(1)]);
  await db.query('UPDATE workbook_memberships SET active=false WHERE user_id=$1 AND book_key=$2',[id(1),book]);assert.equal(await save(1,1,{}),false);
  assert.equal((await as(1,()=>db.query('SELECT * FROM workbook_learning_states WHERE book_key=$1',[book]))).rows.length,0);
 }finally{await db.close();}
});
test('new book CAS preserves old workbook data and remains service-only with deletion cleanup',async()=>{
 const {db,save}=await fixture();try{
  await db.query("SELECT workbook_save_state($1,'aspekte-neu-b2',0,$2)",[id(1),JSON.stringify({old:'untouched'})]);
  assert.equal(await save(1,0,{answers:{unicode:'schön, Grüße'}}),true);
  assert.equal(await save(1,0,{answers:{lost:'stale'}}),false);
  assert.equal(await save(1,1,{answers:{unicode:'fortgesetzt'}}),true);
  assert.deepEqual((await db.query("SELECT revision,payload FROM workbook_learning_states WHERE book_key='aspekte-neu-b2'")).rows,[{revision:1,payload:{old:'untouched'}}]);
  assert.deepEqual((await db.query('SELECT revision,payload FROM workbook_learning_states WHERE book_key=$1',[book])).rows,[{revision:2,payload:{answers:{unicode:'fortgesetzt'}}}]);
  await db.exec('SET ROLE service_role');assert.equal(await save(2,0,{answers:{service:'valid scoped writer'}}),true);await db.exec('RESET ROLE');
  await db.query('DELETE FROM auth.users WHERE id=$1',[id(1)]);
  assert.equal((await db.query('SELECT * FROM workbook_learning_states WHERE user_id=$1',[id(1)])).rows.length,0);
  assert.deepEqual((await db.query('SELECT public FROM storage.buckets')).rows.map(r=>r.public),[false,false]);
 }finally{await db.close();}
});
