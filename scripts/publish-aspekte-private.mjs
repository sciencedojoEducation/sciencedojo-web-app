/** Upload only prepared runtime assets to the existing private Supabase buckets. Dry-run by default. */
import {createClient} from '@supabase/supabase-js';
import {readFile,readdir,stat} from 'node:fs/promises';
import {join} from 'node:path';
const apply=process.argv.includes('--apply');
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const root=join(process.cwd(),'private-materials/aspekte-neu-b2/derived');
const manifest=JSON.parse(await readFile(join(root,'manifest.json'),'utf8'));
const files=['manifest.json'];
for(const dir of ['content','pages','figures','symbols','audio'])for(const file of await readdir(join(root,dir))){
 if(dir==='content'&&!/^\d{3}\.json$/.test(file))continue;
 if(['pages','figures','symbols'].includes(dir)&&!file.endsWith('.jpg'))continue;
 if(dir==='audio'&&!/^\d{2}\.m4a$/.test(file))continue;
 files.push(`${dir}/${file}`);
}
if(files.filter(f=>f.startsWith('content/')).length!==140||files.filter(f=>f.startsWith('audio/')).length!==51||files.filter(f=>f.startsWith('pages/')).length!==185||manifest.tracks.length!==51)throw new Error('Incomplete runtime source package');
for(const bucket of ['private-workbooks','workbook-recordings']){
 const {data,error}=await admin.storage.getBucket(bucket);if(error)throw new Error(`Missing private bucket ${bucket}; apply sql/069_private_workbooks.sql first`);
 if(data.public)throw new Error(`Refusing to upload to public bucket ${bucket}`);
}
let bytes=0;for(const file of files)bytes+=(await stat(join(root,file))).size;
console.log(JSON.stringify({mode:apply?'upload':'dry-run',files:files.length,bytes,bucket:'private-workbooks'}));
if(apply){
 for(let i=0;i<files.length;i+=4){
  await Promise.all(files.slice(i,i+4).map(async file=>{
   const contentType=file.endsWith('.json')?'application/json':file.endsWith('.m4a')?'audio/mp4':'image/jpeg';
   const {error}=await admin.storage.from('private-workbooks').upload(`aspekte-neu-b2/${file}`,await readFile(join(root,file)),{contentType,upsert:true,cacheControl:'60'});
   if(error)throw new Error(`Private upload failed: ${file}: ${error.message}`);
  }));
 }
 console.log('Private workbook upload completed. Production access remains controlled by WORKBOOK_ENABLED and memberships.');
}
