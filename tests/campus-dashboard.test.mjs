import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import * as jsx from 'react/jsx-runtime';
import ts from 'typescript';

test('dashboard beta entry requires configured release, flag and admitted identity; metadata and RPC failures grant nothing',async()=>{
  const source=await readFile(new URL('../components/DashboardSidebar.tsx',import.meta.url),'utf8');
  let configured=true,flag=true,identity=null,failed=false,calls=0;
  const supabase={
    auth:{getUser:async()=>({data:{user:{id:'fixture-owner',user_metadata:{role:'admin'}}}})},
    from:()=>({select:()=>({eq:()=>({single:async()=>({data:{full_name:'Synthetic owner'}})})})}),
    rpc:async name=>{assert.equal(name,'campus_self');calls++;return {data:identity,error:failed?new Error('Unavailable'):null};},
  };
  const placeholder=()=>null;
  const modules={
    'react/jsx-runtime':jsx,'next/image':placeholder,
    '@/utils/supabase/server':{createClient:async()=>supabase},
    '@/lib/workbook-access':{workbookFeatureEnabled:()=>false},
    '@/lib/feature-flags':{isFeatureEnabled:async key=>key==='virtual_campus_enabled'&&flag},
    '@/lib/campus/security':{campusConfiguration:()=>configured?{transport:'vercel'}:null},
    '@/lib/dashboard-navigation':{getDashboardNavSections:()=>[]},
    '@/lib/dashboard-badges':{createEmptyDashboardBadgeCounts:()=>({}),getDashboardBadgeCounts:async()=>({})},
  };
  for(const name of ['SidebarLink','DashboardTourReplayButton','DashboardMobileDrawer','DashboardBadgeProvider','DashboardAccountMenu'])modules[`./${name}`]=placeholder;
  const exports={};
  runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,{
    exports,require(name){assert.ok(name in modules,name);return modules[name];},
  });
  function hasEntry(node){
    if(Array.isArray(node))return node.some(hasEntry);
    return !!node&&typeof node==='object'&&(node.props?.href==='/campus'||hasEntry(node.props?.children));
  }
  const render=async()=>hasEntry(await exports.default({role:'student'}));
  assert.equal(await render(),false,'An existing account or editable admin metadata is not admission');
  identity={id:'opaque-fixture',accepted:false};
  assert.equal(await render(),true,'An admitted account can reach the notice before accepting it');
  failed=true;assert.equal(await render(),false,'Admission lookup failure must hide the entry');failed=false;
  configured=false;calls=0;assert.equal(await render(),false);assert.equal(calls,0);
  configured=true;flag=false;assert.equal(await render(),false);assert.equal(calls,0);
});
