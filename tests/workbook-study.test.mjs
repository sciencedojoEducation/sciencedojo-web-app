import assert from 'node:assert/strict';
import { test } from 'node:test';
import { emptyWorkbookLearningState, mergeWorkbookDraft, validateWorkbookDraft, queueWorkbookReview, advanceWorkbookReview, recordWorkbookAttempt, workbookChapterStats } from '../lib/workbook-study.ts';
const page={bookPage:6,section:'Test',kind:'exercises',tracks:[],warnings:[],exercises:[{id:'1',instruction:'Test',mode:'fill',wordBank:[],checklist:[],modelAnswer:'',solutionEvidence:'key',solutionPage:146,notes:'',fields:[{id:'1',label:'Answer',options:[],answers:['gut'],evaluation:'exact'},{id:'2',label:'Answer',options:[],answers:['ja'],evaluation:'exact'},{id:'3',label:'Writing',options:[],answers:[],evaluation:'review'}]}]};
const now='2026-10-16T12:00:00.000Z';
test('independent device edits merge; conflicting answers and fresh runs require a choice',()=>{
 const base=emptyWorkbookLearningState().draft, local=structuredClone(base), remote=structuredClone(base);
 local.answers['6:1:1']='gut';remote.answers['6:1:2']='ja';
 assert.deepEqual(mergeWorkbookDraft(base,local,remote).draft.answers,{'6:1:1':'gut','6:1:2':'ja'});
 remote.answers['6:1:1']='schlecht';assert.deepEqual(mergeWorkbookDraft(base,local,remote).conflicts,['answers:6:1:1']);
 remote.runs['1']='new';assert.ok(mergeWorkbookDraft(base,local,remote).conflicts.includes('run:1'));
});
test('draft validation rejects malformed data and cannot accept forged assistance or scores',()=>{
 const draft=emptyWorkbookLearningState().draft;draft.assisted=[1];draft.revealed={'6:1:1':'gut'};
 assert.deepEqual(validateWorkbookDraft(draft).assisted,[]);assert.deepEqual(validateWorkbookDraft(draft).revealed,{});
 assert.throws(()=>validateWorkbookDraft({...draft,position:{...draft.position,page:146}}));
 assert.throws(()=>validateWorkbookDraft({...draft,answers:{'../../secret':'x'}}));
 assert.throws(()=>validateWorkbookDraft({...draft,position:{...draft.position,session:Array(6).fill('6:1')}}));
});
test('chapter submissions preserve fixed denominators, history, idempotency and assistance',()=>{
 const state=emptyWorkbookLearningState();state.draft.answers={'6:1:1':'gut','6:1:3':'Long writing'};
 const input={id:'first',chapter:1,kind:'chapter',now,contentVersion:'fixture'};
 const first=recordWorkbookAttempt(state,[page],input);assert.equal(first.result.correct,1);assert.equal(first.result.scored,2);assert.equal(first.result.review,1);assert.equal(first.result.unanswered,1);assert.equal(first.assisted,false);
 recordWorkbookAttempt(state,[page],input);assert.equal(state.attempts.length,1);
 state.draft.answers['6:1:2']='ja';const second=recordWorkbookAttempt(state,[page],{...input,id:'second'});assert.equal(second.assisted,true);assert.equal(first.result.correct,1);
 const stats=workbookChapterStats(state,1,3);assert.equal(stats.first,50);assert.equal(stats.latest,100);assert.equal(stats.best,100);assert.equal(stats.bestUnassisted,50);
 state.draft.assisted=[];recordWorkbookAttempt(state,[page],{...input,id:'practice',kind:'practice'});assert.equal(workbookChapterStats(state,1,3).attempts,2);
});
test('completed chapter scores just under 80 percent still need practice; exactly 80 does not',()=>{
 const state=emptyWorkbookLearningState();
 const attempt={id:'threshold',chapter:1,kind:'chapter',run:'initial',at:now,answers:{},assisted:false,contentVersion:'fixture',result:{fields:{},correct:103,scored:129,unanswered:0,review:0}};
 state.attempts=[attempt];
 const below=workbookChapterStats(state,1,129);assert.equal(below.needsPractice,true);assert.equal(below.latest,79.8);assert.equal(below.bestUnassisted,79.8);
 state.attempts=[{...attempt,result:{...attempt.result,correct:4,scored:5}}];
 assert.equal(workbookChapterStats(state,1,5).latest,80);assert.equal(workbookChapterStats(state,1,5).needsPractice,false);
 state.attempts=[{...attempt,result:{...attempt.result,correct:0,scored:0}}];
 assert.equal(workbookChapterStats(state,1,0).latest,null);assert.equal(workbookChapterStats(state,1,0).needsPractice,false);
});
test('revision uses 1/3/7/14 day intervals and failures restart at one day',()=>{
 const state=emptyWorkbookLearningState();queueWorkbookReview(state,6,'1','uncertain',now);let item=state.reviews[0];
 for(const days of [1,3,7,14]){item=advanceWorkbookReview(item,true,now);assert.equal(Date.parse(item.due)-Date.parse(now),days*86400000);}
 item=advanceWorkbookReview(item,true,now);assert.equal(item.due,null);
 item=advanceWorkbookReview(item,false,now);assert.equal(item.step,0);assert.equal(Date.parse(item.due)-Date.parse(now),86400000);
});
test('incorrect and skipped work enters revision; partial checks do not queue every untouched task',()=>{
 const state=emptyWorkbookLearningState();state.draft.answers={'6:1:1':'bad'};
 recordWorkbookAttempt(state,[page],{id:'one',chapter:1,kind:'practice',now,contentVersion:'x'});
 assert.equal(state.reviews.length,1);assert.equal(state.reviews[0].reason,'incorrect');
 const untouched=emptyWorkbookLearningState();recordWorkbookAttempt(untouched,[page],{id:'two',chapter:1,kind:'practice',now,contentVersion:'x'});assert.equal(untouched.reviews.length,0);
 recordWorkbookAttempt(untouched,[page],{id:'three',chapter:1,kind:'chapter',now,contentVersion:'x'});assert.equal(untouched.reviews[0].reason,'skipped');
});
test('archive snapshots do not reveal answer keys or move revision dates; early repeated reviews do not advance mastery',()=>{
 const state=emptyWorkbookLearningState();state.draft.answers={'6:1:1':'wrong'};queueWorkbookReview(state,6,'1','uncertain',now);
 const archived=recordWorkbookAttempt(state,[page],{id:'archive',chapter:1,kind:'archive',now,contentVersion:'x'});assert.deepEqual(archived.result.fields,{});assert.equal(archived.result.scored,0);assert.deepEqual(state.draft.assisted,[]);assert.equal(state.reviews[0].due,now);
 state.draft.answers={'6:1:1':'gut','6:1:2':'ja'};recordWorkbookAttempt(state,[page],{id:'review-one',chapter:1,kind:'practice',now,contentVersion:'x',revisionSession:true});assert.equal(state.reviews[0].step,1);
 recordWorkbookAttempt(state,[page],{id:'review-two',chapter:1,kind:'practice',now,contentVersion:'x',revisionSession:true});assert.equal(state.reviews[0].step,1);
});
test('tasks requiring the separate textbook stay outside numeric scores and automatic fixed-answer revision',()=>{
 const state=emptyWorkbookLearningState(),missing=structuredClone(page);missing.exercises[0].requiresSource='lehrbuch';
 const attempt=recordWorkbookAttempt(state,[missing],{id:'missing',chapter:1,kind:'chapter',now,contentVersion:'x'});assert.equal(attempt.result.scored,0);assert.equal(attempt.result.correct,0);assert.equal(state.reviews.length,0);
});

