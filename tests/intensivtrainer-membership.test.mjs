import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createClient} from '@supabase/supabase-js';
import {readTrainerMembership} from '../lib/intensivtrainer-membership.ts';
const book='aspekte-neu-b2-intensivtrainer',user='synthetic-admin';
function renderFixture(){
 let membership=null,reads=0;
 const memo=new Map();
 const client=createClient('https://synthetic.invalid','synthetic-public-key',{
  auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async(input,init={})=>{
   const url=new URL(input);assert.equal(url.pathname,'/rest/v1/workbook_memberships');
   if(init.method==='POST'){
    assert.match(new Headers(init.headers).get('prefer'),/resolution=ignore-duplicates/);
    assert.equal(JSON.parse(init.body).book_key,book);
    if(!membership)membership={active:true};
    return new Response(null,{status:201});
   }
   assert.equal(init.method,'GET');assert.equal(url.searchParams.get('user_id'),'eq.'+user);assert.equal(url.searchParams.get('book_key'),'eq.'+book);
   // Match Next's render-pass memoization contract: an explicit signal opts out.
   if(!init.signal&&memo.has(url.href))return new Response(memo.get(url.href));
   reads++;const body=JSON.stringify(membership?[membership]:[]);
   if(!init.signal)memo.set(url.href,body);
   return new Response(body,{headers:{'Content-Type':'application/json'}});
  }}
 });
 const insert=()=>client.from('workbook_memberships').upsert({user_id:user,book_key:book,active:true},{onConflict:'user_id,book_key',ignoreDuplicates:true});
 const raw=()=>client.from('workbook_memberships').select('active').eq('user_id',user).eq('book_key',book).maybeSingle();
 return {client,insert,raw,reads:()=>reads,revoke:()=>{membership={active:false};}};
}
test('a newly inserted membership is visible in the same server render',async()=>{
 const control=renderFixture();assert.equal((await control.raw()).data,null);assert.equal((await control.insert()).error,null);
 assert.equal((await control.raw()).data,null,'The fixture must reproduce the historical memoized-empty result');
 const fixture=renderFixture(),signal=new AbortController().signal;
 assert.equal((await readTrainerMembership(fixture.client,user,signal)).data,null);
 assert.equal((await fixture.insert()).error,null);
 assert.deepEqual((await readTrainerMembership(fixture.client,user,signal)).data,{active:true});assert.equal(fixture.reads(),2);
});
test('a concurrent revocation is read fresh and is not overwritten by first-visit enrollment',async()=>{
 const fixture=renderFixture(),signal=new AbortController().signal;
 assert.equal((await readTrainerMembership(fixture.client,user,signal)).data,null);
 fixture.revoke();assert.equal((await fixture.insert()).error,null);
 assert.deepEqual((await readTrainerMembership(fixture.client,user,signal)).data,{active:false});assert.equal(fixture.reads(),2);
});
