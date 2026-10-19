import {test} from "node:test";
import assert from "node:assert/strict";
import {newBoard,playBoard,boxEdges,gameUsername} from "../lib/campus/board-games.ts";
import {allowedGamePhoto,readGamePhoto} from "../lib/campus/board-game-photo.ts";

test("Four in a Row validates every win direction, turns, columns and draw",()=>{
  for(const positions of [[35,36,37],[35,28,21],[35,29,23],[38,30,22]]){
    const s=newBoard('four',['a','b']);
    positions.forEach(i=>s.board[i]=0);
    const last=positions[2]+positions[2]-positions[1],col=last%7;
    for(let row=5;row>Math.floor(last/7);row--)if(s.board[row*7+col]===-1)s.board[row*7+col]=1;
    const result=playBoard(s,'a',col);
    assert.equal(result.phase,'finished');assert.deepEqual(result.winners,[0]);
    assert.deepEqual(s.winners,[],'does not mutate the authoritative old version');
  }
  let s=newBoard('four',['a','b']);
  assert.throws(()=>playBoard(s,'b',0),/turn/);
  for(const illegal of [-1,7,1.5,NaN,'2'])assert.throws(()=>playBoard(s,'a',illegal),/legal/);
  for(let i=0;i<6;i++)s=playBoard(s,s.players[s.turn],0);
  assert.throws(()=>playBoard(s,s.players[s.turn],0),/full/);
  // A full board of alternating pairs has no four; the last drop must be a draw.
  s=newBoard('four',['a','b']);
  s.board=Array.from({length:42},(_,i)=>(Math.floor(i/7)+Math.floor(i%7/2))%2);
  s.board[0]=-1;s.turn=0;
  assert.equal(playBoard(s,'a',0).phase,'finished');
  assert.deepEqual(playBoard(s,'a',0).winners,[]);
});
test("Dots & Boxes rotates 2/3/4 players, captures two boxes, retains turns, scores ties and rejects reused edges",()=>{
  for(let n=2;n<=4;n++){
    let s=newBoard('boxes',Array.from({length:n},(_,i)=>String(i)));
    for(let i=0;i<n;i++){s=playBoard(s,String(i),i);assert.equal(s.turn,(i+1)%n);}
    assert.throws(()=>playBoard(s,s.players[s.turn],0),/already/);
  }
  const s=newBoard('boxes',['a','b','c','d']);
  const shared=21;
  for(const edge of new Set([...boxEdges(0),...boxEdges(1)]))if(edge!==shared)s.board[edge]=1;
  const result=playBoard(s,'a',shared);
  assert.deepEqual(result.boxes.slice(0,2),[0,0]);assert.equal(result.scores[0],2);assert.equal(result.turn,0);
  let full=newBoard('boxes',['a','b','c','d']);
  for(let edge=0;edge<40;edge++)full=playBoard(full,full.players[full.turn],edge);
  assert.equal(full.phase,'finished');assert.equal(full.scores.reduce((a,b)=>a+b),16);
  assert.deepEqual(full.winners,full.scores.flatMap((x,i)=>x===Math.max(...full.scores)?[i]:[]));
  const tie=newBoard('boxes',['a','b']);tie.board.fill(0);tie.board[39]=-1;tie.boxes=Array.from({length:16},(_,i)=>i<8?0:1);tie.boxes[15]=-1;tie.scores=[8,7];tie.turn=1;
  assert.deepEqual(playBoard(tie,'b',39).winners,[0,1]);
  assert.throws(()=>playBoard(full,full.players[full.turn],0),/turn/);
  assert.throws(()=>newBoard('four',['a','b','c']));assert.throws(()=>newBoard('boxes',['a','a']));
});
test("game usernames and existing avatar proxy reject addresses, credentials, redirects, nonimages and unbounded data",async()=>{
  assert.equal(gameUsername('  Alex_2 '),'Alex_2');assert.equal(gameUsername('friend@example.com'),null);
  assert.equal(gameUsername('<script>'),null);assert.equal(gameUsername('a'.repeat(25)),null);
  const base='https://fixture.supabase.co';
  for(const url of ['http://127.0.0.1/a','https://evil.test/a','https://fixture.supabase.co.evil.test/storage/v1/object/public/avatars/a','https://user:secret@fixture.supabase.co/storage/v1/object/public/avatars/a','https://fixture.supabase.co/storage/v1/object/public/other/a','https://lh3.googleusercontent.com.evil.test/a/a'])assert.equal(allowedGamePhoto(url,base),null);
  assert.ok(allowedGamePhoto(base+'/storage/v1/object/public/avatars/a.png',base));
  assert.ok(allowedGamePhoto('https://lh3.googleusercontent.com/a/test',base));
  assert.ok(allowedGamePhoto('https://lh3.googleusercontent.com/a-/test',base));
  const url=new URL(base+'/storage/v1/object/public/avatars/a.png');
  assert.equal(await readGamePhoto(url,async()=>new Response('<html>',{headers:{'content-type':'image/png'}})),null);
  assert.equal(await readGamePhoto(url,async()=>new Response('svg',{headers:{'content-type':'image/svg+xml'}})),null);
  assert.equal(await readGamePhoto(url,async()=>new Response(new Uint8Array(1_048_577),{headers:{'content-type':'image/png'}})),null);
  let options;await readGamePhoto(url,async(_url,opts)=>{options=opts;throw Error('redirect');});assert.equal(options.redirect,'error');
});