test('an audio bookmark update during a fresh exercise action cannot restore old answers',async()=>{
 const {reconcileWorkbookAction}=await import('../lib/workbook-study.ts');
 const before=emptyWorkbookLearningState().draft;before.answers={'6:1:1':'old answer'};before.position.track=2;before.position.seconds=10;
 const local=structuredClone(before);local.position.seconds=17;
 const remote=emptyWorkbookLearningState();remote.revision=5;remote.draft=structuredClone(before);delete remote.draft.answers['6:1:1'];remote.draft.exerciseRuns={'6:1':'fresh'};
 const result=reconcileWorkbookAction(before,local,remote);
 assert.deepEqual(result.conflicts,[]);assert.equal(result.state.draft.answers['6:1:1'],undefined);assert.equal(result.state.draft.position.seconds,17);assert.equal(result.state.draft.exerciseRuns['6:1'],'fresh');
});
test('action reconciliation preserves unrelated edits and requires a choice for text typed during a reset',async()=>{
 const {reconcileWorkbookAction}=await import('../lib/workbook-study.ts');
 const before=emptyWorkbookLearningState().draft;before.answers={'6:1:1':'old'};
 const local=structuredClone(before);local.answers['6:1:1']='new unsent text';local.answers['20:1:1']='other chapter';local.notes['6']='new note';local.position.seconds=15;
 const remote=emptyWorkbookLearningState();remote.draft=structuredClone(before);delete remote.draft.answers['6:1:1'];remote.draft.runs['1']='fresh';remote.draft.position.page=6;
 const result=reconcileWorkbookAction(before,local,remote);
 assert.deepEqual(result.conflicts,['answers:6:1:1']);assert.equal(result.state.draft.answers['20:1:1'],'other chapter');assert.equal(result.state.draft.notes['6'],'new note');assert.equal(result.state.draft.answers['6:1:1'],undefined);
 const submitted=emptyWorkbookLearningState();submitted.draft=structuredClone(before);submitted.draft.assisted=[1];
 const editing=reconcileWorkbookAction(before,local,submitted);assert.deepEqual(editing.conflicts,[]);assert.equal(editing.state.draft.answers['6:1:1'],'new unsent text');assert.deepEqual(editing.state.draft.assisted,[1]);
});

