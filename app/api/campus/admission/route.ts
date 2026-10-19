import { randomBytes } from "node:crypto";
import { campusSession, campusJson } from "@/lib/campus/server";
import {
  campusConfiguration,
  hashTicket,gameAccessKey,
  sameOrigin,
} from "@/lib/campus/security";
import { CAMPUS_ROOM } from "@/lib/campus/protocol";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return campusJson({ error: "Origin denied" }, 403);
  const session = await campusSession(),
    config = campusConfiguration();
  if (!session || !config)
    return campusJson(
      { error: "Campus unavailable or invitation required." },
      403,
    );
  const ticket = randomBytes(32).toString("hex");
  const { error } = await session.supabase.rpc("campus_issue_ticket", {
    ticket_hash: hashTicket(ticket),
  });
  if (error)
    return campusJson(
      {
        error:
          "Admission unavailable. Check your invitation and try again shortly.",
      },
      429,
    );
  return campusJson({ ticket,gameKey:gameAccessKey(ticket), transport: config.transport, endpoint: config.publicUrl, room: CAMPUS_ROOM });
}
