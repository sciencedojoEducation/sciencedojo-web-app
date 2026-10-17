import { randomUUID } from "node:crypto";
import { upgradeWebSocket } from "@vercel/functions";
import { hostingCheckEnabled, hostingCheckRequestAllowed } from "@/lib/campus/hosting-check";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;
// Random experiment marker, never a provider/account identifier or campus identity.
const instance = randomUUID();

export async function GET(request: Request) {
  if (!hostingCheckEnabled(process.env) || !hostingCheckRequestAllowed(request))
    return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  return upgradeWebSocket((socket) => new Promise<void>((resolve) => {
    let messages = 0;
    const timer = setTimeout(() => socket.terminate(), 8000);
    const finish = () => { clearTimeout(timer); resolve(); };
    socket.once("close", finish);
    socket.once("error", () => { socket.terminate(); finish(); });
    socket.on("message", (data, binary) => {
      // Accept one fixed synthetic message only; never echo arbitrary input.
      if (binary || ++messages > 2 || data.toString() !== "probe") {
        socket.close(1008, "Invalid probe");
        return;
      }
      socket.send(JSON.stringify({ type: "pong", instance }));
    });
  }), { maxPayload: 32 });
}