test('device recovery copies survive clearing pending autosave and remain scoped to their learner',async()=>{
 const {saveWorkbookRecovery,loadWorkbookRecoveries}=await import('../lib/workbook-study.ts');
 const entries=new Map();const storage={get length(){return entries.size},key:i=>[...entries.keys()][i]??null,getItem:key=>entries.get(key)??null,setItem:(key,value)=>entries.set(key,value)};
 const draft=emptyWorkbookLearningState().draft;draft.answers['6:1:1']='unsent answer';draft.notes['6']='device note';
 entries.set('workbook-pending:learner-a',JSON.stringify(draft));
 const record=saveWorkbookRecovery(storage,'learner-a',draft,'Before resolving another device’s fresh attempt');
 entries.delete('workbook-pending:learner-a');draft.answers['6:1:1']='edited later';
 assert.equal(loadWorkbookRecoveries(storage,'learner-a')[0].draft.answers['6:1:1'],'unsent answer');assert.equal(loadWorkbookRecoveries(storage,'learner-a')[0].draft.notes['6'],'device note');
 assert.deepEqual(loadWorkbookRecoveries(storage,'learner-b'),[]);assert.ok(entries.has(record.id));
 entries.set('workbook-recovery:learner-a:broken','not JSON');assert.equal(loadWorkbookRecoveries(storage,'learner-a').length,1);assert.ok(entries.has('workbook-recovery:learner-a:broken'));
 assert.throws(()=>saveWorkbookRecovery({...storage,setItem:()=>{throw new Error('storage full')}},'learner-a',draft,'failed backup'),/storage full/);
});

test('a fresh run keeps explicitly selected device edits and does not bring back unchanged old answers',async()=>{
 const {resolveWorkbookDraftChoices}=await import('../lib/workbook-study.ts');
 const base=emptyWorkbookLearningState().draft;base.answers={'6:1:1':'old saved','6:1:2':'old unchanged'};
 const local=structuredClone(base);local.answers['6:1:1']='new unsent';local.answers['6:1:3']='new from blank';
 const remote=structuredClone(base);remote.answers={};remote.runs['1']='fresh';
 const result=mergeWorkbookDraft(base,local,remote);
 assert.ok(result.conflicts.includes('answers:6:1:1'));assert.ok(result.conflicts.includes('answers:6:1:3'));assert.ok(result.conflicts.includes('run:1'));
 const resolved=resolveWorkbookDraftChoices(result.draft,local,remote,result.conflicts,{'answers:6:1:1':'local','answers:6:1:3':'remote'});
 assert.equal(resolved.runs['1'],'fresh');assert.equal(resolved.answers['6:1:1'],'new unsent');assert.equal(resolved.answers['6:1:2'],undefined);assert.equal(resolved.answers['6:1:3'],'');
 const audioOnly=structuredClone(base);audioOnly.position.seconds=20;
 const automatic=mergeWorkbookDraft(base,audioOnly,remote);assert.deepEqual(automatic.conflicts,[]);assert.deepEqual(automatic.draft.answers,{});assert.equal(automatic.draft.position.seconds,20);
});

test('an audio update during an unresolved conflict preserves the original pending baseline and unsent response on reload',async()=>{
 const {workbookPendingDraft}=await import('../lib/workbook-study.ts');
 const base=emptyWorkbookLearningState().draft;base.answers['6:1:1']='old saved';
 const local=structuredClone(base);local.answers['6:1:1']='unsent device version';
 const remote=structuredClone(base);remote.answers={};remote.runs['1']='fresh';
 // Restoring a browser backup can show the remote draft while the local version waits for a choice.
 const visible=structuredClone(remote);visible.position.track=2;visible.position.seconds=37;
 const pending=JSON.parse(JSON.stringify(workbookPendingDraft(remote,visible,{base,local})));
 assert.equal(pending.draft.answers['6:1:1'],'unsent device version');assert.equal(pending.draft.position.seconds,37);assert.equal(pending.base.answers['6:1:1'],'old saved');
 const reloaded=mergeWorkbookDraft(pending.base,pending.draft,remote);assert.ok(reloaded.conflicts.includes('answers:6:1:1'));assert.ok(reloaded.conflicts.includes('run:1'));
});
