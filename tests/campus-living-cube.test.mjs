import {test} from 'node:test';
import assert from 'node:assert/strict';
import {boxes} from '../lib/campus/school-geometry.ts';
import {CampusWorld} from '../lib/campus/world.ts';
import {isInput,isSnapshot} from '../lib/campus/protocol.ts';
import {SCHOOL_SOLIDS,SCHOOL_PLACES,STUDY_SEATS,SCHOOL_CONNECTORS,walkSchool,schoolWalkable} from '../lib/campus/school-layout.ts';
import {availableJourneys} from '../lib/campus/locomotion.ts';
import {onCourt} from '../lib/campus/basketball.ts';
import {createPresentation,receivePresentation,advancePresentation} from '../lib/campus/presentation.ts';
import {runtimeFixture} from './helpers/campus-runtime-fixture.mjs';
const who=n=>({id:`40000000-0000-0000-0000-${String(n).padStart(12,'0')}`,pseudonym:`Quiet Maple aaaa0${n}`,colour:0,blocked:[]});
const command=(data)=>({type:'environment',data});

test('bounded running, crouching, prone and jump intent reject position, speed and malformed claims',()=>{
 for(const bad of [{run:10},{jump:'yes'},{stance:'fly'},{floor:2},{elevation:50},{speed:99},{travel:'lift'}])assert.equal(isInput({x:0,z:0,seq:1,...bad}),false);
 for(const [stance,run,speed] of [['stand',false,3],['stand',true,5.5],['crouch',true,1.45],['prone',true,.8]]){
  const w=new CampusWorld();w.join(who(1));const p=w.players.get(who(1).id),x=p.x;
  assert(w.input(p.id,{x:1,z:0,seq:1,stance,run},1000));w.step(.1,1100);assert(Math.abs(p.x-x-speed*.1)<1e-8);
  w.step(.1,1500);assert(Math.abs(p.x-x-speed*.1)<1e-8,'stale sprint stops');
 }
 const w=new CampusWorld();w.join(who(1));const p=w.players.get(who(1).id);
 w.input(p.id,{x:0,z:0,seq:1,jump:true},1000);w.step(.1,1425);assert(Math.abs(p.elevation-1.2)<1e-8);
 w.input(p.id,{x:0,z:0,seq:2,jump:true},1450);w.step(.1,1900);assert.equal(p.elevation,0,'held jump does not retrigger');
 assert.equal(w.sit(p.id,'seminar-1'),false,'cannot sit across floors');
});

test('every visible furniture footprint is solid and jump/run cannot tunnel; upper atrium edges are bounded',()=>{
 for(const s of SCHOOL_SOLIDS){assert.equal(schoolWalkable((s.minX+s.maxX)/2,(s.minZ+s.maxZ)/2,s.floor??0),false);}
 for(const floor of [1,2]){assert.equal(schoolWalkable(0,13,floor),false);assert.equal(schoolWalkable(-17,39,floor),true);}
 for(const stance of ['stand','crouch','prone']){let p={x:-4.5,z:-1.6};for(let i=0;i<30;i++)p=walkSchool(p,0,-1,.35,stance,true);assert(p.z>-2.3,'desk chair remains solid');}
 assert.equal(schoolWalkable(0,0,3),false);
 const w=new CampusWorld();w.join(who(1));const p=w.players.get(who(1).id);Object.assign(p,{x:-4.5,z:-1.7});
 assert(schoolWalkable(p.x,p.z,0));assert.equal(schoolWalkable(p.x,p.z,0,.9),false);
 w.input(p.id,{x:0,z:0,seq:1,stance:'prone'},1000);assert.equal(p.stance,'stand','Cannot extend a prone body into the desk');
});

