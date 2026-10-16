import assert from 'node:assert/strict';
import {test} from 'node:test';
import {signWorkbookRecordingTicket,readWorkbookRecordingTicket,WORKBOOK_RECORDING_LIMIT} from '../lib/workbook-recording-ticket.ts';
import {uploadWorkbookRecording,prepareWorkbookRecordingUpload} from '../lib/workbook-recording-client.ts';
const secret='disposable-test-secret',now=1_800_000_000_000;
const payload={user:'11111111-1111-4111-8111-111111111111',exercise:'16:a',run:'initial',path:'11111111-1111-4111-8111-111111111111/aspekte-neu-b2/22222222-2222-4222-8222-222222222222.m4a',mime:'audio/mp4',bytes:WORKBOOK_RECORDING_LIMIT,previous:null,purpose:'account'};
test('upload authorization preserves exact account, exercise, attempt, size and prior version, with ten-minute expiry',()=>{
 const token=signWorkbookRecordingTicket(payload,secret,now);
 assert.deepEqual(readWorkbookRecordingTicket(token,secret,now),{...payload,expires:now+600_000});
 assert.equal(readWorkbookRecordingTicket(token,secret,now+600_000),null);
 assert.ok(readWorkbookRecordingTicket(token,secret,now+600_000,true),'expired signed ticket remains usable only for owner-bound cleanup');
 assert.equal(readWorkbookRecordingTicket(token,'another-key',now),null);
});
test('altered claims, missing signatures, oversize files and mismatched object owners or MIME extensions are rejected',()=>{
 const token=signWorkbookRecordingTicket(payload,secret,now),[body,mac]=token.split('.');
 const changed=JSON.parse(Buffer.from(body,'base64url'));changed.run='new-attempt';
 assert.equal(readWorkbookRecordingTicket(Buffer.from(JSON.stringify(changed)).toString('base64url')+'.'+mac,secret,now),null);
 for(const value of [token+'.extra',body+'.',body+'.short','',null])assert.equal(readWorkbookRecordingTicket(value,secret,now),null);
 for(const change of [{bytes:WORKBOOK_RECORDING_LIMIT+1},{bytes:0},{bytes:1.5},{path:payload.path.replace('11111111/','99999999/')},{mime:'audio/webm'},{run:''}])assert.equal(readWorkbookRecordingTicket(signWorkbookRecordingTicket({...payload,...change},secret,now),secret,now),null);
});
const grant={path:payload.path,token:'storage-upload-token',ticket:'server-ticket',mime:'audio/mp4'};
function requests(handler){const calls=[];return{calls,request:async(url,init)=>{const body=JSON.parse(init.body);calls.push({url,body});return handler(body)}};}
test('large files go to private storage, while app requests contain only small JSON messages; MIME normalization preserves every byte',async()=>{
 const original=new Blob([new Uint8Array(5*1024*1024).fill(23)],{type:'audio/x-m4a'});
 const{calls,request}=requests(body=>Response.json(body.action==='prepare'?grant:{ok:true}));
 let uploaded=false;
 const saved=await uploadWorkbookRecording('/recordings/upload',original,async(g,file)=>{assert.deepEqual(g,grant);assert.equal(file.type,'audio/mp4');assert.equal(file.size,original.size);assert.deepEqual(await file.arrayBuffer(),await original.arrayBuffer());uploaded=true},request);
 assert.equal(uploaded,true);assert.equal(saved.ok,true);assert.deepEqual(calls.map(c=>c.body.action),['prepare','complete']);
 assert.deepEqual(calls[0].body,{action:'prepare',mime:'audio/x-m4a',bytes:original.size,purpose:'account'});
 assert.ok(calls.every(c=>JSON.stringify(c.body).length<500));
});
test('feedback uploads explicitly use temporary purpose and never finalize an account recording',async()=>{
 const{calls,request}=requests(()=>Response.json(grant));
 const result=await prepareWorkbookRecordingUpload('/upload',new Blob(['answer'],{type:'audio/mp4'}),'feedback',async()=>{},request);
 assert.equal(result.ticket,grant.ticket);assert.equal(calls.length,1);assert.equal(calls[0].body.purpose,'feedback');
 const feedback=signWorkbookRecordingTicket({...payload,purpose:'feedback'},secret,now);assert.equal(readWorkbookRecordingTicket(feedback,secret,now).purpose,'feedback');
});
test('an interrupted storage upload requests cleanup and preserves the local blob',async()=>{
 const original=new Blob(['retained local answer'],{type:'audio/mp4'});
 const{calls,request}=requests(body=>Response.json(body.action==='prepare'?grant:{ok:true}));
 await assert.rejects(uploadWorkbookRecording('/upload',original,async()=>{throw new Error('connection interrupted')},request),/connection interrupted/);
 assert.deepEqual(calls.map(c=>c.body.action),['prepare','cancel']);assert.equal(await original.text(),'retained local answer');
});
test('a lost finalization response never cancels a possibly committed recording; conflict errors remain actionable',async()=>{
 const{calls,request}=requests(body=>{if(body.action==='complete')throw new Error('response lost');return Response.json(grant)});
 await assert.rejects(uploadWorkbookRecording('/upload',new Blob(['answer']),async()=>{},request),/response lost/);
 assert.deepEqual(calls.map(c=>c.body.action),['prepare','complete']);
 const conflict=requests(body=>body.action==='prepare'?Response.json(grant):Response.json({message:'Another device changed the account recording.'},{status:409}));
 await assert.rejects(uploadWorkbookRecording('/upload',new Blob(['answer']),async()=>{},conflict.request),/Another device/);
});
test('a non-JSON hosting failure produces a useful message and does not upload any audio',async()=>{
 let uploaded=false;
 await assert.rejects(uploadWorkbookRecording('/upload',new Blob(['answer']),async()=>{uploaded=true},async()=>new Response('Unavailable',{status:503})),/local recording has not been removed/);
 assert.equal(uploaded,false);
});
