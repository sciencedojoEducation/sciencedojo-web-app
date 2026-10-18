import { randomUUID } from "node:crypto";
import type { WebSocket } from "ws";
import { isInput, isSnapshot, SEATS, type Snapshot } from "./protocol.ts";
import { hashTicket } from "./security.ts";
import { SCHOOL_REVISION } from "./school-layout.ts";

export type RuntimeResult = {
  world_revision?: string;
  snapshot?: Snapshot;
  notice?: string | null;
  error?: string;
  ended?: boolean;
};
export type RuntimeCall = (args: {
  runtime_connection: string;
  runtime_operation: "connect" | "step" | "leave";
  runtime_commands?: { type: string; data: unknown }[];
  ticket_hash?: string;
  expected_campus?: string;
  runtime_renew?: boolean;
}) => Promise<RuntimeResult>;

/** One handler owns a socket, never the room. Every authoritative operation uses the shared DB. */
export function runVercelCampusSession(
  socket: WebSocket,
  expectedCampus: string,
  runtime: RuntimeCall,
  { intervalMs = 200, lifetimeMs = 240000, admissionMs = 5000, renewAfterMs = 200000,
    heartbeatMs = 3000, pongTimeoutMs = 6000 } = {},
) {
  return new Promise<void>((resolve) => {
    const connection = randomUUID();
    let admitted = false, admitting = false, closed = false, inFlight = false;
    let pendingInput: { type: string; data: unknown } | undefined;
    const commands: { type: string; data: unknown }[] = [];
    let rateAt = Date.now(), rateCount = 0;
    let work: Promise<void> = Promise.resolve();
    let lastPong = performance.now();
    const send = (type: string, data: unknown) => {
      if (!closed && socket.readyState === 1) socket.send(JSON.stringify({ type, data }));
    };
    const finish = () => {
      if (closed) return;
      closed = true;
      clearTimeout(admissionTimer); clearTimeout(lifetimeTimer); clearTimeout(renewTimer);
      clearInterval(tick); clearInterval(heartbeat);
      pendingInput = undefined; commands.length = 0;
      // Release after the last operation settles, including an interrupted join.
      // If the host is killed, the database lease still expires after 15 seconds.
      void work.catch(() => {}).then(async () => {
        try { await runtime({ runtime_connection: connection, runtime_operation: "leave" }); }
        catch { /* The lease is the bounded fallback, never a local seat reservation. */ }
        resolve();
      });
    };
    const end = (code: number) => {
      socket.close(code, "Campus connection ended");
      finish();
    };
    const consume = (result: RuntimeResult, ready = false) => {
      if (closed) return;
      if (result.ended || result.error || result.world_revision !== SCHOOL_REVISION || !isSnapshot(result.snapshot) || result.snapshot.self !== expectedCampus) {
        if (result.error === "Already connected in another tab." || result.error === "The library is full. Please try again later.")
          send("notice", result.error);
        end(4003);
        return;
      }
      send(ready ? "ready" : "snapshot", result.snapshot);
      if (result.notice) send("notice", "Move closer to an available seat.");
    };
    const admissionTimer = setTimeout(() => end(4003), admissionMs);
    const lifetimeTimer = setTimeout(() => end(1012), lifetimeMs);
    const renewTimer = setTimeout(() => { if (admitted) send("renew", null); }, renewAfterMs);
    // Database polling is not evidence that the remote browser is still alive.
    // Native control frames also work when a healthy browser throttles tab JS.
    const heartbeat = setInterval(() => {
      if (closed || !admitted) return;
      if (performance.now() - lastPong >= pongTimeoutMs) {
        socket.terminate(); finish(); return;
      }
      try { socket.ping(); } catch { socket.terminate(); finish(); }
    }, heartbeatMs);
    socket.on("pong", () => { lastPong = performance.now(); });
    const tick = setInterval(() => {
      if (!admitted || closed || inFlight) return;
      inFlight = true;
      const batch = pendingInput ? [pendingInput, ...commands.splice(0)] : commands.splice(0);
      pendingInput = undefined;
      work = runtime({ runtime_connection: connection, runtime_operation: "step", runtime_commands: batch })
        .then((result) => consume(result)).catch(() => end(1011)).finally(() => { inFlight = false; });
    }, intervalMs);
    socket.once("close", finish);
    socket.once("error", () => { socket.terminate(); finish(); });
    socket.on("message", (raw, binary) => {
      if (closed) return;
      const bytes = Array.isArray(raw) ? Buffer.concat(raw) : Buffer.from(raw as ArrayBuffer);
      if (binary || bytes.byteLength > 2048) { end(1008); return; }
      if (Date.now() - rateAt >= 1000) { rateAt = Date.now(); rateCount = 0; }
      if (++rateCount > 30) { end(1008); return; }
      let message;
      try { message = JSON.parse(bytes.toString()); } catch { end(1008); return; }
      if (!message || typeof message !== "object" || Array.isArray(message)) { end(1008); return; }
      if (!admitted) {
        const keys = Object.keys(message).sort().join(",");
        if (admitting || !(keys === "ticket,type" || (keys === "renew,ticket,type" && message.renew === true)) ||
          message.type !== "admit" || typeof message.ticket !== "string" || !/^[0-9a-f]{64}$/.test(message.ticket)) {
          end(4003); return;
        }
        admitting = true;
        work = runtime({ runtime_connection: connection, runtime_operation: "connect",
          ticket_hash: hashTicket(message.ticket), expected_campus: expectedCampus, runtime_renew: message.renew === true })
          .then((result) => {
            if (closed) return;
            admitted = true; lastPong = performance.now(); clearTimeout(admissionTimer); consume(result, true);
          }).catch(() => end(4003));
        return;
      }
      if (Object.keys(message).sort().join(",") !== "data,type") { end(1008); return; }
      const { type, data } = message;
      if (type === "input" && isInput(data)) pendingInput = { type, data };
      else if ((type === "sit" && SEATS.some((s) => s.id === data)) ||
        (type === "action" && ["stand", "study", "close"].includes(data))) {
        if (commands.length >= 4) { end(1008); return; }
        commands.push({ type, data });
      } else if (!(type === "refresh" && data === null)) end(1008);
    });
  });
}
