"use client";
import {useState} from 'react';
import {GERMAN_LEVELS,VOCABULARY,shuffled,vocabularyQuiz,type GermanLevel,type QuizQuestion} from '@/lib/campus/german-vocabulary';
import type {GameSnapshot} from '@/lib/campus/board-games';
export type WortMode='study'|'solo'|'friends';
function Card({question,children}:{question:Pick<QuizQuestion,'term'|'forms'|'example'>;children?:React.ReactNode}){
 return <article className="vocabulary-card"><p className="campus-eyebrow">WORTQUEST · DEUTSCH</p><h3 lang="de">{question.term}</h3><p className="vocabulary-forms">{question.forms}</p><p lang="de" className="vocabulary-example">{question.example}</p>{children}</article>;
}
export default function WortQuest({game,mode,onMode,busy,connected,send}:{game:GameSnapshot|null;mode:WortMode;onMode:(mode:WortMode)=>void;busy:boolean;connected:boolean;send:(body:object)=>void}){
 const [level,setLevel]=useState<GermanLevel>('A1');
 const [study,setStudy]=useState(0),[order,setOrder]=useState<number[]>(Array.from({length:30},(_,i)=>i)),[flipped,setFlipped]=useState(false);
 const [questions,setQuestions]=useState<QuizQuestion[]>([]),[index,setIndex]=useState(0),[answers,setAnswers]=useState<number[]>([]);
 const member=game?.members.find(m=>m.id===game.self),q=game?.quiz;
 const deck=VOCABULARY.filter(c=>c.level===level),card=deck[order[study]];
 const answer=answers[index],finished=questions.length>0&&answers.length===10&&index===10;
 const soloScore=answers.reduce((sum,a,i)=>sum+(a===questions[i]?.correct?10:0),0);
 const start=()=>{setQuestions(vocabularyQuiz(level));setIndex(0);setAnswers([]);};
 const stamp={round:game?.round,version:game?.version};
 const quizLevel=game?.level as GermanLevel|undefined;
 const quizPlaying=q?.phase==='playing';
 const pick=(choice:number)=>{if(answers.length===index)setAnswers(previous=>[...previous,choice]);};
 return <section className="wortquest" aria-label="German vocabulary game">
  <div className="vocabulary-modes" role="group" aria-label="WortQuest modes">{(['study','solo','friends'] as const).map(m=><button key={m} aria-pressed={mode===m} disabled={!!member&&m!=='friends'} onClick={()=>onMode(m)}>{m==='study'?'Study cards':m==='solo'?'Solo quiz':'Play with friends'}</button>)}</div>
  <p className="vocabulary-note">A1–C2 practice decks · 30 starter cards per level. Vocabulary scores are for this game and do not certify language proficiency.</p>
  {mode!=='friends'&&<label className="vocabulary-level">Practice level<select aria-label="Practice level" value={level} disabled={mode==='solo'&&questions.length>0&&!finished} onChange={e=>{setLevel(e.target.value as GermanLevel);setStudy(0);setFlipped(false);setQuestions([]);setAnswers([]);setIndex(0);}}>{GERMAN_LEVELS.map(l=><option key={l}>{l}</option>)}</select></label>}
  {mode==='study'&&<><p>Card {study+1} / 30 · {level}</p><Card question={card}>{flipped?<div className="vocabulary-explanation"><p>{card.explanation}</p><p>{card.translation}</p></div>:<p>Reveal the English explanation when you are ready.</p>}<button aria-expanded={flipped} onClick={()=>setFlipped(v=>!v)}>{flipped?'Hide explanation':'Reveal explanation'}</button></Card><div className="game-round-actions"><button onClick={()=>{setStudy(v=>(v+29)%30);setFlipped(false);}}>Previous card</button><button onClick={()=>{setStudy(v=>(v+1)%30);setFlipped(false);}}>Next card</button><button onClick={()=>{setOrder(shuffled(Array.from({length:30},(_,i)=>i)));setStudy(0);setFlipped(false);}}>Shuffle cards</button></div><p>Your study cards and solo score stay private to this session.</p></>}
  {mode==='solo'&&<>{questions.length===0?<><p>Ten different cards. Choose the correct English explanation. Correct answers earn 10 points; an incorrect answer or Skip earns 0. Take your time.</p><button onClick={start}>Start {level} solo quiz</button></>:finished?<><div role="status"><h3>Quiz complete · {soloScore} / 100 points</h3></div><button onClick={start}>Play another {level} quiz</button><button onClick={()=>{setQuestions([]);setAnswers([]);setIndex(0);}}>Choose another level</button><details open><summary>Review missed words</summary>{questions.map((question,i)=>answers[i]!==question.correct&&<Card key={question.id} question={question}><p>{question.options[question.correct]}</p><p>{question.translation}</p><p>Your answer: {answers[i]<0?'Skipped':question.options[answers[i]]}</p></Card>)}{soloScore===100&&<p>You answered all ten correctly.</p>}</details></>:<><p role="status">Card {index+1} / 10 · {soloScore} / 100 points · {level}</p><Card question={questions[index]}><div className="vocabulary-options">{questions[index].options.map((option,i)=><button key={i} disabled={answer!==undefined} aria-pressed={answer===i} onClick={()=>pick(i)}>{String.fromCharCode(65+i)}. {option}</button>)}</div>{answer===undefined?<button onClick={()=>pick(-1)}>Skip card</button>:<div className="vocabulary-explanation" role="status"><strong>{answer===questions[index].correct?'Correct · +10 points':answer<0?'Skipped · 0 points':'Not quite · 0 points'}</strong><p>{questions[index].options[questions[index].correct]}</p><p>{questions[index].translation}</p><button onClick={()=>setIndex(i=>i+1)}>{index===9?'See my score':'Next question'}</button></div>}</Card><button className="vocabulary-restart" onClick={()=>{setQuestions([]);setAnswers([]);setIndex(0);}}>End solo quiz</button></>}</>}
  {mode==='friends'&&<>
   {!member?<p>Join below to play with 2–4 friends. Your chosen level and session points will be shared only with joined players. Your selected answers and missed-word review stay private.</p>:<>
    {!quizPlaying&&<div className="game-round-actions"><label>Shared practice level<select aria-label="Shared practice level" disabled={busy||!connected} value={quizLevel??'A1'} onChange={e=>send({action:'quiz-level',round:game?.round,level:e.target.value})}>{GERMAN_LEVELS.map(l=><option key={l}>{l}</option>)}</select></label><button aria-pressed={member.ready} disabled={busy||!connected} onClick={()=>send({action:'ready',...stamp,level:quizLevel,ready:!member.ready})}>{member.ready?'Not ready':`Confirm ${quizLevel??'A1'}${q?' rematch':''}`}</button><button disabled={busy||!connected||!game||game.members.length<2||!game.members.every(m=>m.ready)} onClick={()=>send({action:'start',...stamp})}>{q?'Start quiz rematch':'Start friend quiz'}</button><p>Everyone confirms the same level. Changing level clears ready confirmations.</p></div>}
    {q?.phase==='abandoned'?<p role="status">The quiz ended because a player left or became unavailable. No winner is awarded.</p>:q&&<>
     <p role="status">{q.phase==='finished'?`Quiz complete · ${q.winners.map(i=>game?.members[i]?.username??'Player').join(' & ')} ${q.winners.length===1?'wins':'tie'}`:`Card ${q.index+1} / 10 · ${q.level} · ${q.submitted} / ${game?.count} answered`}</p>
     <Card question={q.question}><div className="vocabulary-options">{q.question.options.map((option,i)=><button key={i} disabled={busy||!connected||q.answered||q.stage!=='answering'||q.phase!=='playing'} onClick={()=>send({action:'quiz-answer',round:game?.round,card:q.question.id,choice:i})}>{String.fromCharCode(65+i)}. {option}</button>)}</div>
      {!q.answered&&q.phase==='playing'&&<button disabled={busy||!connected} onClick={()=>send({action:'quiz-answer',round:game?.round,card:q.question.id,choice:-1})}>Skip card</button>}
      {q.answered&&q.stage==='answering'&&<p role="status">Answer saved. Waiting for everyone; choices stay private.</p>}
      {q.solution&&<div className="vocabulary-explanation"><p><strong>{q.question.options[q.solution.correct]}</strong></p><p>{q.solution.translation}</p>{q.phase==='playing'&&<button disabled={busy||!connected||q.continued} onClick={()=>send({action:'quiz-next',round:game?.round,card:q.question.id})}>{q.continued?'Waiting for everyone to continue…':'Continue to next card'}</button>}</div>}
     </Card>
     {q.phase==='finished'&&<details><summary>Your private missed-word review</summary>{q.review.filter(r=>!r.correct).map((r,i)=><article className="vocabulary-review" key={i}><h4 lang="de">{r.term}</h4><p>{r.explanation}</p><p lang="de">{r.example}</p><p>{r.translation}</p><p>Your answer: {r.chosen??'Skipped'}</p></article>)}{q.review.every(r=>r.correct)&&<p>You answered all ten correctly.</p>}</details>}
    </>}
   </>}
  </>}
 </section>;
}
