import {test} from "node:test";
import assert from "node:assert/strict";
import {gamesFixture} from "./helpers/campus-games-fixture.mjs";
import {id} from "./helpers/course-pilot-fixture.mjs";

test("game database enforces capacity, private rosters, atomic turns/version, rematch and complete cleanup through the application API",async()=>{
 const f=await gamesFixture();
 try{
  for(const role of ['anon','authenticated','service_role']){
   await f.db.exec(`SET ROLE ${role}`);
   await assert.rejects(f.db.query('SELECT * FROM campus_game_members'),/permission/);
   await assert.rejects(f.db.query('SELECT * FROM campus_game_tables'),/permission/);
   await assert.rejects(f.db.query('SELECT campus_games_switch_cleanup()'),/permission/);
   if(role!=='service_role')await assert.rejects(f.db.query("SELECT campus_game($1,'four','read')",[id(1)]),/permission/);
   await f.db.exec('RESET ROLE');
  }
  assert.equal((await f.request(0,'four')).status,403);
  assert.equal((await f.request(1,'four',{action:'join',username:'Alex'})).status,200);
  assert.equal((await f.request(2,'four',{action:'join',username:'alex'})).status,409);
  assert.equal((await f.request(2,'four',{action:'join',username:'Blair'})).status,200);
  const stranger=(await f.request(3,'four')).body.game;
  assert.deepEqual(stranger.members,[]);assert.equal(stranger.state,null);assert.equal(stranger.count,2);
  assert.equal((await f.request(3,'four',{action:'join',username:'Casey'})).status,409);
  assert.equal((await f.request(1,'boxes',{action:'join',username:'Alex'})).status,409);
  await f.command(1,'four',{action:'ready',ready:true});
  assert.equal((await f.command(1,'four',{action:'start'})).status,400);
  await f.command(2,'four',{action:'ready',ready:true});
  const start=await f.command(1,'four',{action:'start'});assert.equal(start.status,200);
  const first=start.body.game;
  assert.equal((await f.command(2,'four',{action:'move',move:3})).status,400);
  const move=await f.command(1,'four',{action:'move',move:0});assert.equal(move.status,200);
  assert.equal((await f.request(1,'four',{action:'move',move:0,round:first.round,version:first.version})).status,409);
  for(const [n,col] of [[2,1],[1,0],[2,1],[1,0],[2,1],[1,0]])assert.equal((await f.command(n,'four',{action:'move',move:col})).status,200);
  const finished=(await f.request(2,'four')).body.game;
  assert.equal(finished.state.phase,'finished');assert.deepEqual(finished.state.winners,[0]);
  await f.command(1,'four',{action:'ready',ready:true});assert.equal((await f.command(1,'four',{action:'start'})).status,400);
  await f.command(2,'four',{action:'ready',ready:true});const rematch=await f.command(1,'four',{action:'start'});
  assert.notEqual(rematch.body.game.round,finished.round);assert.ok(rematch.body.game.state.board.every(v=>v===-1));
  assert.equal((await f.request(1,'four',{action:'leave'})).status,200);
  assert.equal((await f.request(2,'four')).body.game.state.phase,'abandoned');
  await f.request(2,'four',{action:'leave'});
  assert.equal((await f.db.query('SELECT count(*) AS n FROM campus_game_members')).rows[0].n,0);
  assert.equal((await f.db.query("SELECT state FROM campus_game_tables WHERE table_id='four'")).rows[0].state,null);
 }finally{await f.db.close();}
});
test("four-player games protect photos/rosters, block both ways, revoke and expire seats without fabricated wins",async()=>{
 const f=await gamesFixture();
 const png=Uint8Array.from([137,80,78,71,13,10,26,10]);
 const image=async()=>new Response(png,{headers:{'content-type':'image/png'}});
 const photo=(n,player,table='boxes')=>f.api(n,image).PHOTO(new Request(`http://127.0.0.1:3012/api/campus/games/photo?table=${table}&player=${player}`));
 try{
  for(let n=1;n<=4;n++)assert.equal((await f.request(n,'boxes',{action:'join',username:`Friend${n}`})).status,200);
  assert.equal((await f.request(5,'boxes',{action:'join',username:'Friend5'})).status,409);
  const roster=(await f.request(1,'boxes')).body.game;
  assert.equal(roster.members.length,4);assert.equal(roster.members[0].username,'Friend1');assert.equal(roster.members[0].photo,true);
  assert.equal((await photo(2,roster.self)).status,200);assert.equal((await photo(5,roster.self)).status,404);
  assert.equal((await photo(2,roster.self,'four')).status,404);assert.equal((await photo(5,'self')).status,200);
  assert.equal(JSON.stringify(roster).includes(id(1)),false);assert.equal(JSON.stringify(roster).includes('avatar_url'),false);
  for(let n=1;n<=4;n++)await f.command(n,'boxes',{action:'ready',ready:true});
  assert.equal((await f.command(4,'boxes',{action:'start'})).status,200);
  for(let n=1;n<=4;n++)assert.equal((await f.command(n,'boxes',{action:'move',move:n-1})).status,200);
  assert.equal((await f.request(1,'boxes',{action:'report',player:roster.members[1].id,reason:'technical'})).status,200);
  assert.equal((await f.db.query('SELECT count(*) AS n FROM campus_reports')).rows[0].n,1);
  await f.request(1,'boxes',{action:'block',player:roster.members[1].id});
  assert.equal((await photo(1,roster.members[1].id)).status,404);assert.equal((await photo(2,roster.self)).status,404);
  assert.equal((await f.request(3,'boxes')).body.game.state.phase,'abandoned');
  await f.db.query("UPDATE campus_members SET enabled=false WHERE user_id=$1",[id(3)]);
  assert.equal((await f.request(3,'boxes')).status,403);
  await f.db.exec("UPDATE campus_game_members SET lease_until=clock_timestamp()-interval '1 second' WHERE table_id='boxes'");
  assert.deepEqual((await f.request(4,'boxes')).body.game.members,[]);
  assert.equal((await f.db.query('SELECT count(*) AS n FROM campus_game_members')).rows[0].n,0);
  await f.request(2,'boxes',{action:'join',username:'Blair'});
  assert.equal((await f.request(1,'boxes',{action:'join',username:'Alex'})).status,409);
  await f.db.exec("UPDATE feature_flags SET enabled=false WHERE key='virtual_campus_enabled'");
  assert.equal((await f.db.query('SELECT count(*) AS n FROM campus_game_members')).rows[0].n,0,'switch-off cleans game identities before another API request');
  assert.equal((await f.request(2,'boxes')).status,403);
  assert.equal((await f.db.query('SELECT count(*) AS n FROM campus_game_members')).rows[0].n,0);
  await f.db.exec("UPDATE feature_flags SET enabled=true WHERE key='virtual_campus_enabled'");
  await f.request(2,'boxes',{action:'join',username:'Blair'});
  assert.equal((await f.db.query('SELECT count(*) AS n FROM campus_game_members')).rows[0].n,1);
  await f.db.exec("DELETE FROM feature_flags WHERE key='virtual_campus_enabled'");
  assert.equal((await f.db.query('SELECT count(*) AS n FROM campus_game_members')).rows[0].n,0,'deleting the switch also cleans identities');
 }finally{await f.db.close();}
});

