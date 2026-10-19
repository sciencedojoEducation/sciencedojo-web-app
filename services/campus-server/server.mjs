import { randomBytes, timingSafeEqual } from "node:crypto";
import { Room, Server, matchMaker } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { CampusWorld } from "../../lib/campus/world.ts";
import { CAMPUS_ROOM, isIdentity } from "../../lib/campus/protocol.ts";
import { admissionLimiter } from "./admission-limit.mjs";

export function secretMatches(actual, expected) {
  if (
    typeof actual !== "string" ||
    typeof expected !== "string" ||
    expected.length < 32
  )
    return false;
  const a = Buffer.from(actual),
    b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Dependencies are injected for disposable integration tests, never selected by a public request. */
export async function createCampusServer({
  port = 2567,
  host = "127.0.0.1",
  origin,
  serviceKey,
  verify,
  refresh,
}) {
  if (
    !origin ||
    new URL(origin).origin !== origin ||
    typeof serviceKey !== "string" ||
    serviceKey.length < 32
  )
    throw new Error("Invalid campus service configuration");
  const bootstrap = randomBytes(32).toString("hex");
  const allowAdmission = admissionLimiter(bootstrap);
  let liveRoom;
  class LibraryRoom extends Room {
    onCreate(options) {
      if (options?.bootstrap !== bootstrap || liveRoom)
        throw new Error("Room creation unavailable");
      // The room reference is needed by the authenticated removal endpoint.
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      liveRoom = this;
      this.roomId = CAMPUS_ROOM;
      this.maxClients = 10;
      this.autoDispose = false;
      this.world = new CampusWorld();
      this.owners = new Map();
      this.checking = false;
      this.checks = new Map();
      this.onMessage("input", (client, input) =>
        this.world.input(client.auth.id, input, Date.now()),
      );
      this.onMessage("sit", (client, seat) => {
        if (
          !this.world.allow(client.auth.id, Date.now()) ||
          !this.world.sit(client.auth.id, seat)
        )
          client.send("notice", "Move closer to an available seat.");
      });
      this.onMessage("action", (client, action) => {
        if (this.world.allow(client.auth.id, Date.now()))
          this.world.status(client.auth.id, action);
      });
      this.onMessage("basketball", (client, action) => {
        if (!this.world.playBasketball(client.auth.id, action, Date.now()))
          client.send("notice", "Move near the ball on the sports court. Another player may be using it.");
      });
      this.onMessage("environment",(client,data)=>this.world.environment(client.auth.id,data,Date.now()));
      this.onMessage("refresh", async (client) => {
        if (!this.world.allow(client.auth.id, Date.now())) return;
        await this.checkClient(client);
      });
      this.setTimestep((delta) => {
        this.world.step(delta / 1000, Date.now());
        for (const client of this.clients)
          if (
            this.owners.get(client.auth?.id) === client.sessionId &&
            this.world.players.has(client.auth?.id)
          )
            client.send("snapshot", this.world.snapshot(client.auth.id));
      }, 100);
      this.clock.setInterval(async () => {
        if (this.checking) return;
        this.checking = true;
        try {
          await Promise.all(
            [...this.clients].map((client) => this.checkClient(client)),
          );
        } finally {
          this.checking = false;
        }
      }, 10000);
    }
    static async onAuth(_token, options, context) {
      if (!allowAdmission(context.ip))
        throw new Error("Please wait before trying admission again");
      if (context.headers.get("origin") !== origin)
        throw new Error("Origin denied");
      if (
        typeof options?.ticket !== "string" ||
        !/^[0-9a-f]{64}$/.test(options.ticket)
      )
        throw new Error("Admission required");
      const identity = await verify(options.ticket);
      if (!isIdentity(identity))
        throw new Error("Admission expired or unavailable");
      if (liveRoom?.world.players.has(identity.id))
        throw new Error("Already connected in another tab");
      return identity;
    }
    async onJoin(client) {
      const current = await refresh(client.auth.id);
      if (!isIdentity(current) || current.id !== client.auth.id)
        throw new Error("Admission revoked");
      this.world.join(current);
      this.owners.set(current.id, client.sessionId);
    }
    onLeave(client) {
      this.release(client);
    }
    // Release on loss rather than reserving an unreachable seat; fresh admission restores safe standing.
    onDrop(client) {
      this.release(client);
    }
    release(client) {
      const id = client.auth?.id;
      if (this.owners.get(id) === client.sessionId) {
        this.world.remove(id);
        this.owners.delete(id);
      }
    }
    async checkClient(client) {
      if (this.checks.has(client.sessionId))
        return this.checks.get(client.sessionId);
      const task = this.revalidateClient(client);
      this.checks.set(client.sessionId, task);
      try {
        await task;
      } finally {
        this.checks.delete(client.sessionId);
      }
    }
    async revalidateClient(client) {
      if (this.owners.get(client.auth?.id) !== client.sessionId) return;
      try {
        const identity = await refresh(client.auth.id);
        if (!isIdentity(identity) || identity.id !== client.auth.id)
          throw new Error("Revoked");
        if (this.world.players.has(identity.id))
          this.world.blocks.set(identity.id, new Set(identity.blocked));
      } catch {
        this.release(client);
        client.leave(4003, "Campus access ended");
      }
    }
    onDispose() {
      if (liveRoom === this) liveRoom = undefined;
    }
  }
  const server = new Server({
    greet: false,
    gracefullyShutdown: false,
    transport: new WebSocketTransport({
      maxPayload: 2048,
      pingInterval: 3000,
      pingMaxRetries: 2,
      verifyClient: ({ origin: supplied }) => supplied === origin,
    }),
    express: (app) => {
      app.use((req, res, next) => {
        if (req.headers.origin && req.headers.origin !== origin)
          return res.status(403).end();
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
        res.setHeader(
          "Access-Control-Allow-Headers",
          "Content-Type,Authorization",
        );
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
        res.setHeader("Cache-Control", "no-store");
        if (req.method === "OPTIONS") return res.status(204).end();
        next();
      });
      app.get("/health", (_req, res) => res.json({ ready: Boolean(liveRoom) }));
      app.post("/remove/:id", (req, res) => {
        if (!secretMatches(req.headers.authorization, `Bearer ${serviceKey}`))
          return res.status(401).end();
        for (const client of liveRoom?.clients || [])
          if (client.auth.id === req.params.id) {
            liveRoom.release(client);
            client.leave(4003, "Removed by session moderator");
          }
        res.status(204).end();
      });
    },
  });
  server.define("campus", LibraryRoom);
  await server.listen(port, host);
  await matchMaker.createRoom("campus", { bootstrap });
  return {
    server,
    get room() {
      return liveRoom;
    },
    close: () => server.gracefullyShutdown(false),
  };
}
