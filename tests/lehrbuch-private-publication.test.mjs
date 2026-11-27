import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {publicationOrder,publishPrivateObjects,verifyPrivateObject} from '../scripts/lehrbuch-private-publication.mjs';

const data=Buffer.from('synthetic private source');
const file={path:'native/v1/073.json',data,sha256:createHash('sha256').update(data).digest('hex')};
const config={url:'https://storage.example.test',key:'synthetic-credential',object:`aspekte-neu-b2-lehrbuch/${file.path}`,file,wait:async()=>{}};

test('private publication orders figures before pages and manifest last without mutating input',()=>{
 const paths=['native/v1/manifest.json','native/v1/073.json','figures/v1/p73-f50.jpg'];
 const files=paths.map(path=>({path}));
 assert.deepEqual(publicationOrder(files).map(f=>f.path),[paths[2],paths[1],paths[0]]);
 assert.deepEqual(files.map(f=>f.path),paths);
});

test('verification retries a stale body with independent uncached authenticated requests',async()=>{
 const calls=[];
 const result=await verifyPrivateObject({...config,fetcher:async(url,options)=>{
  calls.push({url:String(url),options});return new Response(calls.length===1?'old source':data);
 }});
 assert.equal(result.attempts,2);
 assert.notEqual(calls[0].url,calls[1].url);
 for(const call of calls){assert.equal(call.options.cache,'no-store');assert.equal(call.options.headers.Authorization,'Bearer synthetic-credential');assert.ok(call.options.signal);}
});

test('persistent hash mismatch fails after three attempts with hashes and no credentials',async()=>{
 let reads=0;
 await assert.rejects(verifyPrivateObject({...config,fetcher:async()=>{reads++;return new Response('wrong');}}),error=>{
  assert.match(error.message,/073.json: expected SHA-256/);assert.doesNotMatch(error.message,/synthetic-credential/);return true;
 });
 assert.equal(reads,3);
});

test('transient HTTP failures are bounded and authorization failures stop immediately',async()=>{
 for(const [status,expected] of [[503,3],[403,1]]){
  let reads=0;
  await assert.rejects(verifyPrivateObject({...config,fetcher:async()=>{reads++;return new Response(null,{status});}}),new RegExp(`HTTP ${status}`));
  assert.equal(reads,expected);
 }
});

test('failed figure verification prevents publishing dependent pages or manifest',async()=>{
 const uploaded=[];
 await assert.rejects(publishPrivateObjects({files:[file,{path:'native/v1/manifest.json'},{path:'figures/v1/p73-f50.jpg'}],upload:async f=>uploaded.push(f.path),verify:async()=>{throw Error('mismatch');}}),/mismatch/);
 assert.deepEqual(uploaded,['figures/v1/p73-f50.jpg']);
});
