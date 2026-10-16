import assert from 'node:assert/strict';
import {test} from 'node:test';
import {prepareWorkbookAudio} from '../lib/workbook-audio-player.ts';
function media(){const events=[];const player={paused:true,currentTime:37,error:null,src:'/audio/2',playbackRate:1,pause(){this.paused=true;events.push('pause')},load(){this.currentTime=0;this.error=null;events.push(`load:${this.src}`)}};return{player,events};}
test('switching a numbered speaker stops the current track and discards its pending seek position',()=>{
 const{player,events}=media();player.paused=false;
 const change=prepareWorkbookAudio(player,2,5,'/audio/5',.75);
 assert.deepEqual(events,['pause','load:/audio/5']);assert.equal(change.pause,false);assert.equal(change.resumeAt,0);assert.equal(player.currentTime,0);assert.equal(player.playbackRate,.75);
});
test('tapping the same failed recording reloads its URL and retains the bookmark for metadata loading',()=>{
 const{player,events}=media();player.error={code:2};player.paused=false;
 const retry=prepareWorkbookAudio(player,2,2,'/audio/2',1);
 assert.equal(retry.reloaded,true);assert.equal(retry.resumeAt,37);assert.deepEqual(events,['pause','load:/audio/2']);assert.equal(player.error,null);
});
test('a normal pause and resume does not reload the source or discard its buffered bookmark',()=>{
 const{player,events}=media();player.paused=false;
 const pause=prepareWorkbookAudio(player,2,2,'/audio/2',1);assert.equal(pause.pause,true);assert.deepEqual(events,['pause']);
 const resume=prepareWorkbookAudio(player,2,2,'/audio/2',1.25);assert.equal(resume.pause,false);assert.equal(resume.reloaded,false);assert.equal(resume.resumeAt,undefined);assert.equal(player.currentTime,37);assert.equal(player.playbackRate,1.25);assert.deepEqual(events,['pause']);
});
test('explicit retry restarts a stalled load even before the browser raises a media error',()=>{
 const{player,events}=media();player.paused=false;
 const retry=prepareWorkbookAudio(player,2,2,'/audio/2',1,true);
 assert.equal(retry.pause,false);assert.equal(retry.reloaded,true);assert.equal(retry.resumeAt,37);assert.deepEqual(events,['pause','load:/audio/2']);
});
