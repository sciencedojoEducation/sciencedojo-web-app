import { createAdminClient } from "@/utils/supabase/server";
import {
  campusConfiguration,
  hashTicket,
  validServiceKey,
  readCampusJson,
} from "@/lib/campus/security";
import { campusJson } from "@/lib/campus/server";
export async function POST(request: Request) {
  if (
    campusConfiguration()?.transport !== "colyseus" ||
    !validServiceKey(
      request.headers.get("authorization"),
      process.env.CAMPUS_SERVICE_KEY,
    )
  )
    return campusJson(null, 403);
  if (Number(request.headers.get("content-length")) > 2048)
    return campusJson(null, 413);
  const body = await readCampusJson(request);
  if (!body || typeof body.value !== "string") return campusJson(null, 400);
  const supabase = await createAdminClient();
  let result;
  if (body.operation === "redeem" && /^[0-9a-f]{64}$/.test(body.value))
    result = await supabase.rpc("campus_redeem_ticket", {
      ticket_hash: hashTicket(body.value),
    });
  else if (body.operation === "check" && /^[0-9a-f-]{36}$/i.test(body.value))
    result = await supabase.rpc("campus_service_identity", {
      target: body.value,
    });
  else if(body.operation==="depart" && /^[0-9a-f-]{36}$/i.test(body.value) && typeof body.connection==="string" && /^[A-Za-z0-9_-]{8,64}$/.test(body.connection))
    result=await supabase.rpc("campus_play_depart",{target:body.value,owner_connection:body.connection}).abortSignal(AbortSignal.timeout(1500));
  else return campusJson(null, 400);
  if (result.error || !result.data) return campusJson(null, 403);
  return campusJson(result.data);
}
