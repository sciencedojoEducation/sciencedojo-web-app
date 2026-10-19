import {test} from 'node:test';
import assert from 'node:assert/strict';
import {VOCABULARY,GERMAN_LEVELS,vocabularyQuiz} from '../lib/campus/german-vocabulary.ts';
import {gamesFixture} from './helpers/campus-games-fixture.mjs';
import {id} from './helpers/course-pilot-fixture.mjs';

test('six complete original starter decks produce unambiguous four-option, ten-card quizzes with varied answer positions',()=>{
 assert.equal(VOCABULARY.length,180);assert.equal(new Set(VOCABULARY.map(c=>c.id)).size,180);
 const positions=new Set();
 for(const level of GERMAN_LEVELS){
  const cards=VOCABULARY.filter(c=>c.level===level);assert.equal(cards.length,30);
  for(const c of cards){
   for(const field of ['id','term','forms','explanation','example','translation'])assert.ok(c[field]?.length>0,`${c.id} ${field}`);
   assert.equal(c.distractors.length,3);assert.equal(new Set([c.explanation,...c.distractors]).size,4);
   assert.ok(c.forms.includes(';'));assert.ok(c.example.includes(c.term.replace(/^(der|die|das) /,''))||c.part!=='noun',`${c.id} noun in context`);
  }
  for(let run=0;run<10;run++){
   const quiz=vocabularyQuiz(level);assert.equal(quiz.length,10);assert.equal(new Set(quiz.map(q=>q.id)).size,10);
   for(const q of quiz){const card=cards.find(c=>c.id===q.id);assert.ok(card);assert.equal(q.options.length,4);assert.equal(q.options[q.correct],card.explanation);positions.add(q.correct);}
   assert.ok(Buffer.byteLength(JSON.stringify(quiz))<10000);
  }
 }
 assert.equal(positions.size,4);assert.throws(()=>vocabularyQuiz('D1'));
});
const snapshot=async(f,n)=>(await f.request(n,'wortquest')).body.game;
const action=async(f,n,body)=>{const g=await snapshot(f,n);return f.request(n,'wortquest',{round:g.round,...body});};
const ready=async(f,n,level)=>f.command(n,'wortquest',{action:'ready',level,ready:true});
const correct=(q)=>{const card=VOCABULARY.find(c=>c.id===q.id);return q.options.indexOf(card.explanation);};

