import { test } from "node:test";
import assert from "node:assert/strict";
import NodeWebSocket from "../services/campus-server/node_modules/ws/wrapper.mjs";
import { createCampusServer } from "../services/campus-server/server.mjs";
globalThis.WebSocket = NodeWebSocket;
const { Client } = await import("@colyseus/sdk");
const origin = "http://localhost:3000",
  key = "integration-service-key-".repeat(3);
const identity = (n) => ({
  id: `40000000-0000-0000-0000-${String(n).padStart(12, "0")}`,
  pseudonym: `Quiet Maple aaaa${String(n).padStart(2, "0")}`,
  colour: n % 5,
  blocked: [],
});
function until(room, predicate) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      off();
      reject(new Error("Snapshot timeout"));
    }, 4000);
    const off = room.onMessage("snapshot", (s) => {
      if (predicate(s)) {
        clearTimeout(timer);
        off();
        resolve(s);
      }
    });
  });
}

test(
  "real Colyseus transport: admission, two peers, seat race, filtering, revocation and capacity",
  { timeout: 30000 },
  async () => {
    const tickets = new Map(),
      identities = new Map();
    let next = 0;
    const issue = () => {
      const who = identity(++next),
        ticket = String(next).padStart(64, "0");
      identities.set(who.id, who);
      tickets.set(ticket, who);
      return ticket;
    };
    const campus = await createCampusServer({
      port: 2568,
      origin,
      serviceKey: key,
      verify: async (ticket) => {
        const who = tickets.get(ticket);
        tickets.delete(ticket);
        return who;
      },
      refresh: async (id) => identities.get(id),
    });
    const rooms = [];
    const client = () =>
      new Client("ws://127.0.0.1:2568", { headers: { origin } });
    try {
      assert.equal((await fetch("http://127.0.0.1:2568/health")).status, 200);
      await assert.rejects(
        new Client("ws://127.0.0.1:2568", {
          headers: { origin: "https://evil.test" },
        }).joinById("library", { ticket: issue() }),
      );
      await assert.rejects(client().create("campus", {}));
      await assert.rejects(
        client().joinById("library", { ticket: "f".repeat(64) }),
      );
      const ticket = issue(),
        a = await client().joinById("library", { ticket });
      rooms.push(a);
      await assert.rejects(client().joinById("library", { ticket }));
      const b = await client().joinById("library", { ticket: issue() });
      rooms.push(b);
      const snap = await until(a, (s) => s.players.length === 2);
      assert.doesNotMatch(
        JSON.stringify(snap),
        /user_id|email|ticket|grade|course/,
      );
      const [aid, bid] = snap.players.map((p) => p.id);
      // Two valid reservations can race before either WebSocket joins. A failed
      // duplicate must never remove the connection that actually owns the avatar.
      const duplicate = identity(99);
      identities.set(duplicate.id, duplicate);
      const reservations = [];
      for (const token of ["e".repeat(64), "d".repeat(64)]) {
        tickets.set(token, duplicate);
        const response = await fetch(
          "http://127.0.0.1:2568/matchmake/joinById/library",
          {
            method: "POST",
            headers: { origin, "content-type": "application/json" },
            body: JSON.stringify({ ticket: token }),
          },
        );
        assert.equal(response.ok, true);
        reservations.push(await response.json());
      }
      const owner = await client().consumeSeatReservation(reservations[0]);
      rooms.push(owner);
      owner.onMessage("*", () => {});
      await assert.rejects(client().consumeSeatReservation(reservations[1]));
      assert.ok(
        campus.room.world.players.has(duplicate.id),
        "failed duplicate retained the owner's presence",
      );
      await owner.leave();
      for (const id of [aid, bid])
        Object.assign(campus.room.world.players.get(id), { x: -4.5, z: -3 });
      a.send("sit", "desk-1");
      b.send("sit", "desk-1");
      const seated = await until(a, (s) => s.occupied.length === 1);
      assert.equal(seated.players.filter((p) => p.seat === "desk-1").length, 1);
      identities.get(bid).blocked = [aid];
      b.send("refresh");
      const filtered = await until(b, (s) => s.players.length === 1);
      assert.equal(filtered.players[0].id, bid);
      assert.deepEqual(
        filtered.occupied,
        ["desk-1"],
        "blocking does not make an occupied seat available",
      );
      const removal = await fetch(`http://127.0.0.1:2568/remove/${aid}`, {
        method: "POST",
        headers: { authorization: "Bearer wrong" },
      });
      assert.equal(removal.status, 401);
      identities.delete(aid);
      const left = new Promise((resolve) => a.onLeave(resolve));
      await left;
      assert.ok(
        !campus.room.world.players.has(aid),
        "periodic revocation removes active player",
      );
      // Capacity is independently enforced by the actual room transport.
      for (let i = 0; i < 9; i++)
        rooms.push(await client().joinById("library", { ticket: issue() }));
      await assert.rejects(client().joinById("library", { ticket: issue() }));
      assert.equal(campus.room.clients.length, 10);
    } finally {
      await Promise.all(
        rooms
          .filter((r) => r.connection?.isOpen)
          .map((r) => r.leave().catch(() => {})),
      );
      await campus.close();
    }
  },
);
