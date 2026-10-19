import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {roomGamesFixture} from './helpers/campus-room-games-fixture.mjs';
import {id} from './helpers/course-pilot-fixture.mjs';
import {hashTicket} from '../lib/campus/security.ts';
import {newBoard} from '../lib/campus/board-games.ts';
for(const transport of ['vercel','colyseus']){
 test(`${transport}: live table location gates reads, profiles, joins and rounds; reconnect/exit abandon without a win`,async()=>{
  const f=await roomGamesFixture(transport);
  try{
   for(const [x,z,floor] of [[0,0,0],[21.7,28.3,1],[26,26,2],[21.7,36,2]]){
    await f.pose(1,x,z,floor);assert.match((await f.game(1)).error,/Walk to/);assert.match((await f.game(1,'join',{username:'One'})).error,/Walk to/);
   }
   await f.pose(1);
   assert.equal((await f.game(1,'join',{username:'One'})).members.length,1);
   assert.equal((await f.game(2,'join',{username:'Two'})).members.length,2);
   for(const n of [1,2]){const g=await f.game(n);await f.game(n,'ready',{round:g.round,version:g.version,ready:true});}
   await f.db.exec("UPDATE campus_game_members SET last_action='-infinity' WHERE connection IS NOT NULL");
   let g=await f.game(1);g=await f.game(1,'commit',{round:g.round,version:g.version,start:true,state:newBoard('four',g.members.map(m=>m.id))});assert.equal(g.state.phase,'playing');
   const player=g.members[0].id;
   await f.pose(1,21.7,28.3,1);
   assert.match((await f.game(1,'photo',{player})).error,/Walk to/);
   g=await f.game(2);assert.equal(g.state.phase,'abandoned');assert.equal(g.members.length,1);
   await f.pose(1);await f.game(1,'join',{username:'One'});
   await f.db.query('UPDATE campus_presence SET connection_id=$2 WHERE campus_id=$1',[f.members[0].id,randomUUID()]);
   assert.ok((await f.game(1)).error,'old key cannot act for a new connection');
   await f.db.query('SELECT campus_game_bind(connection_id,$2) FROM campus_presence WHERE campus_id=$1',[f.members[0].id,hashTicket(f.keys[0])]);
   assert.equal((await f.game(1)).self,null);
   await f.db.query("UPDATE campus_presence SET travel='{}' WHERE campus_id=$1",[f.members[0].id]);assert.match((await f.game(1)).error,/Walk to/);
   await f.pose(1);await f.game(1,'join',{username:'One'});
   await f.db.query("UPDATE campus_presence SET lease_until=clock_timestamp()-interval '1 second' WHERE campus_id=$1",[f.members[0].id]);
   assert.ok((await f.game(1)).error);assert.equal((await f.game(2)).members.length,1);
  }finally{await f.db.close();}
 });
 test(`${transport}: targeted invitation consent, reservations, capacity, generations and cleanup`,async()=>{
  const f=await roomGamesFixture(transport);
  try{
   for(let n=1;n<=6;n++)await f.pose(n,n,0,0);
   const sent=await f.play(1,'send',{target:f.members[1].id,table:'four'});assert.equal(sent.invitation.incoming,false);
   const received=await f.play(2);assert.equal(received.invitation.incoming,true);
   assert.equal(received.invitation.pseudonym,f.members[0].pseudonym);
   assert.equal(JSON.stringify(received).includes(id(1)),false);assert.equal(JSON.stringify(received).includes('avatar'),false);
   assert.equal((await f.play(3)).invitation,null);
   assert.ok((await f.play(2,'send',{target:f.members[0].id,table:'four'})).error,'opposite invite denied');
   const accepted=await f.play(2,'accept',{id:received.invitation.id});assert.equal(accepted.invitation.state,'accepted');
   assert.ok((await f.play(2,'accept',{id:received.invitation.id})).error,'double accept denied');
   assert.equal((await f.db.query('SELECT count(*) AS n FROM campus_game_members')).rows[0].n,0);
   assert.match((await f.game(1)).error,/Walk to/,'acceptance is not room access');
   await f.pose(3);assert.match((await f.game(3,'join',{username:'Three'})).error,/reserved/);
   await f.pose(1);await f.pose(2);
   assert.equal((await f.game(1,'join',{username:'One'})).members.length,1);
   assert.equal((await f.game(2,'join',{username:'Two'})).members.length,2);
   assert.equal((await f.play(1)).invitation,null,'both deliberate joins consume the meeting reservation');
   for(let n=1;n<=2;n++)await f.game(n,'leave');
   await f.db.exec("UPDATE campus_play_limits SET last_sent='-infinity' WHERE connection IS NOT NULL");
   await f.pose(1,0,0,0);await f.pose(2,1,0,0);
   const next=await f.play(1,'send',{target:f.members[1].id,table:'boxes'});
   await f.play(2,'decline',{id:next.invitation.id});
   await f.db.exec("UPDATE campus_play_limits SET last_sent='-infinity' WHERE connection IS NOT NULL");
   assert.ok((await f.play(1,'send',{target:f.members[1].id,table:'boxes'})).error,'pair backoff survives a send cooldown');
   await f.play(3,'mute',{muted:true});assert.ok((await f.play(1,'send',{target:f.members[2].id,table:'boxes'})).error);
   await f.play(3,'mute',{muted:false});
   const pending=await f.play(4,'send',{target:f.members[4].id,table:'boxes'});assert.ok(pending.invitation);
   await f.db.query('UPDATE campus_presence SET connection_id=$2 WHERE campus_id=$1',[f.members[4].id,randomUUID()]);
   assert.ok((await f.play(5)).error);
   await f.db.query('SELECT campus_game_bind(connection_id,$2) FROM campus_presence WHERE campus_id=$1',[f.members[4].id,hashTicket(f.keys[4])]);
   assert.equal((await f.play(5)).invitation,null);assert.ok((await f.play(5,'accept',{id:pending.invitation.id})).error);
   const expiring=await f.play(6,'send',{target:f.members[3].id,table:'boxes'});assert.ok(expiring.invitation);
   await f.db.exec("UPDATE campus_play_invites SET expires=clock_timestamp()-interval '1 second' WHERE state='pending'");
   assert.equal((await f.play(4)).invitation,null);
   await f.db.exec("UPDATE feature_flags SET enabled=false WHERE key='virtual_campus_enabled'");
   for(const table of ['campus_play_invites','campus_play_limits','campus_play_backoff'])assert.equal((await f.db.query(`SELECT count(*) AS n FROM ${table}`)).rows[0].n,0);
  }finally{await f.db.close();}
 });
}
test('invitation/private context authority denies direct roles, stale/reordered proofs and browser forgeries',async()=>{
 const f=await roomGamesFixture('colyseus');
 try{
  for(const role of ['anon','authenticated','service_role']){
   await f.db.exec(`SET ROLE ${role}`);
   for(const table of ['campus_play_invites','campus_play_limits','campus_play_backoff','campus_play_context'])await assert.rejects(f.db.query(`SELECT * FROM ${table}`),/permission/);
   await assert.rejects(f.db.query("SELECT campus_game_unlocated($1,'four','read')",[id(1)]),/permission/);
   await assert.rejects(f.db.query("SELECT campus_games_prepare($1,'vercel','{}')",[id(1)]),/permission/);
   if(role!=='service_role')await assert.rejects(f.db.query("SELECT campus_play($1,'read')",[id(1)]),/permission/);
   await f.db.exec('RESET ROLE');
  }
  let [,raw]=await f.context(),proof=JSON.parse(raw);
  await f.db.query("SELECT campus_play($1,'read','{}','colyseus',$2,$3)",[id(1),proof,hashTicket(f.keys[0])]);
  await assert.rejects(f.db.query("SELECT campus_play($1,'read','{}','colyseus',$2,$3)",[id(1),{...proof,at:proof.at-1},hashTicket(f.keys[0])]),/Superseded/);
  await assert.rejects(f.db.query("SELECT campus_play($1,'read','{}','colyseus',$2,$3)",[id(1),{...proof,at:Date.now()-3000},hashTicket(f.keys[0])]),/expired/);
  const api=f.playApi(1);
  for(const body of [{action:'send',target:f.members[1].id,table:'four',proof},{action:'__proto__'}])assert.equal((await api.POST(new Request('http://localhost/api/campus/play',{method:'POST',headers:{origin:'http://localhost','x-campus-game-key':f.keys[0]},body:JSON.stringify(body)}))).status,400);
  assert.equal((await api.POST(new Request('http://localhost/api/campus/play',{method:'POST',headers:{origin:'https://evil.test'},body:'{}'}))).status,403);
 }finally{await f.db.close();}
});
for(const transport of ['vercel','colyseus'])test(`${transport}: four-place reservations cannot overbook/start early; block, study, cancellation and stale-tab writes are bounded`,async()=>{
 const f=await roomGamesFixture(transport);
 try{
  for(let n=1;n<=6;n++)await f.pose(n,n,0,0);
  const invite=async(a,b)=>{
   const sent=await f.play(a,'send',{target:f.members[b-1].id,table:'boxes'});assert.ok(sent.invitation);
   const accepted=await f.play(b,'accept',{id:sent.invitation.id});assert.equal(accepted.invitation.state,'accepted');return sent.invitation.id;
  };
  const first=await invite(1,2);await invite(3,4);
  for(let n=1;n<=6;n++)await f.pose(n,33.7,28.3,2);
  assert.match((await f.game(5,'join',{username:'Five'},'boxes')).error,/reserved/);
  for(const n of [1,2])assert.equal((await f.game(n,'join',{username:`Person${n}`},'boxes')).error,undefined);
  for(const n of [1,2]){const g=await f.game(n,'read',{},'boxes');await f.game(n,'ready',{round:g.round,ready:true},'boxes');}
  let g=await f.game(1,'read',{},'boxes');
  assert.match((await f.game(1,'commit',{round:g.round,version:g.version,start:true,state:newBoard('boxes',g.members.map(m=>m.id))},'boxes')).error,/reserved/);
  assert.equal((await f.play(1)).invitation,null,'first pair consumed their reservation');
  const second=(await f.play(3)).invitation;
  await f.play(3,'cancel',{id:second.id});assert.equal((await f.play(4)).invitation,null);
  assert.equal((await f.game(3,'join',{username:'Three'},'boxes')).error,undefined);
  const original=await f.game(1,'read',{},'boxes');
  await f.game(1,'leave',{},'boxes');await f.game(1,'join',{username:'OneAgain'},'boxes');
  await f.game(1,'leave',{member:original.self},'boxes');assert.ok((await f.game(1,'read',{},'boxes')).self,'late cleanup cannot release a newly joined seat');
  assert.ok((await f.rpc(id(1),'boxes','move',{},f.keys[1])).error,'another connection key cannot control this account');
  for(let n=1;n<=3;n++)await f.game(n,'leave',{},'boxes');
  await f.db.exec("UPDATE campus_play_limits SET last_sent='-infinity' WHERE connection IS NOT NULL");
  const pending=await f.play(1,'send',{target:f.members[1].id,table:'four'});assert.ok(pending.invitation);
  await f.as(2,()=>f.db.query('SELECT campus_block($1,true)',[f.members[0].id]));
  assert.equal((await f.play(1)).invitation,null);assert.ok((await f.play(2,'accept',{id:pending.invitation.id})).error);
  await f.db.exec("UPDATE campus_play_limits SET last_sent='-infinity' WHERE connection IS NOT NULL");
  await f.db.query("UPDATE campus_presence SET seat='quiet-1',status='studying' WHERE campus_id=$1",[f.members[2].id]);
  assert.ok((await f.play(4,'send',{target:f.members[2].id,table:'four'})).error,'studying target unavailable');
  await f.db.query('UPDATE campus_members SET enabled=false WHERE user_id=$1',[id(4)]);assert.ok((await f.play(4)).error);
  assert.ok(first);
 }finally{await f.db.close();}
});
