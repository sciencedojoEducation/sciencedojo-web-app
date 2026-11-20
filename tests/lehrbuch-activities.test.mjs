import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {inspectActivityPage} from '../scripts/audit-lehrbuch-activities.mjs';
function fixture(){
 const key='81:3b:section-1';const b=createHash('sha256').update(`sciencedojo-lehrbuch-v1:answer:${key}`).digest().subarray(0,16);b[6]=b[6]&15|64;b[8]=b[8]&63|128;const h=b.toString('hex');
 return {bookPage:81,exercises:[{id:'3b',fields:[{id:'section-1',options:[],evaluation:'review'}],content:[{type:'table',rows:[['First section','{{section-1}}']]}]}],entryIds:{[key]:`${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`}};
}
const inventory={sourceReviewed:true,expectedExercises:['3b'],expectedResponses:1,sourceChecks:'Independent synthetic source has one question in one section.'};
test('a page with an exercise still fails when a source question or activity is absent',()=>{
 const p=fixture();assert.deepEqual(inspectActivityPage(p,inventory).errors,[]);
 assert.ok(inspectActivityPage(p,{...inventory,expectedResponses:2}).errors.some(e=>e.code==='source-response-coverage'));
 assert.ok(inspectActivityPage(p,{...inventory,expectedExercises:['3a','3b']}).errors.some(e=>e.code==='source-activity-coverage'));
 assert.equal(inspectActivityPage(p,undefined).sourceReviewed,false);
});
test('two sections cannot accidentally write to the same answer control',()=>{
 const p=fixture();p.exercises[0].content.push({type:'text',text:'Second section {{section-1}}'});
 assert.ok(inspectActivityPage(p,inventory).errors.some(e=>e.code==='shared-response-control'));
});
test('parts of an explicitly segmented answer are distinct but cannot mix with a full control',()=>{
 const p=fixture();p.exercises[0].fields[0].segments=2;p.exercises[0].content=[{type:'text',text:'{{section-1#1}} / {{section-1#2}}'}];
 assert.deepEqual(inspectActivityPage(p,inventory).errors,[]);
 p.exercises[0].content[0].text+=' {{section-1}} {{section-1#3}}';const codes=inspectActivityPage(p,inventory).errors.map(e=>e.code);
 assert.ok(codes.includes('mixed-response-control'));assert.ok(codes.includes('invalid-segment'));
});
test('renaming or retiring existing answers requires stable bindings and an explicit preservation record',()=>{
 const old=fixture(),p=fixture();p.entryIds['81:3b:section-1']='10000000-0000-4000-8000-000000000000';
 assert.ok(inspectActivityPage(p,inventory,old).errors.some(e=>e.code==='changed-previous-binding'));
 p.exercises=[];p.entryIds={};let result=inspectActivityPage(p,{...inventory,expectedExercises:[],expectedResponses:0},old);
 assert.ok(result.errors.some(e=>e.code==='unexplained-retired-field'));
 result=inspectActivityPage(p,{...inventory,expectedExercises:[],expectedResponses:0,retiredFields:{'81:3b:section-1':'Ambiguous old response remains in page notes and journal.'}},old);
 assert.deepEqual(result.errors,[]);assert.equal(result.retired[0].id,old.entryIds['81:3b:section-1']);
});
test('changing existing choices requires a source-based meaning review',()=>{
 const old=fixture(),p=fixture();p.exercises[0].fields[0].options=['A','B'];
 assert.ok(inspectActivityPage(p,inventory,old).errors.some(e=>e.code==='unreviewed-choice-change'));
 assert.deepEqual(inspectActivityPage(p,{...inventory,choiceChanges:{'81:3b:section-1':'Source supplies A/B; earlier free text stays visible.'}},old).errors,[]);
});
