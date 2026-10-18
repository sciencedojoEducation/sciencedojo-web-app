import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SCHOOL_PLACES,SCHOOL_WALLS,STUDY_SEATS,schoolWalkable,schoolRoute,walkSchool} from '../lib/campus/school-layout.ts';
import {runtimeFixture} from './helpers/campus-runtime-fixture.mjs';

test('every school destination and study station is reachable through doorways without crossing walls',()=>{
 assert.equal(SCHOOL_PLACES.length,15);assert.equal(STUDY_SEATS.length,10);
 for(const destination of [...SCHOOL_PLACES.map(p=>({x:p.x,z:p.z+2})),...STUDY_SEATS]){
  let position={x:-1,z:4};const route=schoolRoute(position,destination);assert(route.length,`No route to ${JSON.stringify(destination)}`);
  for(const waypoint of route){
   let steps=0;
   while(Math.hypot(waypoint.x-position.x,waypoint.z-position.z)>.04){
    const dx=waypoint.x-position.x,dz=waypoint.z-position.z,divisor=Math.max(1,Math.hypot(dx,dz));
    position=walkSchool(position,dx/divisor,dz/divisor,.05);
    assert(schoolWalkable(position.x,position.z));assert(++steps<1000,'Route stuck at wall');
   }
  }
  assert(Math.hypot(position.x-destination.x,position.z-destination.z)<.8);
 }
});

test('SQL and room authority agree on school walls, doors, bounds and expanded study seats',async()=>{
 const f=await runtimeFixture(1);
 try{
  const samples=[{x:0,z:8.5,dx:0,dz:1},{x:9.2,z:0,dx:1,dz:1},{x:63.9,z:40,dx:1,dz:1},...SCHOOL_WALLS.map(w=>({x:w.minX-.6,z:(w.minZ+w.maxZ)/2,dx:1,dz:0}))];
  for(const s of samples){const js=walkSchool(s,s.dx,s.dz,.35);const sql=(await f.db.query('SELECT * FROM campus_school_walk($1,$2,$3,$4,$5)',[s.x,s.z,s.dx,s.dz,.35])).rows[0];assert(Math.abs(js.x-sql.x)<1e-8&&Math.abs(js.z-sql.z)<1e-8);}
  const a=await f.connect(1);
  for(const seat of STUDY_SEATS){
   await f.db.query('UPDATE campus_presence SET x=$1,z=$2,input_x=0,input_z=0,rate_count=0',[seat.x,seat.z]);
   const seated=(await f.runtime(a.connection,'step',[{type:'sit',data:seat.id}])).snapshot.players[0];
   assert.equal(seated.x,seat.x);assert.equal(seated.z,seat.z);assert.equal(seated.seat,seat.id);
   await f.runtime(a.connection,'step',[{type:'action',data:'stand'}]);
  }
  await assert.rejects(f.as(1,()=>f.db.query('SELECT * FROM campus_school_walk(0,0,1,0,.1)')),/permission denied/);
 }finally{await f.db.close();}
});