test('room glass is shared visual state, scoped to current room and resets when the campus empties',()=>{
 const w=new CampusWorld();w.join(who(1));w.join(who(2));const id=who(1).id;
 assert.equal(w.environment(id,{action:'glass',room:'physics'},1000),false);
 assert(w.environment(id,{action:'glass',room:'library'},1100));assert.deepEqual(w.snapshot(who(2).id).frosted,['library']);
 assert(w.environment(id,{action:'glass',room:'library'},1200));assert.deepEqual(w.snapshot(id).frosted,[]);
 w.environment(id,{action:'glass',room:'library'},1300);w.remove(id);w.remove(who(2).id);w.join(who(1));assert.deepEqual(w.snapshot(id).frosted,[]);
 for(const room of SCHOOL_PLACES.filter(r=>!r.outdoor)){Object.assign(w.players.get(id),{x:room.x,z:room.z+2,floor:room.floor??0});assert(w.environment(id,{action:'glass',room:room.id},2000+(SCHOOL_PLACES.indexOf(room)*1000)));}
});

test('lift, escalator and slide are server-owned smooth journeys; input and cross-floor basketball are denied',()=>{
 for(const via of SCHOOL_CONNECTORS){
  const w=new CampusWorld();w.join(who(1));const p=w.players.get(who(1).id),from=via.id==='slide'?2:0,to=via.id==='slide'?0:1;
  Object.assign(p,{x:via.x,z:via.z,floor:from,elevation:from*12});
  assert(availableJourneys(p).some(j=>j.connector.id===via.id&&j.to===to));
  assert(w.environment(p.id,{action:'travel',via:via.id,to},1000));assert.equal(w.input(p.id,{x:1,z:1,seq:1},1100),false);
  w.step(.1,1000+via.duration/2);assert(p.elevation>0&&p.elevation<24);assert.equal(p.travel,via.id);
  w.step(.1,1000+via.duration);assert.equal(p.floor,to);assert.equal(p.elevation,to*12);assert.equal(p.travel,null);assert.equal(p.x,via.exitX);assert.equal(p.z,via.exitZ);
  assert(schoolWalkable(p.x,p.z,p.floor));assert(isSnapshot(w.snapshot(p.id)));
 }
 assert.equal(onCourt({x:52,z:0,floor:1}),false);assert.equal(onCourt({x:52,z:0,floor:0,travel:'lift'}),false);
});

test('confirmed elevation interpolates without changing authoritative poses',()=>{
 const a={x:0,z:0,rotation:0,seat:null,floor:0,elevation:0},b={...a,elevation:1.2};const v=createPresentation(a,0);receivePresentation(v,b,200);advancePresentation(v,400);assert(Math.abs(v.elevation-.6)<1e-8);assert.equal(b.elevation,1.2);
});

test('SQL and Colyseus agree on solid furniture and all posture speeds on every floor',async()=>{
 const f=await runtimeFixture(1);
 try{
  const stored=(await f.db.query('SELECT floor,min_x AS "minX",max_x AS "maxX",min_z AS "minZ",max_z AS "maxZ" FROM campus_school_solids')).rows;
  const compact=SCHOOL_SOLIDS.filter((w,i,a)=>!a.some((b,j)=>j!==i&&(b.floor??0)===(w.floor??0)&&b.minX<=w.minX&&b.maxX>=w.maxX&&b.minZ<=w.minZ&&b.maxZ>=w.maxZ&&(b.minX<w.minX||b.maxX>w.maxX||b.minZ<w.minZ||b.maxZ>w.maxZ||j<i)));
  assert.deepEqual(stored,compact.map(w=>({floor:w.floor??0,minX:w.minX,maxX:w.maxX,minZ:w.minZ,maxZ:w.maxZ})),"SQL solids must exactly match the rendered collision footprints");
  for(const solid of SCHOOL_SOLIDS){const x=(solid.minX+solid.maxX)/2,z=(solid.minZ+solid.maxZ)/2;const sql=(await f.db.query('SELECT campus_school_walkable($1,$2,$3) ok',[x,z,solid.floor??0])).rows[0].ok;assert.equal(sql,false);}
  for(const floor of [0,1,2])for(const stance of ['stand','crouch','prone'])for(const run of [true,false]){
   const p={x:-39,z:39,floor};const js=walkSchool(p,1,-1,.35,stance,run),sql=(await f.db.query('SELECT * FROM campus_school_walk($1,$2,1,-1,.35,$3,$4,$5)',[p.x,p.z,floor,stance,run])).rows[0];assert(Math.abs(js.x-sql.x)<1e-8&&Math.abs(js.z-sql.z)<1e-8);
  }
 }finally{await f.db.close();}
});