test('friend quizzes commute answers privately, score once, progress by agreement and finish with private reviews for two, three and four players',async()=>{
 const f=await gamesFixture();
 try{
  for(const [size,level] of [[2,'A1'],[3,'B2'],[4,'C2']]){
   for(let n=1;n<=size;n++)assert.equal((await f.request(n,'wortquest',{action:'join',username:`Learner${n}`})).status,200);
   assert.equal((await f.request(1,'four',{action:'join',username:'Learner1'})).status,409);
   await action(f,1,{action:'quiz-level',level});
   assert.equal((await ready(f,1,level==='A1'?'B1':'A1')).status,409);
   for(let n=1;n<=size;n++)assert.equal((await ready(f,n,level)).status,200);
   const started=await f.command(1,'wortquest',{action:'start'});assert.equal(started.status,200,JSON.stringify(started.body));
   const round=started.body.game.round;
   let expected=0;
   for(let index=0;index<10;index++){
    const initial=await snapshot(f,1), q=initial.quiz.question;
    assert.equal(initial.state,null);assert.equal(initial.quiz.index,index);assert.equal(initial.quiz.solution,undefined);assert.equal(q.correct,undefined);assert.equal(q.translation,undefined);assert.equal(initial.quiz.phase,'playing');
    const payload={action:'quiz-answer',round,card:q.id,choice:index%2===0?correct(q):-1};
    assert.equal((await f.request(1,'wortquest',payload)).status,200);
    const duplicate=await f.request(1,'wortquest',{...payload,choice:(correct(q)+1)%4});assert.equal(duplicate.status,200);
    const other=await snapshot(f,2);assert.equal(other.quiz.answered,false);assert.equal(other.quiz.solution,undefined);assert.deepEqual(other.quiz.scores,Array(size).fill(expected));assert.equal(other.quiz.review.length,0);
    const rest=await Promise.all(Array.from({length:size-1},(_,i)=>f.request(i+2,'wortquest',{...payload,choice:index%2===0?correct(q):-1})));
    assert.ok(rest.every(r=>r.status===200),JSON.stringify(rest));
    expected+=index%2===0?10:0;
    const revealed=await snapshot(f,1);assert.equal(revealed.quiz.solution.correct,correct(q));assert.deepEqual(revealed.quiz.scores,Array(size).fill(expected));
    assert.ok(!JSON.stringify(revealed).includes(id(1)));assert.ok(!('answers' in revealed.quiz));
    if(index<9){
     const next={action:'quiz-next',round,card:q.id};
     assert.equal((await f.request(1,'wortquest',next)).status,200);
     assert.equal((await f.request(1,'wortquest',next)).status,200);
     assert.equal((await snapshot(f,1)).quiz.index,index);
     await Promise.all(Array.from({length:size-1},(_,i)=>f.request(i+2,'wortquest',next)));
     assert.equal((await snapshot(f,1)).quiz.index,index+1);
     assert.equal((await f.request(1,'wortquest',payload)).status,409);
    }
   }
   const end=await snapshot(f,1);assert.equal(end.quiz.phase,'finished');assert.deepEqual(end.quiz.winners,Array.from({length:size},(_,i)=>i));assert.equal(end.quiz.review.length,10);assert.equal(end.quiz.review.filter(r=>!r.correct).length,5);
   const outsider=await snapshot(f,6);assert.equal(outsider.quiz,null);assert.equal(outsider.level,null);assert.deepEqual(outsider.members,[]);
   for(let n=1;n<=size;n++)await f.request(n,'wortquest',{action:'leave'});
   const empty=(await f.db.query("SELECT state,quiz_level FROM campus_game_tables WHERE table_id='wortquest'")).rows[0];assert.equal(empty.state,null);assert.equal(empty.quiz_level,'A1');
  }
 }finally{await f.db.close();}
});

test('quiz level confirmation, score/identity forgery, block/revocation/expiry and switch cleanup remain enforced',async()=>{
 const f=await gamesFixture();
 try{
  await assert.rejects(f.db.exec(await (await import('node:fs/promises')).readFile(new URL('../sql/077_campus_german_vocabulary.sql',import.meta.url),'utf8')),/Expected reviewed 076|already present/);
  await f.db.exec('ROLLBACK');
  for(const role of ['anon','authenticated','service_role']){
   await f.db.exec(`SET ROLE ${role}`);
   await assert.rejects(f.db.query("SELECT campus_quiz_view('{}','x','A1')"),/permission/);
   await assert.rejects(f.db.query("SELECT campus_quiz_update('{}','x','read','{}')"),/permission/);
   await f.db.exec('RESET ROLE');
  }
  for(let n=1;n<=3;n++)await f.request(n,'wortquest',{action:'join',username:`Learner${n}`});
  await ready(f,1,'A1');await action(f,2,{action:'quiz-level',level:'C1'});
  assert.ok((await snapshot(f,1)).members.every(m=>!m.ready));
  for(let n=1;n<=3;n++)await ready(f,n,'C1');
  await f.command(1,'wortquest',{action:'start'});const g=await snapshot(f,1);
  assert.equal((await action(f,1,{action:'quiz-level',level:'C2'})).status,409);
  assert.equal((await action(f,1,{action:'quiz-next',card:g.quiz.question.id})).status,409);
  assert.equal((await action(f,1,{action:'quiz-answer',card:g.quiz.question.id,choice:0,score:100})).status,400);
  assert.equal((await action(f,1,{action:'quiz-answer',card:g.quiz.question.id,choice:0,actor:id(2)})).status,400);
  assert.equal((await action(f,1,{action:'quiz-answer',card:g.quiz.question.id,choice:0.5})).status,400);
  assert.equal((await f.request(4,'wortquest',{action:'quiz-answer',round:g.round,card:g.quiz.question.id,choice:0})).status,403);
  await f.request(1,'wortquest',{action:'block',player:g.members[1].id});
  const remaining=await snapshot(f,3);assert.equal(remaining.quiz.phase,'abandoned');assert.equal(remaining.members.length,1);assert.equal(remaining.quiz.solution,undefined);
  await f.db.query("UPDATE campus_members SET enabled=false WHERE user_id=$1",[id(3)]);assert.equal((await f.request(3,'wortquest')).status,403);
  assert.equal((await snapshot(f,4)).count,0);
  await f.request(4,'wortquest',{action:'join',username:'Learner4'});
  await f.db.exec("UPDATE campus_game_members SET lease_until=clock_timestamp()-interval '1 second' WHERE table_id='wortquest'");
  assert.equal((await snapshot(f,5)).count,0);
  await f.request(4,'wortquest',{action:'join',username:'Learner4'});
  await f.db.exec("UPDATE feature_flags SET enabled=false WHERE key='virtual_campus_enabled'");
  assert.equal((await f.db.query("SELECT count(*) AS n FROM campus_game_members")).rows[0].n,0);
  assert.ok((await f.db.query("SELECT state FROM campus_game_tables")).rows.every(r=>r.state===null));
 }finally{await f.db.close();}
});

