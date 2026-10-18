import { test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import WebSocket, { WebSocketServer } from "ws";
import { runVercelCampusSession } from "../lib/campus/vercel-session.ts";
import { runtimeFixture } from "./helpers/campus-runtime-fixture.mjs";
import { id } from "./helpers/course-pilot-fixture.mjs";

// Each listener owns separate sockets/session closures; both call the actual SQL
// runtime. Fixture peer paths stand in for Next's independently verified session.
async function listener(f, options = {}, wrap = (call) => call) {
  const server = new WebSocketServer({ host: "127.0.0.1", port: 0, maxPayload: 2048 });
  await once(server, "listening");
  const sessions = new Set();
  server.on("connection", (socket, request) => {
    const index = Number(request.url.slice(1)) - 1;
    const runtime = wrap((args) => f.runtime(args.runtime_connection, args.runtime_operation,
      args.runtime_commands, args.ticket_hash, args.expected_campus, args.runtime_renew));
    const done = runVercelCampusSession(socket, f.members[index].id, runtime, options);
    sessions.add(done);
    void done.finally(() => sessions.delete(done));
  });
  return {
    url: `ws://127.0.0.1:${server.address().port}`,
    sessions,
    close: async () => {
      for (const socket of server.clients) socket.terminate();
      await Promise.all([...sessions]);
      await new Promise((resolve) => server.close(resolve));
    },
  };
}
async function join(server, peer, rawTicket, renew = false, socketOptions = {}) {
  const socket = new WebSocket(`${server.url}/${peer}`, socketOptions);
  const frames = [], waiters = new Set();
  const closed = new Promise((resolve) => socket.once("close", (code) => resolve(code)));
  const ready = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Admission timed out")), 3000);
    socket.once("open", () => socket.send(JSON.stringify({ type: "admit", ticket: rawTicket, ...(renew ? { renew: true } : {}) })));
    socket.on("error", reject);
    socket.once("close", () => { clearTimeout(timer); reject(new Error("Admission denied")); });
    socket.on("message", (data) => {
      const message = JSON.parse(data.toString());
      frames.push(message);
      for (const notify of waiters) notify(message);
      if (message.type === "ready") { clearTimeout(timer); resolve(); }
    });
  });
  await ready;
  const snapshot = (predicate) => new Promise((resolve, reject) => {
    const prior = frames.findLast((m) => ["ready", "snapshot"].includes(m.type) && predicate(m.data));
    if (prior) { resolve(prior.data); return; }
    const notify = (message) => {
      if (["ready", "snapshot"].includes(message.type) && predicate(message.data)) {
        clearTimeout(timer); waiters.delete(notify); resolve(message.data);
      }
    };
    const timer = setTimeout(() => { waiters.delete(notify); reject(new Error("Shared snapshot timed out")); }, 3000);
    waiters.add(notify);
  });
  return { socket, frames, closed, snapshot, send: (type, data) => socket.send(JSON.stringify({ type, data })) };
}

test("independent WebSocket servers share SQL world state, seating, blocks and revocation without private data", { timeout: 15000 }, async () => {
  const f = await runtimeFixture();
  const servers = [await listener(f, { intervalMs: 40 }), await listener(f, { intervalMs: 40 })];
  const tickets = [await f.issueRaw(1), await f.issueRaw(2)];
  try {
    const a = await join(servers[0], 1, tickets[0]), b = await join(servers[1], 2, tickets[1]);
    await a.snapshot((s) => s.players.length === 2);
    await b.snapshot((s) => s.players.length === 2);
    await f.db.exec("UPDATE campus_presence SET x=-4.5,z=-3");
    a.send("sit", "desk-1"); b.send("sit", "desk-1");
    const race = await b.snapshot((s) => s.occupied.length === 1);
    assert.equal(race.players.filter((p) => p.seat).length, 1);
    const owner = race.players.find((p) => p.seat);
    const seated = owner.id === f.members[0].id ? a : b;
    seated.send("action", "study");
    await a.snapshot((s) => s.players.some((p) => p.status === "studying"));
    await f.as(2, () => f.db.query("SELECT campus_block($1,true)", [f.members[0].id]));
    await b.snapshot((s) => s.players.length === 1 && s.occupied.length === 1);
    await f.as(15, () => f.db.query("SELECT campus_manage_member($1,false,false,false)", [id(1)]));
    assert.equal(await a.closed, 4003);
    await b.snapshot((s) => s.players.length === 1 && s.players[0].id === f.members[1].id);
    const wire = JSON.stringify([...a.frames, ...b.frames]);
    for (const forbidden of [...tickets, id(1), id(2), "connection_id", "ticket", "course", "grade", "email", "lease_until", "blocked"])
      assert.equal(wire.includes(forbidden), false, forbidden);
    assert.deepEqual(Object.keys(race.players[0]).sort(), ["colour", "id", "pseudonym", "rotation", "seat", "status", "x", "z"]);
  } finally {
    await Promise.all(servers.map((server) => server.close()));
    assert.equal((await f.db.query("SELECT count(*)::int AS n FROM campus_presence")).rows[0].n, 0);
    await f.db.close();
  }
});

