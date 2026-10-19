import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const migration=await readFile(new URL('../sql/078_security_advisor_hardening.sql',import.meta.url),'utf8');
const uid=n=>`90000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
export async function securityFixture(baseline) {
 const db=new PGlite();
 await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
 CREATE SCHEMA auth; CREATE SCHEMA storage;
 REVOKE CREATE ON SCHEMA public FROM PUBLIC;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
 CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$SELECT auth.jwt()->>'role'$$;
 CREATE FUNCTION storage.operation() RETURNS text LANGUAGE sql STABLE AS $$SELECT current_setting('storage.operation',true)$$;
 CREATE FUNCTION storage.allow_any_operation(expected_operations text[]) RETURNS boolean LANGUAGE sql STABLE AS $$SELECT storage.operation()=ANY(expected_operations)$$;
 CREATE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$SELECT string_to_array(name,'/')$$;
 CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,raw_user_meta_data jsonb DEFAULT '{}');
 CREATE TABLE public.profiles(id uuid PRIMARY KEY REFERENCES auth.users(id),full_name text,email text,avatar_url text,role text,student_name text,is_suspended boolean DEFAULT false,warning_count integer DEFAULT 0);
 CREATE TABLE public.tutors(id uuid PRIMARY KEY,bio text,subjects text[],hourly_rate numeric,is_verified boolean,slug text);
 CREATE TABLE public.feature_flags(key text PRIMARY KEY,enabled boolean);
 CREATE TABLE public.bookings(id int PRIMARY KEY,status text);
 CREATE TABLE public.announcements(id int PRIMARY KEY,target_role text,is_active boolean);
 CREATE TABLE public.internal_team_members(user_id uuid,status text);
 CREATE TABLE storage.objects(id int PRIMARY KEY,bucket_id text,name text,owner_id text,owner uuid);
 CREATE FUNCTION public.course_pilot_admin() RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path=public,pg_temp AS $$SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role='admin' AND NOT coalesce(is_suspended,false))$$;
 CREATE FUNCTION public.is_admin_profile() RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$SELECT EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND role='admin')$$;
 CREATE FUNCTION public.is_active_internal_member(target_user_id uuid) RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$SELECT EXISTS(SELECT 1 FROM internal_team_members WHERE user_id=target_user_id AND status='active')$$;
 CREATE FUNCTION public.protect_profile_role() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$BEGIN RETURN NEW;END$$;
 CREATE FUNCTION public.recalculate_tutor_rating(uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$BEGIN RETURN;END$$;
 GRANT EXECUTE ON FUNCTION public.recalculate_tutor_rating(uuid) TO service_role;
 `);
 const names=[...migration.matchAll(/ALTER FUNCTION public\.(\w+)\(/g)].map(x=>x[1]);
 for(const name of names){
  const source=baseline?.functions.find(f=>f.name===name)?.definition;
  if(source) await db.exec(source);
  else if(name==='sciencedojo_slugify')await db.exec(`CREATE FUNCTION public.sciencedojo_slugify(input_text text) RETURNS text LANGUAGE sql AS $$SELECT lower(input_text)$$`);
  else await db.exec(`CREATE FUNCTION public.${name}() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RETURN NEW;END$$`);
 }
 if(baseline)for(const name of ['protect_profile_role','is_admin_profile','is_active_internal_member','course_pilot_admin','recalculate_tutor_rating','community_lock_moderation_fields','community_refresh_reply_count','update_tutor_rating']){
  const f=baseline.functions.find(f=>f.name===name);if(f)await db.exec(f.definition);
 }
 await db.exec(`CREATE TRIGGER profiles_protect_role BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION protect_profile_role();
 CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
 ALTER TABLE profiles ENABLE ROW LEVEL SECURITY; ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
 ALTER TABLE bookings ENABLE ROW LEVEL SECURITY; ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
 ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
 GRANT USAGE ON SCHEMA public,auth,storage TO anon,authenticated,service_role;
 GRANT ALL ON public.profiles,public.feature_flags,public.bookings,public.announcements,storage.objects TO anon,authenticated,service_role;`);
 const affected=['Admin Global Update','Admin Profile Access','Users limited view','Authenticated users can view basic profiles','Admins can insert feature flags','Admins can update feature flags','Admins can delete feature flags','Users can insert own profile','Admins can manage safety metrics','Academy media is publicly readable','Avatar View Policy','Class files are publicly readable','Enable upload access for authenticated users 1oj01fe_1'];
 const policy=(table,name,cmd,expression)=>`CREATE POLICY "${name}" ON ${table} FOR ${cmd} ${cmd==='INSERT'?'WITH CHECK':'USING'} (${expression});`;
 if(baseline){
  for(const p of baseline.policies.filter(p=>affected.includes(p.policyname))){
   await db.exec(`CREATE POLICY "${p.policyname}" ON ${p.schemaname}."${p.tablename}" AS ${p.permissive} FOR ${p.cmd} TO ${p.roles.join(',')} ${p.qual?`USING (${p.qual})`:''} ${p.with_check?`WITH CHECK (${p.with_check})`:''}`);
  }
 }else{
  const meta="auth.jwt()->'user_metadata'->>'role'='admin'";
  await db.exec(policy('bookings',affected[0],'UPDATE',meta)+policy('profiles',affected[1],'ALL',meta)
   +policy('announcements',affected[2],'SELECT',"is_active AND (target_role='all' OR target_role=auth.jwt()->'user_metadata'->>'role')")
   +policy('profiles',affected[3],'SELECT',"id=auth.uid() OR "+meta)
   +policy('feature_flags',affected[4],'INSERT',meta)+policy('feature_flags',affected[5],'UPDATE',meta)+policy('feature_flags',affected[6],'DELETE',meta)
   +policy('profiles',affected[7],'INSERT','id=auth.uid()')+policy('profiles',affected[8],'UPDATE','is_admin_profile()')
   +policy('storage.objects',affected[9],'SELECT',"bucket_id='academy-media'")+policy('storage.objects',affected[10],'SELECT',"bucket_id='avatars'")
   +policy('storage.objects',affected[11],'SELECT',"bucket_id='class-files'")+policy('storage.objects',affected[12],'SELECT',"bucket_id='avatars' AND (storage.foldername(name))[1]='private'"));
 }
 await db.exec(`CREATE POLICY "Fixture self update" ON profiles FOR UPDATE TO authenticated USING(id=auth.uid()) WITH CHECK(id=auth.uid());
 CREATE POLICY "Fixture flags read" ON feature_flags FOR SELECT USING(true);
 CREATE POLICY "Fixture bookings read" ON bookings FOR SELECT TO authenticated USING(true);`);
 await db.exec(migration);
 await db.exec(`INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES
 ('${uid(1)}','student@invalid.test','{"role":"student"}'),('${uid(2)}','admin@invalid.test','{}'),('${uid(3)}','suspended@invalid.test','{}'),('${uid(4)}','unprovisioned@invalid.test','{}');
 INSERT INTO profiles(id,role,is_suspended) VALUES('${uid(2)}','admin',false),('${uid(3)}','admin',true);
 INSERT INTO feature_flags VALUES('test',false); INSERT INTO bookings VALUES(1,'pending');
 INSERT INTO announcements VALUES(1,'all',true),(2,'student',true),(3,'admin',true),(4,'student',false);
 INSERT INTO storage.objects VALUES(1,'avatars','private/a.png','${uid(1)}','${uid(1)}'),(2,'avatars','private/b.png','${uid(2)}','${uid(2)}'),(3,'academy-media','course.png',null,null),(4,'class-files','class/file.pdf',null,null);`);
 const as=async(n,fn,{role='authenticated',metadata='admin',operation='object.list'}={})=>{
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false),set_config('storage.operation',$3,false)",[n?uid(n):'',JSON.stringify({sub:n?uid(n):undefined,role,user_metadata:{role:metadata}}),operation]);
  await db.exec(`SET ROLE ${role}`);try{return await fn();}finally{await db.exec('RESET ROLE');}
 };
 return {db,as};
}

