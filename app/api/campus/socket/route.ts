import { upgradeWebSocket } from "@vercel/functions";
import { campusConfiguration, campusSocketRequestAllowed } from "@/lib/campus/security";
import { campusSession, campusJson } from "@/lib/campus/server";
import { createAdminClient } from "@/utils/supabase/server";
import { runVercelCampusSession } from "@/lib/campus/vercel-session";
import { withBasketballRuntime } from "@/lib/campus/basketball-shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  if (campusConfiguration()?.transport !== "vercel" || !campusSocketRequestAllowed(request)) return campusJson(null, 403);
  const session = await campusSession();
  if (!session?.identity.accepted) return campusJson(null, 403);
  const { data: upgradeAllowed, error: upgradeError } = await session.supabase.rpc("campus_begin_socket");
  if (upgradeError || upgradeAllowed !== true) return campusJson(null, 429);
  const supabase = await createAdminClient();
  const sharedRuntime = withBasketballRuntime(async (args) => {
    const { data, error } = await supabase.rpc("campus_runtime", args).abortSignal(AbortSignal.timeout(5000));
    if (error || !data) throw new Error("Campus runtime unavailable");
    return data;
  }, async args => {
    const { data, error } = await supabase.rpc("campus_basketball_commit", args).abortSignal(AbortSignal.timeout(5000));
    if (error || !data) throw new Error("Court runtime unavailable");
    return data;
  });
  return upgradeWebSocket((socket) => runVercelCampusSession(socket, session.identity.id, sharedRuntime,{bindGames:async(connection,credential)=>{
    const {data,error}=await supabase.rpc("campus_game_bind",{connection,credential}).abortSignal(AbortSignal.timeout(3000));
    if(error||data!==true)throw new Error("Game connection unavailable");
  }}), { maxPayload: 2048 });
}
