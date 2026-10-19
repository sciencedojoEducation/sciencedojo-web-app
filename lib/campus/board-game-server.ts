import "server-only";
import {campusSession} from "./server";
import {createAdminClient} from "@/utils/supabase/admin";
import {hashTicket} from "./security";
import {gameContext} from "./game-context";
import {createPlayApi} from "./play-api";
import type {GamesSession} from "./board-game-api";
import {createGameApi} from "./board-game-api";

const session:()=>Promise<GamesSession|null> = async () => {
  const current = await campusSession();
  if (!current) return null;
  const {data:profile,error} = await current.supabase.from("profiles").select("full_name,avatar_url").eq("id",current.userId).single();
  if (error || !profile) return null;
  return {userId:current.userId,profile,safety:async (action,target,reason) => {
    const {error} = await current.supabase.rpc(action === "block" ? "campus_block" : "campus_report",
      action === "block" ? {target_id:target,blocked:true} : {target_id:target,report_reason:reason});
    return !error;
  }};
};
export const gameApi = createGameApi({
  requireKey:true,supabaseUrl:process.env.NEXT_PUBLIC_SUPABASE_URL, session,
  rpc:async (actor,game_table,operation,payload={},key) => {
    const context=await gameContext();
    const {data,error} = await createAdminClient().rpc("campus_game",{actor,game_table,operation,payload,...context,credential:hashTicket(key??"")}).abortSignal(AbortSignal.timeout(6000));
    if (error || !data) throw new Error("Game service unavailable");
    return data;
  },
});

export const playApi=createPlayApi({requireKey:true,session,rpc:async(actor,operation,payload={},key)=>{
  const context=await gameContext();
  const {data,error}=await createAdminClient().rpc("campus_play",{actor,operation,payload,...context,credential:hashTicket(key??"")}).abortSignal(AbortSignal.timeout(6000));
  if(error||!data)throw new Error("Invitations unavailable");
  return data;
}});