test('metadata cannot grant admin; real active admin retains policies and suspension remains effective',async()=>{
 const {db,as}=await securityFixture();try{
  await as(1,async()=>{
   assert.equal((await db.query("UPDATE bookings SET status='forged' WHERE id=1 RETURNING id")).rows.length,0);
   await assert.rejects(db.exec("INSERT INTO feature_flags VALUES('forged',true)"));
   assert.equal((await db.query("UPDATE feature_flags SET enabled=true WHERE key='test' RETURNING key")).rows.length,0);
   assert.equal((await db.query("DELETE FROM feature_flags WHERE key='test' RETURNING key")).rows.length,0);
   assert.deepEqual((await db.query('SELECT id FROM announcements ORDER BY id')).rows.map(x=>x.id),[1,2]);
   await assert.rejects(db.query('UPDATE profiles SET role=$1 WHERE id=$2',['admin',uid(1)]),/privileged/);
   await assert.rejects(db.query('UPDATE profiles SET is_suspended=true WHERE id=$1',[uid(1)]),/safety/);
   await assert.rejects(db.query('UPDATE profiles SET warning_count=0+1 WHERE id=$1',[uid(1)]),/safety/);
   await db.query('UPDATE profiles SET full_name=$1 WHERE id=$2',['Edited name',uid(1)]);
  });
  await as(4,async()=>{
   await assert.rejects(db.query('INSERT INTO profiles(id,role) VALUES($1,$2)',[uid(4),'admin']));
   await assert.rejects(db.query('INSERT INTO profiles(id,role) VALUES($1,$2)',[uid(4),'internal']));
   await db.query('INSERT INTO profiles(id,role) VALUES($1,$2)',[uid(4),'student']);
  });
  await as(3,async()=>{
   assert.equal((await db.query("UPDATE bookings SET status='forged' WHERE id=1 RETURNING id")).rows.length,0);
   await assert.rejects(db.query('UPDATE profiles SET is_suspended=false WHERE id=$1',[uid(3)]),/safety/);
  });
  await as(2,async()=>{
   await db.exec("INSERT INTO feature_flags VALUES('admin-created',true)");
   assert.equal((await db.query("UPDATE bookings SET status='accepted' WHERE id=1 RETURNING id")).rows.length,1);
   await db.query('UPDATE profiles SET warning_count=1 WHERE id=$1',[uid(1)]);
   assert.equal((await db.query("DELETE FROM feature_flags WHERE key='admin-created' RETURNING key")).rows.length,1);
  },{metadata:'student'});
  assert.equal((await db.query("SELECT count(*)::int AS n FROM pg_policies WHERE coalesce(qual,'')||coalesce(with_check,'') LIKE '%user_metadata%'")).rows[0].n,0);
 }finally{await db.close();}
});