test('different players receive only their own missed-word choices; final answer retry and rematch do not rescore or expose prior answers',async()=>{
 const f=await gamesFixture();
 try{
  for(let n=1;n<=2;n++){await f.request(n,'wortquest',{action:'join',username:`Learner${n}`});await ready(f,n,'A1');}
  // The second join invalidates the first ready confirmation.
  await ready(f,1,'A1');
  const started=await f.command(1,'wortquest',{action:'start'});assert.equal(started.status,200);
  const round=started.body.game.round;let last;
  for(let index=0;index<10;index++){
   const {quiz}=await snapshot(f,1);
   await f.request(1,'wortquest',{action:'quiz-answer',round,card:quiz.question.id,choice:correct(quiz.question)});
   last={action:'quiz-answer',round,card:quiz.question.id,choice:index<5?(correct(quiz.question)+1)%4:-1};
   await f.request(2,'wortquest',last);
   if(index<9)await Promise.all([1,2].map(n=>f.request(n,'wortquest',{action:'quiz-next',round,card:quiz.question.id})));
  }
  assert.equal((await f.request(2,'wortquest',last)).status,200,'lost final response can be retried safely');
  const winner=await snapshot(f,1),other=await snapshot(f,2);
  assert.deepEqual(winner.quiz.scores,[100,0]);assert.deepEqual(winner.quiz.winners,[0]);
  assert.ok(winner.quiz.review.every(r=>r.correct&&r.chosen===r.explanation));assert.ok(other.quiz.review.every(r=>!r.correct));assert.ok(other.quiz.review.slice(0,5).every(r=>r.chosen!==null&&r.chosen!==r.explanation));assert.ok(other.quiz.review.slice(5).every(r=>r.chosen===null));
  await ready(f,1,'A1');assert.equal((await f.command(1,'wortquest',{action:'start'})).status,409);
  await ready(f,2,'A1');const rematch=(await f.command(1,'wortquest',{action:'start'})).body.game;
  assert.notEqual(rematch.round,round);assert.deepEqual(rematch.quiz.scores,[0,0]);assert.deepEqual(rematch.quiz.review,[]);assert.equal(rematch.quiz.solution,undefined);
  assert.equal((await f.request(2,'wortquest',last)).status,409);
 }finally{await f.db.close();}
});
