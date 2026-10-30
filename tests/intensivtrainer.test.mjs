import assert from 'node:assert/strict';
import { test } from 'node:test';
import { emptyTrainerState, parseTrainerState, trainerLocalRequest, trainerAnswerKey, mergeTrainerStates } from '../lib/intensivtrainer.ts';

test('Intensivtrainer backups preserve German text and stay separate from the Arbeitsbuch', () => {
  const draft = emptyTrainerState(); draft.page = 83;
  draft.answers[trainerAnswerKey(4, '1a', '1')] = 'Aussicht, süßlich, genießen';
  draft.notes['4'] = 'Mein persönlicher Satz'; draft.review['4:1a'] = 'again'; draft.extra['4:1a'] = 2;
  assert.deepEqual(parseTrainerState(JSON.parse(JSON.stringify(draft))), draft);
  assert.throws(() => parseTrainerState({ ...draft, book: 'aspekte-neu-b2' }));
  assert.throws(() => parseTrainerState({ ...draft, version: 2 }));
});
test('malformed imports fail before returning replacement state', () => {
  const draft = emptyTrainerState();
  for (const patch of [{ page: 3 }, { page: 84 }, { page: 4.5 }, { answers: [] }, { answers: { '__proto__:x:y': 'unsafe' } }, { answers: { '4:1:1': 'x'.repeat(20001) } }, { notes: { 99: 'wrong page' } }, { review: { '4:1': 'correct' } }, { extra: { '4:1': 31 } }]) assert.throws(() => parseTrainerState({ ...draft, ...patch }));
  assert.deepEqual(draft.answers, {});
});
test('private trainer refuses production and remote access regardless of workbook feature settings', () => {
  for (const environment of ['production', 'test', undefined]) assert.equal(trainerLocalRequest('http://localhost:3000/a', new Headers(), environment), false);
  for (const hostname of ['example.com', 'localhost.example.com', '192.168.1.2']) assert.equal(trainerLocalRequest(`http://${hostname}/a`, new Headers(), 'development'), false);
  for (const hostname of ['localhost', '127.0.0.1', '[::1]']) assert.equal(trainerLocalRequest(`http://${hostname}:3000/a`, new Headers({ Host: `${hostname}:3000`, Origin: `http://${hostname}:3000` }), 'development'), true);
});
test('cross-site requests, sibling origins and inconsistent hosts cannot read the scan', () => {
  const url = 'http://localhost:3000/a';
  for (const headers of [{ Origin: 'https://example.com' }, { Origin: 'http://localhost:3001' }, { Host: 'example.com' }, { 'X-Forwarded-Host': 'example.com' }, { 'Sec-Fetch-Site': 'cross-site' }, { 'Sec-Fetch-Site': 'same-site' }]) assert.equal(trainerLocalRequest(url, new Headers(headers), 'development'), false);
  assert.equal(trainerLocalRequest(url, new Headers({ 'Sec-Fetch-Site': 'same-origin' }), 'development'), true);
});

test('Next development host normalization preserves the original loopback origin', () => {
  assert.equal(trainerLocalRequest('http://localhost:3002/a',new Headers({Host:'localhost:3002','X-Forwarded-Host':'127.0.0.1:3002',Origin:'http://127.0.0.1:3002','Sec-Fetch-Site':'same-origin'}),'development'),true);
  assert.equal(trainerLocalRequest('http://localhost:3002/a',new Headers({Host:'localhost:3002','X-Forwarded-Host':'127.0.0.1:3003',Origin:'http://127.0.0.1:3003'}),'development'),false);
});


test('independent device edits merge while shared edits remain explicit', () => {
  const base=emptyTrainerState(),local=structuredClone(base),remote=structuredClone(base);
  local.answers['4:1a:1']='local answer';remote.notes['4']='remote note';remote.answers['4:1a:2']='remote answer';
  const merged=mergeTrainerStates(base,local,remote);assert.deepEqual(merged.conflicts,[]);
  assert.equal(merged.state.notes['4'],'remote note');assert.equal(merged.state.answers['4:1a:1'],'local answer');
  remote.answers['4:1a:1']='other device';
  assert.deepEqual(mergeTrainerStates(base,local,remote).conflicts,['answers:4:1a:1']);
  assert.equal(mergeTrainerStates(base,local,remote,'local').state.answers['4:1a:1'],'local answer');
  assert.equal(mergeTrainerStates(base,local,remote,'remote').state.answers['4:1a:1'],'other device');
  assert.equal(mergeTrainerStates(base,local,remote,'local').state.notes['4'],'remote note');
});


test('previous attempts retain their task scope and merge across devices', () => {
  const base=emptyTrainerState(),local=structuredClone(base),remote=structuredClone(base);
  const archive={id:'attempt-local-123',at:'2026-10-26T12:00:00Z',page:4,exercise:'1a',answers:{'4:1a:1':'die Aussicht'}};
  local.history=[archive];remote.history=[{...archive,id:'attempt-remote-123',answers:{'4:1a:2':'der Duft'}}];
  const merged=mergeTrainerStates(base,local,remote);
  assert.equal(parseTrainerState(merged.state).history.length,2);
  assert.throws(()=>parseTrainerState({...local,history:[{...archive,answers:{'5:1a:1':'wrong scope'}}]}));
  assert.throws(()=>parseTrainerState({...local,history:Array(301).fill(archive)}));
});