test("socket admission, payload, message-rate and duration limits release leases", { timeout: 15000 }, async () => {
  const f = await runtimeFixture(1);
  const server = await listener(f, { intervalMs: 30, lifetimeMs: 400, admissionMs: 150 });
  try {
    const idle = new WebSocket(`${server.url}/1`);
    assert.equal((await once(idle, "close"))[0], 4003);
    for (const mode of ["extra-field", "binary", "oversize", "rate", "duration"]) {
      const peer = await join(server, 1, await f.issueRaw(1));
      if (mode === "extra-field") peer.send("input", { x: 1, z: 0, seq: 1, course: "must-not-echo" });
      if (mode === "binary") peer.socket.send(Buffer.from("probe"));
      if (mode === "oversize") peer.socket.send("x".repeat(2049));
      if (mode === "rate") for (let n = 0; n < 35; n++) peer.send("input", { x: 0, z: 0, seq: n });
      const code = await peer.closed;
      assert.equal(code, mode === "oversize" ? 1009 : mode === "duration" ? 1012 : 1008);
      await Promise.all([...server.sessions]);
      assert.equal((await f.db.query("SELECT count(*)::int AS n FROM campus_presence")).rows[0].n, 0);
      assert.equal(JSON.stringify(peer.frames).includes("must-not-echo"), false);
    }
  } finally { await server.close(); await f.db.close(); }
});

test("disconnect during a delayed admission is released after the pending operation settles", { timeout: 10000 }, async () => {
  const f = await runtimeFixture(1);
  let release, attempted;
  const gate = new Promise((resolve) => { release = resolve; });
  const started = new Promise((resolve) => { attempted = resolve; });
  const server = await listener(f, { admissionMs: 100 }, (call) => async (args) => {
    if (args.runtime_operation === "connect") { attempted(); await gate; }
    return call(args);
  });
  try {
    const socket = new WebSocket(`${server.url}/1`), closed = once(socket, "close");
    const ticket = await f.issueRaw(1);
    socket.on("open", () => socket.send(JSON.stringify({ type: "admit", ticket })));
    await started;
    assert.equal((await closed)[0], 4003);
    release();
    await Promise.all([...server.sessions]);
    assert.equal((await f.db.query("SELECT count(*)::int AS n FROM campus_presence")).rows[0].n, 0);
  } finally { release(); await server.close(); await f.db.close(); }
});

test("fresh account-bound handover preserves a seat across handlers and old cleanup cannot delete the new owner", { timeout: 10000 }, async () => {
  const f = await runtimeFixture(1);
  const servers = [await listener(f, { intervalMs: 30 }), await listener(f, { intervalMs: 30 })];
  try {
    const a = await join(servers[0], 1, await f.issueRaw(1));
    await assert.rejects(join(servers[1], 1, await f.issueRaw(1), true), /Admission denied/);
    await f.db.exec("UPDATE campus_presence SET x=-4.5,z=-3,opened_at=clock_timestamp()-interval '181 seconds'");
    a.send("sit", "desk-1");
    await a.snapshot((s) => s.occupied.length === 1);
    const b = await join(servers[1], 1, await f.issueRaw(1), true);
    const snap = await b.snapshot((s) => s.occupied.length === 1);
    assert.equal(snap.players.length, 1);
    assert.equal(snap.players[0].seat, "desk-1");
    assert.equal(await a.closed, 4003);
    await Promise.all([...servers[0].sessions]);
    assert.equal((await f.db.query("SELECT count(*)::int AS n FROM campus_presence")).rows[0].n, 1);
    b.send("action", "study");
    await b.snapshot((s) => s.players[0].status === "studying");
    await assert.rejects(join(servers[0], 1, await f.issueRaw(1), true), /Admission denied/);
  } finally { await Promise.all(servers.map((server) => server.close())); await f.db.close(); }
});

