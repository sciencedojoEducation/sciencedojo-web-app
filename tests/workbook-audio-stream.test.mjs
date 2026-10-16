import assert from 'node:assert/strict';
import {test} from 'node:test';
import {workbookAudioStream} from '../lib/workbook-audio-stream.ts';
import {workbookPlaybackError} from '../lib/workbook-audio-player.ts';

test('mobile audio probe stays on the workbook origin and returns an exact partial stream',async()=>{
 const upstream=new Response(new Uint8Array([0,1]),{status:206,headers:{'Content-Range':'bytes 0-1/1000','Content-Length':'2','Cache-Control':'public,max-age=3600'}});
 const response=workbookAudioStream(upstream);
 assert.equal(response.status,206);assert.equal(response.headers.get('content-range'),'bytes 0-1/1000');assert.equal(response.headers.get('content-length'),'2');assert.equal(response.headers.get('accept-ranges'),'bytes');assert.equal(response.headers.get('content-type'),'audio/mp4');assert.equal(response.headers.get('location'),null);assert.match(response.headers.get('cache-control'),/private, no-store/);assert.deepEqual([...new Uint8Array(await response.arrayBuffer())],[0,1]);
});
test('full audio streams and HEAD metadata preserve lengths without exposing storage headers',async()=>{
 const full=workbookAudioStream(new Response('audio',{headers:{'Content-Length':'5','X-Private-Storage-Path':'not-for-the-browser'}}));
 assert.equal(full.status,200);assert.equal(await full.text(),'audio');assert.equal(full.headers.get('x-private-storage-path'),null);
 const head=workbookAudioStream(new Response(null,{headers:{'Content-Length':'1234'}}));assert.equal(head.headers.get('content-length'),'1234');assert.equal(await head.text(),'');
 const decoded=workbookAudioStream(new Response('audio',{headers:{'Content-Length':'3','Content-Encoding':'gzip'}}));assert.equal(decoded.headers.get('content-length'),null);
});
test('unavailable storage and malformed ranges never become misleading audio responses',async()=>{
 const missing=workbookAudioStream(new Response('private storage details',{status:403}));assert.equal(missing.status,502);assert.equal(await missing.text(),'');
 const broken=workbookAudioStream(new Response('bad',{status:206}));assert.equal(broken.status,502);
 const unsatisfiable=workbookAudioStream(new Response('range error',{status:416,headers:{'Content-Range':'bytes */1000'}}));assert.equal(unsatisfiable.status,416);assert.equal(unsatisfiable.headers.get('content-range'),'bytes */1000');assert.equal(await unsatisfiable.text(),'');
});
test('playback errors distinguish a required tap, a network failure and unsupported media',()=>{
 assert.match(workbookPlaybackError({name:'NotAllowedError'}),/playback tap/);
 assert.match(workbookPlaybackError(null,{code:2}),/connection/);
 assert.match(workbookPlaybackError(null,{code:3}),/decode/);
 assert.match(workbookPlaybackError(null,{code:4}),/unavailable or unsupported/);
});