test('signup allows public roles and defers OAuth, but never provisions admin/internal metadata',async()=>{
 const {db}=await securityFixture();try{
  for(const [i,role] of ['user','parent','student','tutor','admin','internal',null].entries()){
   const id=uid(10+i);await db.query('INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES($1,$2,$3)',[id,'signup@invalid.test',JSON.stringify(role?{role}:{})]);
   assert.equal((await db.query('SELECT role FROM profiles WHERE id=$1',[id])).rows.length,i<4?1:0);
   if(role==='tutor')assert.equal((await db.query('SELECT id FROM tutors WHERE id=$1',[id])).rows.length,1);
  }
 }finally{await db.close();}
});

test('storage prevents anonymous enumeration and peer listing while retaining download/owner/admin access',async()=>{
 const {db,as}=await securityFixture();try{
  assert.equal((await as(null,()=>db.query('SELECT id FROM storage.objects'),{role:'anon'})).rows.length,0);
  assert.deepEqual((await as(1,()=>db.query('SELECT id FROM storage.objects ORDER BY id'))).rows.map(r=>r.id),[1]);
  assert.equal((await as(2,()=>db.query('SELECT id FROM storage.objects'))).rows.length,4);
  assert.equal((await as(null,()=>db.query('SELECT id FROM storage.objects'),{role:'anon',operation:'object.get_authenticated'})).rows.length,4);
  assert.equal((await as(null,()=>db.query('SELECT id FROM storage.objects'),{role:'anon',operation:''})).rows.length,0);
 }finally{await db.close();}
});

