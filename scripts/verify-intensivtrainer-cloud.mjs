/** Verify the approved private source package without creating accounts or learner work. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
const key='aspekte-neu-b2-intensivtrainer',root=join(process.cwd(),'private-materials',key,'derived');
const prior=JSON.parse(await readFile(join(root,'private-upload-verification.json'),'utf8'));
assert.equal(prior.mode,'upload');assert.equal(prior.prefix,key);assert.equal(prior.files.length,198);
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,service=process.env.SUPABASE_SERVICE_ROLE_KEY,anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
assert.ok(url&&service&&anon,'Existing ScienceDojo storage credentials are required');
const options={auth:{persistSession:false,autoRefreshToken:false}};
const admin=createClient(url,service,options),anonymous=createClient(url,anon,options);
const bucket=await admin.storage.getBucket('private-workbooks');assert.ok(!bucket.error&&bucket.data&&!bucket.data.public);
let bytes=0,files=0;
for(let offset=0;offset<prior.files.length;offset+=8){
 const results=await Promise.allSettled(prior.files.slice(offset,offset+8).map(async file=>{
  assert.match(file.name,/^(manifest\.json|native\/(?:[4-9]|[1-7]\d|8[0-3])\.json|assets\/page-\d\d\.jpg|assets\/figures\/fig-\d{1,2}-\d+\.jpg)$/);
  const response=await admin.storage.from('private-workbooks').download(`${key}/${file.name}`);assert.ok(!response.error&&response.data,`Private file unavailable: ${file.name}`);
  const body=Buffer.from(await response.data.arrayBuffer());assert.equal(body.length,file.bytes);
  assert.equal(createHash('sha256').update(body).digest('hex'),file.sha256,`Hash mismatch: ${file.name}`);
  return body.length;
 }));
 for(const result of results){if(result.status==='rejected')throw result.reason;bytes+=result.value;files++;}
}
let anonymousDenials=0;
for(const file of ['manifest.json','native/4.json','assets/page-03.jpg','assets/figures/fig-4-1.jpg']){
 const response=await anonymous.storage.from('private-workbooks').download(`${key}/${file}`);assert.ok(response.error&&!response.data,'Anonymous source download must be denied');
 const signed=await anonymous.storage.from('private-workbooks').createSignedUrl(`${key}/${file}`,60);assert.ok(signed.error&&!signed.data,'Anonymous signed URL must be denied');anonymousDenials+=2;
}
const schema=await fetch(`${url}/rest/v1/`,{headers:{apikey:service,Authorization:`Bearer ${service}`,Accept:'application/openapi+json'}});assert.ok(schema.ok);
const api=await schema.json(),saveRpcPresent=!!api.paths?.['/rpc/intensivtrainer_save_state'];
const report={checkedAt:new Date().toISOString(),privateBucket:true,files,bytes,matchingHashes:files,anonymousDenials,saveRpcPresent};
await writeFile(join(root,'source-cloud-verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
