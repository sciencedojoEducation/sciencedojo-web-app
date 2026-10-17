import { CAMPUS_ROOM, isSnapshot, type Snapshot } from "./protocol.ts";

type CampusAdmission = { transport?: string; endpoint: string; room: string; ticket: string };

/** Both initial entry and renewal must remain bounded and cancellable. */
export async function requestCampusAdmission({ renew = false, signal }: { renew?: boolean; signal?: AbortSignal } = {}): Promise<CampusAdmission> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener("abort", abort, { once: true });
  const deadline = setTimeout(abort, 10000);
  try {
    const response = await fetch("/api/campus/admission", { method: "POST", signal: controller.signal,
      ...(renew ? { headers: { "content-type": "application/json" }, body: JSON.stringify({ renew: true }) } : {}) });
    const data = await response.json();
    if (!response.ok) throw new Error(typeof data?.error === "string" ? data.error : "Campus unavailable. Please try again.");
    if (!data || typeof data !== "object" || typeof data.endpoint !== "string" || data.room !== CAMPUS_ROOM ||
      typeof data.ticket !== "string" || !/^[0-9a-f]{64}$/.test(data.ticket) ||
      (data.transport !== undefined && !["vercel", "colyseus"].includes(data.transport)))
      throw new Error("Invalid campus admission response.");
    return { endpoint: data.endpoint, room: data.room, ticket: data.ticket, transport: data.transport };
  } catch (error) {
    if (controller.signal.aborted) throw new Error("Campus admission was interrupted or timed out. Your course stays open.");
    throw error;
  } finally { clearTimeout(deadline); signal?.removeEventListener("abort", abort); }
}

export type CampusConnection = {
  send(type: string, data?: unknown): void;
  leave(): Promise<unknown>;
  onMessage<T>(type: string, handler: (data: T) => void): unknown;
  onLeave(handler: () => void): unknown;
  onError(handler: () => void): unknown;
};

/** Same UI contract as the existing room; authentication stays in the protected handshake. */
export async function connectCampus(admission: CampusAdmission): Promise<CampusConnection> {
  if (admission.transport !== "vercel") {
    const { Client } = await import("@colyseus/sdk");
    const room = await new Client(admission.endpoint).joinById(admission.room, { ticket: admission.ticket });
    room.reconnection.enabled = false;
    return room;
  }
  const endpoint = new URL(admission.endpoint, location.origin);
  if (endpoint.origin !== location.origin || endpoint.pathname !== "/api/campus/socket" || endpoint.search || endpoint.hash)
    throw new Error("Invalid campus endpoint");
  endpoint.protocol = location.protocol === "https:" ? "wss:" : "ws:";
  const messages = new Map<string, Set<(value: unknown) => void>>();
  const left = new Set<() => void>(), errors = new Set<() => void>();
  let snapshot: Snapshot | undefined;
  let socket: WebSocket | undefined, pending: WebSocket | undefined;
  let stopping = false, renewing = false, leftEmitted = false;
  let lastSnapshotAt = performance.now();
  const renewalAbort = new AbortController();
  const visibilityChanged = () => { lastSnapshotAt = performance.now(); };
  document.addEventListener("visibilitychange", visibilityChanged);
  const watchdog = setInterval(() => {
    // Hidden/frozen tabs get a fresh grace period on return; native pongs keep
    // their server connection alive without depending on throttled tab timers.
    if (document.visibilityState !== "visible") { lastSnapshotAt = performance.now(); return; }
    if (socket && !stopping && performance.now() - lastSnapshotAt >= 12000) ended();
  }, 1000);
  const emit = (type: string, data: unknown) => {
    for (const handler of messages.get(type) || []) handler(data);
  };
  const ended = () => {
    if (leftEmitted) return;
    leftEmitted = true; stopping = true;
    clearInterval(watchdog); document.removeEventListener("visibilitychange", visibilityChanged);
    renewalAbort.abort(); socket?.close(1000); pending?.close(1000);
    for (const handler of left) handler();
  };
  const connection: CampusConnection = {
    send: (type, data = null) => { if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type, data })); },
    leave: async () => { ended(); },
    onMessage: <T>(type: string, handler: (value: T) => void) => {
      let handlers = messages.get(type);
      if (!handlers) { handlers = new Set(); messages.set(type, handlers); }
      const callback = handler as (value: unknown) => void;
      handlers.add(callback);
      if (type === "snapshot" && snapshot) handler(snapshot as T);
      return () => handlers.delete(callback);
    },
    onLeave: (handler) => { left.add(handler); return () => left.delete(handler); },
    onError: (handler) => { errors.add(handler); return () => errors.delete(handler); },
  };
  const open = (ticket: string, renew = false) => new Promise<void>((resolve, reject) => {
    if (stopping) { reject(new Error("Campus connection ended.")); return; }
    const candidate = new WebSocket(endpoint);
    pending = candidate;
    let ready = false, notice = "";
    const timeout = setTimeout(() => { candidate.close(); reject(new Error("Campus connection timed out.")); }, 12000);
    candidate.onopen = () => candidate.send(JSON.stringify({ type: "admit", ticket, ...(renew ? { renew: true } : {}) }));
    candidate.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "ready" && !ready && isSnapshot(message.data)) {
          ready = true; clearTimeout(timeout);
          const previous = socket;
          socket = candidate; pending = undefined; snapshot = message.data;
          lastSnapshotAt = performance.now();
          previous?.close(1000);
          emit("snapshot", snapshot); resolve();
        } else if (candidate === socket && message.type === "snapshot" && isSnapshot(message.data)) {
          snapshot = message.data; lastSnapshotAt = performance.now(); emit("snapshot", snapshot);
        } else if (message.type === "notice" && typeof message.data === "string") {
          notice = message.data;
          if (candidate === socket) emit("notice", notice);
        } else if (candidate === socket && message.type === "renew" && message.data === null) {
          void renewConnection();
        } else candidate.close(1008);
      } catch { candidate.close(1008); }
    };
    candidate.onerror = () => { if (candidate === socket) for (const handler of errors) handler(); };
    candidate.onclose = () => {
      clearTimeout(timeout);
      if (pending === candidate) pending = undefined;
      if (!ready) reject(new Error(notice || "Campus unavailable. Please try again."));
      if (candidate === socket && !renewing) ended();
    };
  });
  async function renewConnection() {
    if (renewing || stopping) return;
    renewing = true;
    try {
      const next = await requestCampusAdmission({ renew: true, signal: renewalAbort.signal });
      if (next.transport !== "vercel" || next.endpoint !== "/api/campus/socket") throw new Error("Renewal unavailable");
      await open(next.ticket, true);
    } catch {
      if (!stopping) emit("notice", "Library connection could not renew. Your course stays open.");
      if (socket?.readyState !== WebSocket.OPEN) ended();
    } finally { renewing = false; }
  }
  try { await open(admission.ticket); } catch (error) { ended(); throw error; }
  return connection;
}
