import {createClient} from '@supabase/supabase-js';
import {readFile,stat} from 'node:fs/promises';
import {join} from 'node:path';
const apply=process.argv.includes('--apply');
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key)throw new Error('Configured ScienceDojo Supabase server credentials are required.');
const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const {data:bucket,error}=await client.storage.getBucket('private-workbooks');
if(error||!bucket||bucket.public!==false)throw new Error('The existing private workbook bucket could not be confirmed.');
const root=join(process.cwd(),'private-materials/aspekte-neu-b2-lehrbuch/derived/pages');
const files=Array.from({length:202},(_,i)=>`page-${String(i+1).padStart(3,'0')}.jpg`);
let bytes=0;for(const name of files){const s=await stat(join(root,name));if(s.size<1000||s.size>5000000)throw new Error('Unexpected source page size.');bytes+=s.size;}
console.log(JSON.stringify({privateBucket:true,files:files.length,bytes,apply}));
if(apply){for(const name of files){const data=await readFile(join(root,name));const {error}=await client.storage.from('private-workbooks').upload(`aspekte-neu-b2-lehrbuch/pages/${name}`,data,{contentType:'image/jpeg',upsert:true,cacheControl:'0'});if(error)throw new Error(`Private source upload failed for ${name}.`);}console.log('Uploaded 202 source pages to the isolated private textbook prefix. No learner data uploaded.');}
