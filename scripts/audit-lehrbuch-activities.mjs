import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const token=/\{\{([^}#]+)(?:#(\d+))?\}\}/g;
function stableAnswer(key){
 const bytes=createHash('sha256').update(`sciencedojo-lehrbuch-v1:answer:${key}`).digest().subarray(0,16);
 bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
 const h=bytes.toString('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}

// Expected activity IDs/counts are authored from the original page, never inferred
// from the generated native page. Structural checks alone cannot prove coverage.
export function inspectActivityPage(page,expected,baseline){
 const errors=[],retired=[],changedChoices=[];const prefix=String(page.bookPage);
 const fail=(code,detail)=>errors.push({page:page.bookPage,code,detail});
 const keys=new Set(),exerciseIds=new Set();
 for(const exercise of page.exercises){
  if(exerciseIds.has(exercise.id))fail('duplicate-exercise',exercise.id);exerciseIds.add(exercise.id);
  const fields=new Map();
  for(const field of exercise.fields){
   if(fields.has(field.id))fail('duplicate-field',`${exercise.id}:${field.id}`);fields.set(field.id,field);
   const key=`${prefix}:${exercise.id}:${field.id}`;keys.add(key);
   if(page.entryIds[key]!==stableAnswer(key))fail('changed-binding',key);
   if(baseline?.entryIds[key]&&baseline.entryIds[key]!==page.entryIds[key])fail('changed-previous-binding',key);
   const oldField=baseline?.exercises.find(e=>e.id===exercise.id)?.fields.find(f=>f.id===field.id);
   if(oldField&&JSON.stringify([oldField.options,oldField.optionLabels])!==JSON.stringify([field.options,field.optionLabels])){
    changedChoices.push(key);
    if(!expected?.choiceChanges?.[key])fail('unreviewed-choice-change',key);
   }
  }
  const seen=new Set();
  for(const block of exercise.content||[]){
   for(const text of [block.text||'',...(block.rows||[]).flat()])for(const match of text.matchAll(token)){
    const reference=match[1]+(match[2]?`#${match[2]}`:'');const key=`${exercise.id}:${reference}`;
    if(seen.has(reference))fail('shared-response-control',key);seen.add(reference);
    const field=fields.get(match[1]);
    if(!field)fail('missing-field',key);
    else if(match[2]&&(!field.segments||Number(match[2])<1||Number(match[2])>field.segments))fail('invalid-segment',key);
   }
  }
  for(const reference of seen)if(reference.includes('#')&&seen.has(reference.split('#')[0]))fail('mixed-response-control',`${exercise.id}:${reference}`);
 }
 if(Object.keys(page.entryIds).some(key=>!keys.has(key)))fail('orphan-binding','Unexpected entry binding');
 if(expected?.sourceReviewed){
  const actual=page.exercises.map(e=>e.id);
  if(JSON.stringify(actual)!==JSON.stringify(expected.expectedExercises))fail('source-activity-coverage','Exercise IDs/order differ from source inventory');
  const count=page.exercises.reduce((n,e)=>n+e.fields.length,0);
  if(count!==expected.expectedResponses)fail('source-response-coverage',`Expected ${expected.expectedResponses}; found ${count}`);
  if(!expected.sourceChecks?.trim())fail('missing-source-evidence','Reviewed page needs a source comparison record');
 }
 if(baseline)for(const [key,id] of Object.entries(baseline.entryIds))if(!keys.has(key)){
  const reason=expected?.retiredFields?.[key];retired.push({key,id,reason:reason||''});
  if(!reason)fail('unexplained-retired-field',key);
 }
 return {errors,retired,changedChoices,sourceReviewed:!!expected?.sourceReviewed};
}

export async function auditActivities(root,inventory,baselineRoot){
 const report={pages:202,sourceReviewed:0,pendingSourcePages:[],pendingLayoutPages:[],errors:[],retired:[],changedChoices:[],complete:false};
 for(let i=1;i<=202;i++){
  const file=`${String(i).padStart(3,'0')}.json`;
  const page=JSON.parse(await readFile(join(root,'native/v1',file),'utf8'));
  const baseline=baselineRoot?JSON.parse(await readFile(join(baselineRoot,file),'utf8')):undefined;
  if(page.pdfPage!==i||page.bookPage!==i-1)report.errors.push({page:i-1,code:'page-identity',detail:'Wrong source page'});
  const result=inspectActivityPage(page,inventory.pages[String(i-1)],baseline);
  if(result.sourceReviewed)report.sourceReviewed++;else report.pendingSourcePages.push(i-1);
  if(inventory.pages[String(i-1)]?.layoutStatus==='pending')report.pendingLayoutPages.push(i-1);
  for(const key of ['errors','retired','changedChoices'])report[key].push(...result[key]);
 }
 report.complete=report.sourceReviewed===202&&!report.errors.length&&!report.pendingLayoutPages.length;
 return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const args=process.argv.slice(2),value=name=>args[args.indexOf(name)+1];
 const root=resolve(args.includes('--root')?value('--root'):'private-materials/aspekte-neu-b2-lehrbuch/derived');
 const inventory=JSON.parse(await readFile(args.includes('--inventory')?value('--inventory'):join(root,'source-activity-audit-2026-11-20.json'),'utf8'));
 const report=await auditActivities(root,inventory,args.includes('--baseline')?resolve(value('--baseline')):undefined);
 if(args.includes('--report'))await writeFile(value('--report'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({pages:report.pages,sourceReviewed:report.sourceReviewed,pending:report.pendingSourcePages.length,pendingLayouts:report.pendingLayoutPages.length,errors:report.errors.length,retiredFields:report.retired.length,complete:report.complete}));
 if(report.errors.length||args.includes('--require-complete')&&!report.complete)process.exitCode=1;
}