test("concurrent joins and Ready clicks converge; duplicate moves apply once and old rounds stay rejected",async()=>{
 const f=await gamesFixture();
 try{
  const joins=await Promise.all([1,2,3].map(n=>f.request(n,'four',{action:'join',username:`Friend${n}`})));
  assert.equal(joins.filter(r=>r.status===200).length,2);
  const accounts=joins.flatMap((r,i)=>r.status===200?[i+1]:[]);
  const g=(await f.request(accounts[0],'four')).body.game;
  const ready=await Promise.all(accounts.map(n=>f.request(n,'four',{action:'ready',ready:true,round:g.round,version:g.version})));
  assert.deepEqual(ready.map(r=>r.status),[200,200],'one player becoming ready must not reject the other Ready intent');
  const start=(await f.command(accounts[0],'four',{action:'start'})).body.game;
  await f.clearRate();
  const payload={action:'move',move:0,round:start.round,version:start.version};
  const moves=await Promise.all([f.request(accounts[0],'four',payload),f.request(accounts[0],'four',payload)]);
  assert.equal(moves.filter(r=>r.status===200).length,1);
  assert.equal((await f.request(accounts[0],'four')).body.game.state.board.filter(p=>p===0).length,1);
  assert.equal((await f.request(accounts[1],'four',{action:'ready',ready:false,round:g.round,version:g.version})).status,409);
  const forged=new Request('http://127.0.0.1:3012/api/campus/games?table=four',{method:'POST',headers:{origin:'https://evil.test'},body:JSON.stringify({action:'leave'})});
  assert.equal((await f.api(accounts[0]).POST(forged)).status,403);
  assert.equal((await f.request(accounts[0],'four',{action:'move',move:2,actor:id(accounts[1])})).status,400);
  assert.equal((await f.request(accounts[0],'four',{action:'__proto__'})).status,400);
 }finally{await f.db.close();}
});
