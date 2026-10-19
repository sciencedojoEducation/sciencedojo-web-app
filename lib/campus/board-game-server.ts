import "server-only";
import {campusSession} from "./server";
import {createAdminClient} from "@/utils/supabase/admin";
import {createGameApi} from "./board-game-api";

export const gameApi = createGameApi({
  supabaseUrl:process.env.NEXT_PUBLIC_SUPABASE_URL,
  session:async () => {
    const session = await campusSession();
    if (!session) return null;
    const {data:profile,error} = await session.supabase.from("profiles").select("full_name,avatar_url").eq("id",session.userId).single();
    if (error || !profile) return null;
    return {userId:session.userId,profile,safety:async (action,target,reason) => {
      const {error} = await session.supabase.rpc(action === "block" ? "campus_block" : "campus_report",
        action === "block" ? {target_id:target,blocked:true} : {target_id:target,report_reason:reason});
      return !error;
    }};
  },
  rpc:async (actor,game_table,operation,payload={}) => {
    const {data,error} = await createAdminClient().rpc("campus_game",{actor,game_table,operation,payload}).abortSignal(AbortSignal.timeout(6000));
    if (error || !data) throw new Error("Game service unavailable");
    return data;
  },
});
