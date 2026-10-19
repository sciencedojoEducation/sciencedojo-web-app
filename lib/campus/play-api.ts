import {sameOrigin,readCampusJson} from "./security.ts";
import type {GamesSession} from "./board-game-api.ts";
import type {PlayState} from "./game-location.ts";
type Deps={requireKey?:boolean;session:()=>Promise<GamesSession|null>;rpc:(actor:string,operation:string,payload?:object,key?:string)=>Promise<PlayState&{error?:string}>};
export function createPlayApi(deps:Deps){
  const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"private, no-store","Vary":"Cookie","X-Content-Type-Options":"nosniff"}});
  const handle=async(request:Request)=>{
    if((request.method!=="GET"&&request.method!=="POST") || request.headers.get("sec-fetch-site")==="cross-site" ||
      ((request.method==="POST"||request.headers.has("origin"))&&!sameOrigin(request)))return json({error:"Origin denied"},403);
    try{
      const session=await deps.session();if(!session)return json({error:"Campus access required"},403);
      const key=request.headers.get("x-campus-game-key")??undefined;
      if(deps.requireKey&&!/^[0-9a-f]{64}$/.test(key??""))return json({error:"Use the connected school tab to play"},403);
      let operation="read",payload:Record<string,unknown>={};
      if(request.method==="POST"){
        const body=await readCampusJson(request);
        const keys:Record<string,string[]>={send:["action","target","table"],accept:["action","id"],decline:["action","id"],cancel:["action","id"],mute:["action","muted"]};
        if(!body||typeof body.action!=="string"||!Object.hasOwn(keys,body.action)||Object.keys(body).some(k=>!keys[body.action as string].includes(k)))return json({error:"Invalid invitation"},400);
        const {action,...rest}=body;operation=action as string;payload=rest;
      }
      const result=await deps.rpc(session.userId,operation,payload,key);
      return result.error?json({error:result.error},409):json(result);
    }catch{return json({error:"Play invitations are temporarily unavailable."},503);}
  };
  return {GET:handle,POST:handle};
}
