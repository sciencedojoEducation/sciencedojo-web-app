import {readFile} from "node:fs/promises";
import {fixture,id} from "./course-pilot-fixture.mjs";
import {createGameApi} from "../../lib/campus/board-game-api.ts";
export async function gamesFixture() {
  const f=await fixture();
  await f.db.exec("CREATE ROLE service_role BYPASSRLS; GRANT USAGE ON SCHEMA public TO service_role;");
  for(const file of ["070_virtual_campus.sql","076_campus_board_games.sql","077_campus_german_vocabulary.sql"])
    await f.db.exec(await readFile(new URL(`../../sql/${file}`,import.meta.url),"utf8"));
  await f.db.query("INSERT INTO campus_staff(user_id) VALUES($1)",[id(15)]);
  await f.db.exec("UPDATE feature_flags SET enabled=true WHERE key='virtual_campus_enabled'");
  const identities=[];
  for(let n=1;n<=6;n++){
    await f.as(15,()=>f.db.query("SELECT campus_manage_member($1,true,true,true)",[id(n)]));
    await f.as(n,()=>f.db.query("SELECT campus_accept_notice('campus-adult-pilot-v1')"));
    identities.push((await f.as(n,()=>f.db.query("SELECT campus_self() AS x"))).rows[0].x);
    await f.db.query("UPDATE profiles SET full_name=$2,avatar_url=$3 WHERE id=$1",[id(n),`Game Friend ${n}`,`https://fixture.supabase.co/storage/v1/object/public/avatars/${id(n)}.png`]);
  }
  const {rpc,api}=attachGamesApi(f);
  const clearRate=()=>f.db.exec("UPDATE campus_game_members SET last_action='-infinity' WHERE table_id IN ('four','boxes','wortquest')");
  const request=async(n,table,body,fetchPhoto)=>{
    const handler=api(n,fetchPhoto),url=`http://127.0.0.1:3012/api/campus/games?table=${table}`;
    const req=new Request(url,{method:body?'POST':'GET',headers:body?{origin:"http://127.0.0.1:3012","content-type":"application/json"}:{},body:body?JSON.stringify(body):undefined});
    const res=await handler[body?'POST':'GET'](req);
    return {status:res.status,body:await res.json()};
  };
  const command=async(n,table,body)=>{
    await clearRate();
    const {body:{game}}=await request(n,table);
    return request(n,table,{round:game.round,version:game.version,...body});
  };
  return {...f,identities,rpc,api,request,command,clearRate};
}
export function attachGamesApi(f){
  const rpc=(actor,table,operation,payload={})=>f.db.transaction(async tx=>{
    await tx.exec("SET LOCAL ROLE service_role");
    return (await tx.query("SELECT campus_game($1,$2,$3,$4::jsonb) AS x",[actor,table,operation,JSON.stringify(payload)])).rows[0].x;
  });
  const api=(n,fetchPhoto)=>createGameApi({supabaseUrl:"https://fixture.supabase.co",fetchPhoto,rpc,session:async()=>{
    if(!n)return null;
    return {userId:id(n),profile:(await f.db.query("SELECT full_name,avatar_url FROM profiles WHERE id=$1",[id(n)])).rows[0],
      safety:async(action,target,reason)=>{
        await f.as(n,()=>f.db.query(action==='block'?"SELECT campus_block($1,true)":"SELECT campus_report($1,$2)",action==='block'?[target]:[target,reason]));
        return true;
      }};
  }});
  return {rpc,api};
}

