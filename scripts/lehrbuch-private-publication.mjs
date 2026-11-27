import {createHash,randomUUID} from 'node:crypto';

// Publish dependencies first; a page must never refer to an illustration not uploaded yet.
export function publicationOrder(files){
 const rank=path=>path.startsWith('figures/')?0:path.endsWith('/manifest.json')?2:1;
 return [...files].sort((a,b)=>rank(a.path)-rank(b.path)||a.path.localeCompare(b.path));
}

export async function verifyPrivateObject({url,key,object,file,fetcher=fetch,wait=ms=>new Promise(resolve=>setTimeout(resolve,ms))}){
 let failure='no response';
 for(let attempt=0;attempt<3;attempt++){
  if(attempt)await wait(attempt*1000);
  const endpoint=new URL(`${url}/storage/v1/object/authenticated/private-workbooks/${object}`);
  endpoint.searchParams.set('verification',`${file.sha256}-${randomUUID()}`);
  try{
   const response=await fetcher(endpoint,{headers:{Authorization:`Bearer ${key}`,apikey:key,'Cache-Control':'no-cache'},cache:'no-store',signal:AbortSignal.timeout(20000)});
   if(!response.ok){
    failure=`HTTP ${response.status}`;
    await response.body?.cancel();
    // Permissions and missing objects require operator attention, not repeated reads.
    if(response.status>=400&&response.status<500&&response.status!==408&&response.status!==429)break;
    continue;
   }
   const actual=createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex');
   if(actual===file.sha256)return {attempts:attempt+1,sha256:actual};
   failure=`expected SHA-256 ${file.sha256}, received ${actual}`;
  }catch{
   // Never include a request/error object, which can contain server credentials.
   failure='download interrupted or unavailable';
  }
 }
 throw new Error(`Private source hash verification failed for ${file.path}: ${failure}`);
}

export async function publishPrivateObjects({files,upload,verify,onVerified=()=>{}}){
 const results=[];
 for(const file of publicationOrder(files)){
  await upload(file);
  const result=await verify(file);
  results.push({path:file.path,sha256:file.sha256,...result});
  onVerified(results.length,files.length);
 }
 return results;
}