test('shared SQL owns room switching, floor journeys, jump clock, seat isolation and cleanup without wire internals',async()=>{
 const f=await runtimeFixture(2);
 try{
  const a=await f.connect(1),b=await f.connect(2),id=f.members[0].id;
  let r=await f.runtime(a.connection,'step',[command({action:'glass',room:'library'})]);assert.deepEqual(r.snapshot.frosted,['library']);assert.deepEqual((await f.runtime(b.connection,'step')).snapshot.frosted,['library']);
  r=await f.runtime(a.connection,'step',[command({action:'glass',room:'physics'})]);assert.deepEqual(r.snapshot.frosted,['library']);
  r=await f.runtime(a.connection,'step',[{type:'input',data:{x:0,z:0,seq:1,jump:true}}]);
  await f.db.query("UPDATE campus_presence SET jump_at=clock_timestamp()-interval '425 milliseconds' WHERE campus_id=$1",[id]);r=await f.runtime(a.connection,'step');assert(r.snapshot.players.find(p=>p.id===id).elevation>1.18);
  await f.db.query("UPDATE campus_presence SET x=-17,z=39,jump_at=NULL,elevation=0,input_x=0,input_z=0,rate_count=0 WHERE campus_id=$1",[id]);
  r=await f.runtime(a.connection,'step',[command({action:'travel',via:'lift',to:2})]);assert.equal(r.snapshot.players.find(p=>p.id===id).travel,'lift');
  r=await f.runtime(a.connection,'step',[{type:'input',data:{x:1,z:0,seq:2,run:true}}]);assert(r.snapshot.players.find(p=>p.id===id).x>=-17&&r.snapshot.players.find(p=>p.id===id).x<=-13);
  await f.db.query("UPDATE campus_presence SET travel=jsonb_set(travel,'{at}',to_jsonb(extract(epoch FROM clock_timestamp())*1000-3600)) WHERE campus_id=$1",[id]);
  r=await f.runtime(a.connection,'step');let p=r.snapshot.players.find(p=>p.id===id);assert.equal(p.floor,2);assert.equal(p.elevation,24);assert.equal(p.travel,null);
  const seat=STUDY_SEATS.find(s=>s.floor===2);await f.db.query('UPDATE campus_presence SET x=$2,z=$3,rate_count=0 WHERE campus_id=$1',[id,seat.x,seat.z]);
  r=await f.runtime(a.connection,'step',[{type:'sit',data:'seminar-1'}]);assert.equal(r.snapshot.players.find(p=>p.id===id).seat,null);
  r=await f.runtime(a.connection,'step',[{type:'sit',data:seat.id}]);assert.equal(r.snapshot.players.find(p=>p.id===id).seat,seat.id);assert(isSnapshot(r.snapshot));
  assert.doesNotMatch(JSON.stringify(r.snapshot),/jump_at|input_run|connection_id|duration|endX|sequence|lease_until|course|grade/);
  for(const table of ['campus_focus_glass','campus_school_solids'])await assert.rejects(f.as(1,()=>f.db.query(`SELECT * FROM ${table}`)),/permission denied/);
  await f.runtime(a.connection,'leave');await f.runtime(b.connection,'leave');const c=await f.connect(1);assert.deepEqual(c.result.snapshot.frosted,[]);assert.equal(c.result.snapshot.players[0].floor,0);
 }finally{await f.db.close();}
});

