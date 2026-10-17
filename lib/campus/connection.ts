import { isSnapshot, type Snapshot } from "./protocol.ts";

export type CampusConnection = {
  send(type: string, data?: unknown): void;
  leave(): Promise<unknown>;
  onMessage<T>(type: string, handler: (data: T) => void): unknown;
  onLeave(handler: () => void): unknown;
  onError(handler: () => void): unknown;
};

/** Same UI contract as the existing room; authentication stays in the protected handshake. */
export async function connectCampus(admission: {
  transport?: string; endpoint: string; room: string; ticket: string;
}): Promise<CampusConnection> {
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
  const renewalAbort = new AbortController();
  const emit = (type: string, data: unknown) => {
    for (const handler of messages.get(type) || []) handler(data);
  };
  const ended = () => {
    if (leftEmitted) return;
    leftEmitted = true;
    for (const handler of left) handler();
  };
  const connection: CampusConnection = {
    send: (type, data = null) => { if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type, data })); },
    leave: async () => { stopping = true; renewalAbort.abort(); socket?.close(1000); pending?.close(1000); },
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
          previous?.close(1000);
          emit("snapshot", snapshot); resolve();
        } else if (candidate === socket && message.type === "snapshot" && isSnapshot(message.data)) {
          snapshot = message.data; emit("snapshot", snapshot);
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
    const requestAbort = new AbortController();
    const abortRequest = () => requestAbort.abort();
    renewalAbort.signal.addEventListener("abort", abortRequest, { once: true });
    // A hung admission response must not indefinitely suppress the old socket's
    // disconnect event. Leave aborts it too; a new socket has its own deadline.
    const requestDeadline = setTimeout(abortRequest, 10000);
    try {
      const response = await fetch("/api/campus/admission", { method: "POST", signal: requestAbort.signal,
        headers: { "content-type": "application/json" }, body: JSON.stringify({ renew: true }) });
      const next = await response.json();
      if (!response.ok || next.transport !== "vercel" || next.endpoint !== "/api/campus/socket" ||
        typeof next.ticket !== "string" || !/^[0-9a-f]{64}$/.test(next.ticket)) throw new Error("Renewal unavailable");
      await open(next.ticket, true);
    } catch {
      if (!stopping) emit("notice", "Library connection could not renew. Your course stays open.");
      if (socket?.readyState !== WebSocket.OPEN) ended();
    } finally {
      clearTimeout(requestDeadline);
      renewalAbort.signal.removeEventListener("abort", abortRequest);
      renewing = false;
    }
  }
  await open(admission.ticket);
  return connection;
}
