import assert from 'node:assert/strict';
import {test} from 'node:test';
import {answerSoundsMuted,setAnswerSoundsMuted,subscribeAnswerSounds,playAnswerSound} from '../lib/academy-answer-sounds.ts';
test('sound stays optional, works offline and never breaks checking in unsupported browsers',()=>{
 assert.doesNotThrow(()=>playAnswerSound('correct'));
 const events=new EventTarget();let stored=null;let readsBlocked=false;let contexts=0;const tones=[];
 globalThis.window={localStorage:{getItem(){if(readsBlocked)throw Error('blocked');return stored},setItem(k,v){if(readsBlocked)throw Error('blocked');stored=v}},addEventListener:events.addEventListener.bind(events),removeEventListener:events.removeEventListener.bind(events),dispatchEvent:events.dispatchEvent.bind(events)};
 const parameter=()=>({setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},cancelScheduledValues(){},setTargetAtTime(){}});
 globalThis.AudioContext=class {
  constructor(){contexts++;this.currentTime=0;this.state='running';this.destination={};}
  createGain(){return {gain:parameter(),connect(){},disconnect(){}};}
  createOscillator(){const tone={frequency:{setValueAtTime(v){tone.hz=v}},connect(){},disconnect(){},start(){tones.push(tone)},stop(){}};return tone;}
 };
 let notifications=0;const unsubscribe=subscribeAnswerSounds(()=>notifications++);
 try{
  playAnswerSound('correct');assert.equal(contexts,1);assert.equal(tones.length,3);assert.ok(tones[0].hz<tones[2].hz);
  playAnswerSound('retry');assert.equal(contexts,1);assert.equal(tones.length,5);assert.ok(tones[3].hz>tones[4].hz);
  setAnswerSoundsMuted(true);assert.equal(answerSoundsMuted(),true);assert.equal(stored,'true');
  playAnswerSound('correct');assert.equal(tones.length,5);
  setAnswerSoundsMuted(false);playAnswerSound('retry');assert.equal(tones.length,7);
  readsBlocked=true;setAnswerSoundsMuted(true);assert.equal(answerSoundsMuted(),true);playAnswerSound('correct');assert.equal(tones.length,7);
  assert.equal(notifications,3);unsubscribe();setAnswerSoundsMuted(false);assert.equal(notifications,3);
  playAnswerSound('select');assert.equal(tones.length,8);
  playAnswerSound('complete');assert.equal(tones.length,12);assert.ok(tones[8].hz<tones[11].hz);
  setAnswerSoundsMuted(true);playAnswerSound('select');playAnswerSound('complete');assert.equal(tones.length,12);
 }finally{unsubscribe();delete globalThis.window;delete globalThis.AudioContext;}
});


test('suspended audio waits for resume; muting cancels a queued chime',async()=>{
 const sound=await import('../lib/academy-answer-sounds.ts?resume-test');
 let finishResume;let starts=0;
 const events=new EventTarget();
 globalThis.window={localStorage:{getItem(){return null},setItem(){}},addEventListener:events.addEventListener.bind(events),removeEventListener:events.removeEventListener.bind(events),dispatchEvent:events.dispatchEvent.bind(events)};
 const parameter=()=>({setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},cancelScheduledValues(){},setTargetAtTime(){}});
 let audio;
 class FakeAudioContext {
  constructor(){this.currentTime=0;this.state='suspended';this.destination={};}
  resume(){return new Promise(resolve=>{finishResume=()=>{this.state='running';resolve();};});}
  createGain(){return {gain:parameter(),connect(){},disconnect(){}};}
  createOscillator(){return {frequency:parameter(),connect(){},disconnect(){},start(){starts++;},stop(){}};}
 }
 globalThis.AudioContext=function(){audio=new FakeAudioContext();return audio;};
 try{
  const queued=sound.playAnswerSound('correct');assert.equal(starts,0);finishResume();await queued;assert.equal(starts,3);
  audio.state='suspended';const cancelled=sound.playAnswerSound('retry');sound.setAnswerSoundsMuted(true);finishResume();await cancelled;assert.equal(starts,3);
  sound.setAnswerSoundsMuted(false);await sound.playAnswerSound('retry');assert.equal(starts,5);
  audio.state='suspended';const older=sound.playAnswerSound('correct');const finishOlder=finishResume;const newer=sound.playAnswerSound('retry');finishOlder();finishResume();await Promise.all([older,newer]);assert.equal(starts,7);
 }finally{delete globalThis.window;delete globalThis.AudioContext;}
});