test('downward escalators, seated glass and interrupted journeys retain floor authority and reset safely',async()=>{
 const w=new CampusWorld();w.join(who(1));const p=w.players.get(who(1).id),c=SCHOOL_CONNECTORS.find(c=>c.id==='escalator');
 Object.assign(p,{x:c.exitX,z:c.exitZ,floor:2,elevation:24});assert(w.environment(p.id,{action:'travel',via:'escalator',to:1},1000));w.step(.1,8000);assert.equal(p.floor,1);assert.equal(p.z,c.z);
 w.remove(p.id);w.join(who(1));assert.equal(w.players.get(p.id).floor,0);
 const f=await runtimeFixture(1);
 try{
  const a=await f.connect(1),id=f.members[0].id;
  await f.db.query("UPDATE campus_presence SET x=-4.5,z=-3,rate_count=0 WHERE campus_id=$1",[id]);
  await f.runtime(a.connection,'step',[{type:'sit',data:'desk-1'}]);let r=await f.runtime(a.connection,'step',[command({action:'glass',room:'library'})]);assert.deepEqual(r.snapshot.frosted,['library'],'seated learner can screen their room');
  await f.runtime(a.connection,'step',[{type:'action',data:'stand'}]);await f.db.query('UPDATE campus_presence SET x=$2,z=$3,floor=2,elevation=24,input_x=0,input_z=0,rate_count=0 WHERE campus_id=$1',[id,c.exitX,c.exitZ]);
  r=await f.runtime(a.connection,'step',[command({action:'travel',via:'escalator',to:1})]);assert.equal(r.snapshot.players[0].travel,'escalator');
  await f.db.query("UPDATE campus_presence SET travel=jsonb_set(travel,'{at}',to_jsonb(extract(epoch FROM clock_timestamp())*1000-6600)) WHERE campus_id=$1",[id]);r=await f.runtime(a.connection,'step');assert.equal(r.snapshot.players[0].floor,1);assert.equal(r.snapshot.players[0].elevation,12);assert.equal(r.snapshot.players[0].z,c.z);
  await f.db.query("UPDATE campus_presence SET lease_until=clock_timestamp()-interval '1 second' WHERE campus_id=$1",[id]);
  const fresh=await f.connect(1);assert.deepEqual(fresh.result.snapshot.frosted,[]);assert.equal(fresh.result.snapshot.players[0].floor,0);assert.equal(fresh.result.snapshot.players[0].travel,null);
 }finally{await f.db.close();}
});


test('upper slabs contain real lift/escalator openings and solid landings, with no walking into shafts',()=>{
 const lift=SCHOOL_CONNECTORS.find(c=>c.id==='lift');
 for(const floor of [1,2]){
  const slabs=boxes.filter(b=>b.floor===floor&&b.size[1]===.5&&Math.abs(b.position[1]-(floor*12-.27))<1e-8);
  const covered=(x,z)=>slabs.some(b=>Math.abs(b.position[0]-x)<b.size[0]/2&&Math.abs(b.position[2]-z)<b.size[2]/2);
  assert.equal(covered(lift.shaftX,39),false);assert.equal(covered(39,0),false);assert.equal(covered(-39,26),false,"Upper slide must pass through a real opening at the middle level");
  assert.equal(covered(lift.x,39),true);assert.equal(schoolWalkable(lift.shaftX,39,floor),false);assert(schoolWalkable(lift.x,39,floor));
 }
});

test('focus-glass forward repair bounds singleton updates and preserves runtime grants',async()=>{
 const f=await runtimeFixture(1);
 try{
  for(const name of ['campus_runtime_school','campus_runtime']){
   const {definition,anon,authenticated,service}= (await f.db.query(`SELECT pg_get_functiondef(p.oid) AS definition,
    has_function_privilege('anon',p.oid,'execute') AS anon,
    has_function_privilege('authenticated',p.oid,'execute') AS authenticated,
    has_function_privilege('service_role',p.oid,'execute') AS service
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname=$1`,[name])).rows[0];
   const updates=definition.match(/UPDATE campus_focus_glass[^;]+;/g);
   assert(updates.length>0);
   for(const update of updates)assert.match(update,/\bWHERE\b/);
   assert.equal(anon,false);assert.equal(authenticated,false);assert.equal(service,name==='campus_runtime');
   assert.match(definition,/SECURITY DEFINER/);
   assert.match(definition,/search_path/);
  }
  assert.deepEqual(await f.rawRuntime('99999999-9999-4999-8999-999999999999','step'),{ended:true});
 }finally{await f.db.close();}
});
