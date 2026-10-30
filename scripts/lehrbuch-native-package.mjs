import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const token=/\{\{([^}#]+)(?:#\d+)?\}\}/g;
export async function collectLehrbuchNative(root){
 const files=[],figures=new Set(),ids=new Set();let exercises=0,fields=0,inline=0;
 const add=async(path,type)=>{const data=await readFile(join(root,path));if(!data.length||data.length>5000000)throw new Error(`Invalid private source size: ${path}`);files.push({path,type,data,sha256:createHash('sha256').update(data).digest('hex')});return data;};
 const blocks=(list,fieldIds)=>{for(const b of list){if(b.type==='figure'){if(!/^p[1-9]\d{0,2}-f[1-9]\d?$/.test(b.asset))throw new Error('Unexpected illustration asset');figures.add(b.asset);}const text=(b.text||'')+' '+(b.rows||[]).flat().join(' ');for(const m of text.matchAll(token)){if(!fieldIds.has(m[1]))throw new Error('Inline answer has no field');inline++;}}};
 const id=value=>{if(!uuid.test(value)||ids.has(value))throw new Error('Unstable or repeated learning-data id');ids.add(value);};
 for(let n=1;n<=202;n++){
  const page=JSON.parse((await add(`native/v1/${String(n).padStart(3,'0')}.json`,'application/json')).toString());
  if(page.nativeVersion!==1||page.pdfPage!==n||page.bookPage!==n-1)throw new Error('Unexpected native page identity');
  const shouldHaveTasks=n>=10&&n<=168&&!([0,13].includes((n-9)%16));
  if(shouldHaveTasks&&!page.exercises.length)throw new Error(`Missing source tasks on PDF page ${n}`);
  blocks(page.content,new Set());const exerciseIds=new Set();
  for(const e of page.exercises){
   if(exerciseIds.has(e.id)||!e.fields.length)throw new Error('Missing or repeated source exercise');exerciseIds.add(e.id);exercises++;
   const fieldIds=new Set(e.fields.map(f=>f.id));if(fieldIds.size!==e.fields.length)throw new Error('Repeated answer field');
   for(const f of e.fields){if(f.evaluation!=='review'||f.answers?.length)throw new Error('An unverified answer key cannot be published');id(page.entryIds[`${n-1}:${e.id}:${f.id}`]);fields++;}
   const notes=page.exerciseNotes[e.id];for(const role of ['question','reflection','review'])id(notes[role]);
   blocks(e.content||[],fieldIds);
  }
  if(Object.keys(page.entryIds).length!==page.exercises.reduce((s,e)=>s+e.fields.length,0))throw new Error('Orphan answer binding');
 }
 const manifest=JSON.parse((await add('native/v1/manifest.json','application/json')).toString());
 if(manifest.pages.length!==202||manifest.exercises!==exercises||manifest.fields!==fields)throw new Error('Manifest differs from source pages');
 for(const name of [...figures].sort())await add(`figures/v1/${name}.jpg`,'image/jpeg');
 return {files,stats:{pages:202,exercises,fields,inline,figures:figures.size,files:files.length,bytes:files.reduce((s,f)=>s+f.data.length,0)}};
}