test('all legacy search paths are pinned, triggers still fire, RPC-only grants stay restricted and migration can reapply safely',async()=>{
 const {db}=await securityFixture();try{
  const funcs=(await db.query("SELECT p.oid::regprocedure::text AS signature,proconfig FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prorettype='trigger'::regtype")).rows;
  for(const f of funcs){
   assert.ok(f.proconfig?.some(c=>c.startsWith('search_path=')),f.signature);
   for(const role of ['anon','authenticated'])assert.equal((await db.query('SELECT has_function_privilege($1,$2,\'EXECUTE\') AS allowed',[role,f.signature])).rows[0].allowed,false);
  }
  assert.equal((await db.query("SELECT has_function_privilege('service_role','recalculate_tutor_rating(uuid)','EXECUTE') AS allowed")).rows[0].allowed,true);
  assert.equal((await db.query("SELECT has_function_privilege('authenticated','course_pilot_admin()','EXECUTE') AS allowed")).rows[0].allowed,true);
  await db.exec(migration);
 }finally{await db.close();}
});

test('private course helpers and staff project actions retain authenticated calls without anonymous RPC access',async()=>{
 const {fixture,course}=await import('./helpers/course-pilot-fixture.mjs');
 const {db,join,as}=await fixture();
 try{
  await db.exec(`CREATE ROLE service_role; CREATE FUNCTION update_assigned_internal_project(uuid,text,text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$BEGIN RAISE EXCEPTION 'Access denied';END$$;
   GRANT EXECUTE ON FUNCTION update_assigned_internal_project(uuid,text,text),course_pilot_parent_visible(uuid),course_pilot_valid_lesson(uuid,text) TO anon,authenticated,service_role;`);
  const sql=await readFile(new URL('../sql/079_security_rpc_anonymous.sql',import.meta.url),'utf8');
  await db.exec(sql);
  for(const signature of ['update_assigned_internal_project(uuid,text,text)','course_pilot_parent_visible(uuid)','course_pilot_valid_lesson(uuid,text)']){
   for(const role of ['authenticated','service_role'])assert.equal((await db.query("SELECT has_function_privilege($1,$2,'EXECUTE') AS ok",[role,signature])).rows[0].ok,true);
   assert.equal((await db.query("SELECT has_function_privilege('anon',$1,'EXECUTE') AS ok",[signature])).rows[0].ok,false);
  }
  await db.exec('SET ROLE anon');
  await assert.rejects(db.query('SELECT course_pilot_parent_visible($1)',[uid(1)]),/permission denied/);
  await db.exec('RESET ROLE; SET ROLE authenticated');
  assert.equal((await db.query('SELECT course_pilot_parent_visible($1) AS visible',[uid(1)])).rows[0].visible,false);
  await db.exec('RESET ROLE');
  await join(1);
  await as(1,async()=>{
   await db.query('SELECT course_pilot_post($1,$2,$3,$4)',[course,'Retained learner discussion','one',null]);
   assert.equal((await db.query('SELECT body FROM course_pilot_posts WHERE course_id=$1',[course])).rows[0].body,'Retained learner discussion');
  });
  await db.exec(sql);
 }finally{await db.close();}
});
