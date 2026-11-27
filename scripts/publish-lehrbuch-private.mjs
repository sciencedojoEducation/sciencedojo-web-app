import {createClient} from '@supabase/supabase-js';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {collectLehrbuchNative} from './lehrbuch-native-package.mjs';
import {publishPrivateObjects,verifyPrivateObject} from './lehrbuch-private-publication.mjs';
const apply=process.argv.includes('--apply'),native=process.argv.includes('--native-only');
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key)throw new Error('Configured ScienceDojo Supabase server credentials are required.');
const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const {data:bucket,error}=await client.storage.getBucket('private-workbooks');
if(error||!bucket||bucket.public!==false)throw new Error('The existing private workbook bucket could not be confirmed.');
const root=join(process.cwd(),'private-materials/aspekte-neu-b2-lehrbuch/derived');
let files,stats;
if(native)({files,stats}=await collectLehrbuchNative(root));
else{
 files=await Promise.all(Array.from({length:202},async(_,i)=>{const path=`pages/page-${String(i+1).padStart(3,'0')}.jpg`,data=await readFile(join(root,path));if(data.length<1000||data.length>5000000)throw new Error('Unexpected source page size.');return{path,type:'image/jpeg',data,sha256:createHash('sha256').update(data).digest('hex')};}));
 stats={files:files.length,bytes:files.reduce((s,f)=>s+f.data.length,0)};
}
console.log(JSON.stringify({privateBucket:true,native,...stats,apply}));
if(apply){
 const objects=await publishPrivateObjects({files,upload:async f=>{
  const object=`aspekte-neu-b2-lehrbuch/${f.path}`;
  const {error}=await client.storage.from('private-workbooks').upload(object,f.data,{contentType:f.type,upsert:true,cacheControl:'0'});if(error)throw new Error(`Private source upload failed for ${f.path}: ${error.message}`);
 },verify:file=>verifyPrivateObject({url,key,object:`aspekte-neu-b2-lehrbuch/${file.path}`,file}),onVerified:(count,total)=>{if(count%50===0)console.log(`Verified ${count}/${total} private source objects.`);}});
 await writeFile(join(root,native?'native-upload-verification.json':'source-upload-verification.json'),JSON.stringify({date:new Date().toISOString(),privateBucket:true,native,stats,verified:objects.length,objects},null,2));
 console.log(`Uploaded and hash-verified ${objects.length} private source objects. No learning data or local OCR uploaded.`);
}