test("an RPC outage closes presence without exposing errors and expired ownership cannot occupy a seat after recovery", { timeout: 10000 }, async () => {
  const f = await runtimeFixture(1);
  let unavailable = false;
  const privateError = "private-upstream-credential-canary";
  const server = await listener(f, { intervalMs: 30 }, (call) => async (args) => {
    if (unavailable) throw new Error(privateError);
    return call(args);
  });
  try {
    const a = await join(server, 1, await f.issueRaw(1));
    await f.db.exec("UPDATE campus_presence SET x=-4.5,z=-3");
    a.send("sit", "desk-1");
    await a.snapshot((s) => s.occupied.length === 1);
    unavailable = true;
    assert.equal(await a.closed, 1011);
    await Promise.all([...server.sessions]);
    assert.equal(JSON.stringify(a.frames).includes(privateError), false);
    assert.equal((await f.db.query("SELECT count(*)::int AS n FROM campus_presence")).rows[0].n, 1,
      "failed cleanup leaves only the bounded database lease");
    await f.db.exec("UPDATE campus_presence SET lease_until=clock_timestamp()-interval '1 second'");
    unavailable = false;
    const b = await join(server, 1, await f.issueRaw(1));
    const recovered = await b.snapshot((s) => s.players.length === 1);
    assert.deepEqual(recovered.occupied, []);
    assert.equal(recovered.players[0].status, "walking");
    assert.equal(recovered.players[0].seat, null);
  } finally { unavailable = false; await server.close(); await f.db.close(); }
});

test("liveness heartbeat removes an unresponsive peer despite continued database polling, retaining a healthy peer", { timeout: 10000 }, async () => {
  const f = await runtimeFixture(2);
  const server = await listener(f, { intervalMs: 30, heartbeatMs: 50, pongTimeoutMs: 600 });
  try {
    const a = await join(server, 1, await f.issueRaw(1), false, { autoPong: false });
    const b = await join(server, 2, await f.issueRaw(2));
    await a.snapshot((s) => s.players.length === 2);
    await f.db.query("UPDATE campus_presence SET x=-4.5,z=-3 WHERE campus_id=$1", [f.members[0].id]);
    a.send("sit", "desk-1");
    await b.snapshot((s) => s.occupied.length === 1);
    let deadline;
    const outcome = await Promise.race([
      a.closed,
      new Promise((resolve) => { deadline = setTimeout(() => resolve("still-connected"), 1800); }),
    ]);
    clearTimeout(deadline);
    assert.equal(outcome, 1006, "no-pong connection must terminate rather than renew its seat forever");
    await b.snapshot((s) => s.players.length === 1 && s.occupied.length === 0);
    assert.equal(b.socket.readyState, WebSocket.OPEN, "native pong response keeps a healthy peer connected");
  } finally { await server.close(); await f.db.close(); }
});


test("expanded school fails closed against an older SQL world revision", { timeout: 10000 }, async () => {
  const f = await runtimeFixture(1);
  const server = await listener(f, {}, call => async args => {
    const result = await call(args);
    if (result.snapshot) delete result.world_revision;
    return result;
  });
  try {
    await assert.rejects(join(server, 1, await f.issueRaw(1)), /Admission denied/);
    await Promise.all([...server.sessions]);
    assert.equal((await f.db.query("SELECT count(*)::int AS n FROM campus_presence")).rows[0].n, 0);
  } finally { await server.close();await f.db.close(); }
});
