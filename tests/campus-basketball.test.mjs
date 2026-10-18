import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {COURT,HOOPS,createBasketball,advanceBasketball,basketballAction,basketballSnapshot,isBasketballSnapshot,isBasketballCommand,aimDirection,shotGuide,isBasketballState} from '../lib/campus/basketball.ts';
import {CampusWorld} from '../lib/campus/world.ts';
import {isSnapshot} from '../lib/campus/protocol.ts';
import {runtimeFixture} from './helpers/campus-runtime-fixture.mjs';
import {id} from './helpers/course-pilot-fixture.mjs';
const player=(n=1,x=52,z=0)=>({id:`40000000-0000-0000-0000-${String(n).padStart(12,'0')}`,pseudonym:`Quiet Maple aaaa0${n}`,colour:0,blocked:[],x,z,rotation:0,status:'walking'});
function shotAt(p,hoop=HOOPS[0],angle=.85){
 const distance=Math.hypot(hoop.x-p.x,hoop.z-p.z),yaw=Math.atan2(hoop.x-p.x,p.z-hoop.z),direction=aimDirection(yaw,angle);
 // The release starts .45 units down the aim ray, matching actual authority.
 const d=distance-Math.cos(angle)*.45,dy=COURT.rimY-(1.55+Math.sin(angle)*.45);
 const speed=Math.sqrt(COURT.gravity*d*d/(2*Math.cos(angle)**2*(d*Math.tan(angle)-dy)));
 return {action:'shoot',...direction,power:(speed-4)/9};
}
function simulate(p,command,duration=4){
 let state=basketballAction(createBasketball(),p,{action:'take'},1000);
 state=basketballAction(state,p,command,1500);
 assert(state);
 const samples=[];
 for(let t=1510;t<=1500+duration*1000;t+=10){state=advanceBasketball(state,[p],t);samples.push({...state});}
 return {state,samples};
}
test('basketball accepts bounded intent only, never caller positions, scores, owner or camera metadata',()=>{
 const shot=shotAt(player());assert(isBasketballCommand(shot));
 for(const c of [{action:'take',owner:player().id},{...shot,power:2},{...shot,dx:NaN},{...shot,dy:0,dz:0,dx:0},{...shot,score:3},{...shot,cameraYaw:0},{action:'reset'}])assert.equal(isBasketballCommand(c),false);
 assert(isBasketballState(createBasketball()));
 const publicBall=basketballSnapshot(createBasketball(),[]);assert(isBasketballSnapshot(publicBall));
 for(const b of [{...publicBall,email:'private'},{...publicBall,y:Infinity},{...publicBall,north:-1},{...publicBall,points:99},{...publicBall,holder:'account'}])assert.equal(isBasketballSnapshot(b),false);
});
test('one reachable ball can be held; theft, distant/seated/off-court and replayed rapid commands fail',()=>{
 const a=player(),b=player(2),initial=createBasketball();
 assert.equal(basketballAction(initial,player(3,0,0),{action:'take'},1000),null);
 assert.equal(basketballAction(initial,{...a,status:'seated'},{action:'take'},1000),null);
 const held=basketballAction(initial,a,{action:'take'},1000);assert.equal(held.holder,a.id);
 assert.equal(basketballAction(held,b,{action:'take'},1500),null);
 assert.equal(basketballAction(held,b,shotAt(b),1500),null);
 const thrown=basketballAction(held,a,shotAt(a),1100);assert(thrown,'confirmed owner can shoot immediately');
 assert.equal(basketballAction(thrown,a,{action:'take'},1150),null,'rapid recatch must not cancel a released shot');
 assert.equal(basketballAction(held,a,{action:'drop'},1100).holder,null,'confirmed owner can put down immediately');
 assert.equal(basketballAction(held,{...a,x:65},shotAt(a),1500),null);
 assert.equal(basketballAction(held,a,{action:'drop'},1500).mode,'loose');
});
test('real downward rim crossings score once at both hoops; 2/3 points depend on launch distance',()=>{
 for(const [z,hoop,points] of [[0,HOOPS[0],3],[-2,HOOPS[0],2],[0,HOOPS[1],3],[2,HOOPS[1],2]]){
  const p=player(1,52,z);
  let initial=createBasketball();initial.z=z;
  let state=basketballAction(initial,p,{action:'take'},1000);state=basketballAction(state,p,shotAt(p,hoop,1.05),1500);
  const events=[];
  for(let t=1510;t<6000;t+=10){state=advanceBasketball(state,[p],t);if(state.kind==='basket')events.push(state.event);}
  assert.equal(state[hoop.id],points,JSON.stringify({z,hoop:hoop.id,state}));assert.equal(new Set(events).size,1);
  assert.equal(state[hoop.id==='north'?'south':'north'],0);
 }
});
test('misses do not award points; rim, backboard and floor produce retrievable rebounds',()=>{
 const p=player(),bad={...shotAt(p),dx:.45};const length=Math.hypot(bad.dx,bad.dy,bad.dz);bad.dx/=length;bad.dy/=length;bad.dz/=length;
 const miss=simulate(p,bad);assert.equal(miss.state.north+miss.state.south,0);
 assert(miss.samples.every(s=>isBasketballState(s)));
 let board={...createBasketball(1000),x:52,y:3.4,z:-6.65,vz:-5,shot:true};
 board=advanceBasketball(board,[p],1100);assert(board.vz>0,'backboard must rebound toward the court');
 let rim={...createBasketball(1000),x:52+COURT.rimRadius,y:3.4,z:-6.6,vy:-4,shot:true};
 rim=advanceBasketball(rim,[p],1100);assert(rim.vy>0,'rim must rebound upwards');assert.equal(rim.north,0);
 let floor={...createBasketball(1000),y:.6,vy:-3,vx:1};floor=advanceBasketball(floor,[p],1100);assert(floor.vy>0);assert(floor.y>=COURT.floor+COURT.radius);
 const catcher={...p,x:floor.x,z:floor.z};assert.equal(basketballAction(floor,catcher,{action:'take'},1500).holder,p.id);
});
test('abandoned/studying/out-of-court possession releases; out-of-bounds returns the ball; hidden owners stay hidden',()=>{
 const p=player();const held=basketballAction(createBasketball(),p,{action:'take'},1000);
 for(const players of [[],[{...p,status:'studying'}],[{...p,x:0}]])assert.equal(advanceBasketball(held,players,1500).holder,null);
 assert.equal(basketballSnapshot(held,[]).holder,null);
 const out=advanceBasketball({...createBasketball(1000),x:61.9,y:2,vx:10},[p],1100);
 assert.equal(out.kind,'out');assert.equal(out.x,52);assert.equal(out.z,0);
 const world=new CampusWorld();world.join(p);world.players.get(p.id).x=52;world.players.get(p.id).z=0;
 assert(world.playBasketball(p.id,{action:'take'},1000));world.remove(p.id);
 assert.deepEqual(world.basketball,createBasketball());
});
test('aim guide follows the same gravity/launch law without awarding or mutating shared score',()=>{
 const p=player(),command=shotAt(p),guide=shotGuide(p,command,.3),result=simulate(p,command,.3);
 assert(Math.abs(result.state.x-guide.x)<1e-8&&Math.abs(result.state.y-guide.y)<1e-8&&Math.abs(result.state.z-guide.z)<1e-8);
});
test('shared SQL court is service-only, CAS ordered, observer-consistent and block/revoke/lease safe',async()=>{
 const f=await runtimeFixture(2);
 try{
  const a=await f.connect(1),b=await f.connect(2);
  for(const role of ['anon','authenticated','service_role']){
   await f.db.exec(`SET ROLE ${role}`);await assert.rejects(f.db.query('SELECT * FROM campus_basketball'),/permission denied/);
   if(role!=='service_role')await assert.rejects(f.db.query('SELECT campus_basketball_commit($1,0,$2)',[a.connection,JSON.stringify(createBasketball())]),/permission denied/);
   await f.db.exec('RESET ROLE');
  }
  assert.equal((await f.db.query("SELECT relrowsecurity FROM pg_class WHERE relname='campus_basketball'")).rows[0].relrowsecurity,true);
  assert.deepEqual((await f.db.query('SELECT state FROM campus_basketball')).rows[0].state,createBasketball());
  await f.db.exec('UPDATE campus_presence SET x=52,z=0');
  const raced=await Promise.all([a,b].map(p=>f.runtime(p.connection,'step',[{type:'basketball',data:{action:'take'}}])));
  const state=(await f.db.query('SELECT state FROM campus_basketball')).rows[0].state;
  assert([f.members[0].id,f.members[1].id].includes(state.holder));
  const winner=state.holder===f.members[0].id?a:b,loser=winner===a?b:a;
  const snap=(await f.runtime(loser.connection,'step')).snapshot;
  assert.equal(snap.basketball.holder,state.holder);assert(isSnapshot(snap));
  assert.equal(raced.filter(r=>r.snapshot.basketball.holder!==null).length,2);
  const stale=(await f.rawRuntime(winner.connection,'step')).game;
  const first=await f.commitBasketball({game_connection:winner.connection,game_version:stale.version,game_state:{...stale.state,at:stale.now}});
  assert.equal(first.applied,true);
  assert.equal((await f.commitBasketball({game_connection:loser.connection,game_version:stale.version,game_state:stale.state})).applied,false);
  const loserIndex=loser===a?1:2;
  await f.as(loserIndex,()=>f.db.query('SELECT campus_block($1,true)',[state.holder]));
  assert.equal((await f.runtime(loser.connection,'step')).snapshot.basketball.holder,null);
  // A normal duration handover keeps campus identity/possession, while its
  // obsolete connection cannot update or remove the replacement's ball.
  const priorConnection=winner.connection,winnerIndex=winner===a?1:2,replacement=randomUUID();
  await f.db.query("UPDATE campus_presence SET opened_at=clock_timestamp()-interval '181 seconds' WHERE connection_id=$1",[priorConnection]);
  const renewed=await f.runtime(replacement,'connect',[],await f.issue(winnerIndex),state.holder,true);
  assert.equal(renewed.snapshot.basketball.holder,state.holder);
  assert.deepEqual(await f.commitBasketball({game_connection:priorConnection,game_version:first.game.version,game_state:first.game.state}),{ended:true});
  await f.runtime(priorConnection,'leave');winner.connection=replacement;
  assert.equal((await f.runtime(winner.connection,'step')).snapshot.basketball.holder,state.holder);
  await f.db.query("UPDATE campus_presence SET lease_until=clock_timestamp()-interval '1 second' WHERE connection_id=$1",[winner.connection]);
  const released=await f.runtime(loser.connection,'step');assert.equal(released.snapshot.basketball.holder,null);assert.equal(released.snapshot.basketball.mode,'loose');
  for(const forbidden of ['game_connection','version','shotX','actionAt','lease_until',id(1),id(2)])assert.equal(JSON.stringify(released).includes(forbidden),false,forbidden);
  assert.deepEqual(await f.commitBasketball({game_connection:randomUUID(),game_version:0,game_state:createBasketball()}),{ended:true});
  await f.runtime(loser.connection,'leave');assert.deepEqual((await f.db.query('SELECT state FROM campus_basketball')).rows[0].state,createBasketball());
 }finally{await f.db.close();}
});
test('shared service can catch a falling ball after advancing its prior database version',async()=>{
 const f=await runtimeFixture(1);
 try{
  const a=await f.connect(1);
  await f.db.exec('UPDATE campus_presence SET x=52,z=-2');
  const now=(await f.rawRuntime(a.connection,'step')).game.now;
  const falling={...createBasketball(now-150),x:52,y:2.8,z:-2,vy:-6,shot:true};
  await f.db.query('UPDATE campus_basketball SET state=$1::jsonb',[JSON.stringify(falling)]);
  const result=await f.runtime(a.connection,'step',[{type:'basketball',data:{action:'take'}}]);
  assert.equal(result.snapshot.basketball.holder,f.members[0].id);
 }finally{await f.db.close();}
});
