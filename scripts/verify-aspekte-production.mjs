/** Verify anonymous production gates. Start the standalone build with matching WORKBOOK_ENABLED first. */
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const enabled=process.env.EXPECT_WORKBOOK_ENABLED!=='false';const rejected=enabled?401:404;
const base=process.env.WORKBOOK_VERIFY_ORIGIN || 'http://localhost:3002',root='/api/workbook/aspekte-neu-b2';const checks=[];
for(const path of [`${root}?chapter=1`,`${root}/study`,`${root}/assets/audio/2`,`${root}/assets/page/147`,`${root}/assets/symbol/audio`,`${root}/recordings?exercise=10:7`,`${root}/recordings/history`,`${root}/admin`]){
 const r=await fetch(base+path,{redirect:'manual'});assert.equal(r.status,rejected,path);checks.push({method:'GET',path,status:r.status});
}
for(const path of [root,`${root}/study`,`${root}/feedback`,`${root}/admin`,`${root}/invite`]){
 const r=await fetch(base+path,{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:'{}'});assert.equal(r.status,rejected,path);checks.push({method:'POST',path,status:r.status});
}
const page=await fetch(`${base}/workbooks/aspekte-neu-b2`,{redirect:'manual'});const html=await page.text();
assert.doesNotMatch(html,/wb-native-page|Präpositionalergänzungen|Heimat ist/);
if(enabled){if(page.status===307)assert.match(page.headers.get('location'),/^\/login\?next=/);else {assert.equal(page.status,200);assert.match(html,/NEXT_REDIRECT;replace;\/login\?next=/);assert.match(html,/http-equiv="refresh"/);}}
checks.push({method:'GET',path:'/workbooks/aspekte-neu-b2',status:page.status,privateContentAbsent:true,streamedLoginRedirect:enabled&&page.status===200});
const manifest=await fetch(`${base}/workbooks/manifest.webmanifest`);assert.equal(manifest.status,200);const data=await manifest.json();assert.equal(data.scope,'/workbooks/');assert.equal(data.display,'standalone');checks.push({method:'GET',path:'/workbooks/manifest.webmanifest',status:manifest.status});
const report={checkedAt:new Date().toISOString(),runtime:'standalone production',workbookEnabled:enabled,loopbackPreviewBypass:false,checks};
await writeFile(`private-materials/aspekte-neu-b2/derived/production-gates-${enabled?'enabled':'disabled'}-verification.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
