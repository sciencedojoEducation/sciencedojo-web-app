import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createInputDispatcher} from '../lib/campus/input-dispatch.ts';
function fixture(){
 let time=0,next=0,input={x:0,z:0,run:false,jump:false,stance:'stand'};const tasks=new Map(),sent=[];
 const dispatcher=createInputDispatcher(()=>input,value=>{sent.push({at:time,...value});input={...input,jump:false};},{now:()=>time,later:(fn,ms)=>{const id=++next;tasks.set(id,{fn,at:time+ms});return id;},cancel:id=>tasks.delete(id)});
 const advance=at=>{while(true){const due=[...tasks].filter(([,v])=>v.at<=at).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;tasks.delete(due[0]);time=due[1].at;due[1].fn();}time=at;};
 return {dispatcher,sent,advance,set:value=>{input=value;},get tasks(){return tasks.size;}};
}
test('idle input does not consume slots; starts, stops and reversal flush within 50ms with newest intent',()=>{
 const f=fixture();f.dispatcher.request();for(let at=100;at<=1000;at+=100){f.advance(at);f.dispatcher.request();}assert.equal(f.sent.length,1);
 f.advance(1010);f.set({x:1,z:0});f.dispatcher.request();assert.equal(f.sent.at(-1).at,1010);
 f.advance(1020);f.set({x:0,z:0});f.dispatcher.request();f.advance(1030);f.set({x:-1,z:0});f.dispatcher.request();
 f.advance(1059);assert.equal(f.sent.at(-1).x,1);f.advance(1060);assert.equal(f.sent.at(-1).x,-1);assert.equal(f.tasks,0);
 f.advance(1070);f.set({x:0,z:0});f.dispatcher.request();f.advance(1110);assert.equal(f.sent.at(-1).x,0);
});
test('held input refreshes before the stale-input deadline and noisy changes stay bounded',()=>{
 const f=fixture();f.set({x:1,z:0});f.dispatcher.request();for(let at=100;at<=1000;at+=100){f.advance(at);f.dispatcher.request();}assert.equal(f.sent.length,11);
 for(let at=1001;at<2000;at++){f.advance(at);f.set({x:at%2?1:-1,z:0});f.dispatcher.request();}f.advance(2050);
 assert(f.sent.every((v,i)=>!i||v.at-f.sent[i-1].at>=50));assert(f.sent.filter(v=>v.at>=1000&&v.at<2000).length<=20);
});
test('a queued jump is read at send time, while pause/disposal cancels stale movement',()=>{
 const f=fixture();f.dispatcher.request();f.advance(10);f.set({x:1,z:0,jump:true});f.dispatcher.request();f.advance(50);assert.equal(f.sent.at(-1).jump,true);
 f.advance(60);f.set({x:0,z:0,jump:false});f.dispatcher.request();f.advance(100);assert.equal(f.sent.at(-1).x,0);
 f.advance(110);f.set({x:1,z:0});f.dispatcher.request();f.dispatcher.dispose();f.advance(500);assert.equal(f.sent.at(-1).x,0);assert.equal(f.tasks,0);
});
