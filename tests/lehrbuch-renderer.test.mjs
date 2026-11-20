import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import * as workbook from '../lib/aspekte-workbook.ts';
const require=createRequire(import.meta.url);
const exports={};
const modules={react:React,'react/jsx-runtime':require('react/jsx-runtime'),'lucide-react':require('lucide-react'),'@/lib/aspekte-workbook':workbook,'./WorkbookRecorder':{default:()=>null},'./WorkbookMarkers':{default:()=>null},'@/lib/workbook-recording-client':{},'@/utils/supabase/client':{}};
runInNewContext(ts.transpileModule(await readFile(new URL('../components/workbook/NativeWorkbookExercise.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require:name=>{assert.ok(name in modules,name);return modules[name];}});
const field=(id,extra={})=>({id,label:`Question ${id}`,options:[],evaluation:'review',multiline:false,...extra});
const exercise=(fields,extra={})=>({id:'quiz',instruction:'Synthetic source quiz',mode:'fill',fields,content:[],wordBank:[],checklist:[],...extra});
function render(e,extra={}){return renderToStaticMarkup(React.createElement(exports.default,{exercise:e,page:72,answers:{},results:{},onAnswer:()=>{},bank:null,setBank:()=>{},feedbackAvailable:false,activeTrack:0,playing:false,onTrack:()=>{},onReference:()=>{},onExam:()=>{},onQueue:()=>{},recordingScope:'preview:lehrbuch',cloudRecordings:false,onFocusExercise:()=>{},queued:false,onFeedbackSaved:()=>{},onRetryExercise:()=>{},showFeedback:false,...extra}));}
test('source quiz cards keep illustration, own question label and all choices together',()=>{
 const html=render(exercise([field('one',{illustration:{asset:'p73-f50',alt:'Synthetic source diagram'},options:['a','b','c'],optionLabels:{a:'Choice A',b:'Choice B',c:'Choice C'}})],{layout:'cards'}));
 assert.match(html,/wb-exercise-cards/);assert.match(html,/Synthetic source diagram/);assert.match(html,/assets\/figure\/p73-f50/);
 for(const text of ['Question one','Choice A','Choice B','Choice C'])assert.ok(html.includes(text));
 assert.equal((html.match(/aria-pressed="false"/g)||[]).length,3);
});
test('authored short fields stay short in Lehrbuch while other workbook defaults stay compatible',()=>{
 const e=exercise([field('number'),field('draft',{multiline:true})]);
 const html=render(e,{respectFieldSize:true});assert.match(html,/<input[^>]+id="72:quiz:number"/);assert.match(html,/<textarea[^>]+id="72:quiz:draft"/);
 assert.match(render(e),/<textarea[^>]+id="72:quiz:number"/);
});
test('saved free text remains visible after a source field gains choices',()=>{
 const e=exercise([field('heading',{options:['A','B']})],{content:[{type:'text',text:'Paragraph {{heading}}'}]});
 const html=render(e,{answers:{'72:quiz:heading':'My earlier heading <kept>'}});
 assert.match(html,/Deine gespeicherte Antwort/);assert.match(html,/My earlier heading &lt;kept&gt;/);
 assert.doesNotMatch(html,/<p class="wb-previous-answer"/);
 const valid=render(e,{answers:{'72:quiz:heading':'A'}});assert.doesNotMatch(valid,/wb-previous-answer/);
});
test('responsive grammar tables retain captions, column labels and separate section controls',()=>{
 const e=exercise([field('section1'),field('section2')],{content:[{type:'table',title:'Synthetic source table',responsive:true,headers:['Section','Answer'],rows:[['First','{{section1}}'],['Second','{{section2}}']]}]});
 const html=render(e);assert.match(html,/<caption>Synthetic source table<\/caption>/);assert.match(html,/wb-responsive-table/);assert.match(html,/data-label="Answer"/);assert.match(html,/scope="col"/);
 for(const id of ['section1','section2'])assert.equal((html.match(new RegExp(`id="72:quiz:${id}"`,'g'))||[]).length,1);
});
test('multiple source choices show selected responses independently and preserve an earlier non-code answer',()=>{
 const html=render(exercise([field('topics',{options:['A','B','C'],multiple:true})]),{answers:{'72:quiz:topics':'A\nC\nEarlier notes'}});
 assert.equal((html.match(/aria-pressed="true"/g)||[]).length,2);assert.match(html,/Earlier notes/);
});
test('unnumbered source templates hide internal task IDs while retaining their answer bindings',()=>{
 const html=render(exercise([field('name')],{id:'person',sourceLabel:'',instruction:'Portrait template'}));
 assert.doesNotMatch(html,/wb-exercise-number/);assert.match(html,/id="72:person:name"/);assert.match(html,/Portrait template/);
});
