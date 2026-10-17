import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { runtimeFixture } from "./helpers/campus-runtime-fixture.mjs";
import { id } from "./helpers/course-pilot-fixture.mjs";
import { SEATS, WORLD } from "../lib/campus/protocol.ts";

test("shared runtime reuses one-use, account-bound admission and denies direct runtime access", async () => {
  const f = await runtimeFixture();
  try {
    for (const role of ["anon", "authenticated", "service_role"]) {
      await f.db.exec(`SET ROLE ${role}`);
      await assert.rejects(f.db.query("SELECT * FROM campus_presence"), /permission denied/);
      await assert.rejects(f.db.query("UPDATE campus_runtime_lock SET room='library'"), /permission denied/);
      if (role !== "service_role") await assert.rejects(
        f.db.query("SELECT campus_runtime($1,'step')", [randomUUID()]), /permission denied/);
      if (role === "anon") await assert.rejects(f.db.query("SELECT campus_begin_socket()"), /permission denied/);
      await f.db.exec("RESET ROLE");
    }
    const hash = await f.issue(1), connection = randomUUID();
    assert.deepEqual(await f.runtime(connection, "connect", [], hash, f.members[1].id), { ended: true });
    assert.deepEqual(await f.runtime(connection, "connect", [], hash, f.members[0].id), { ended: true });
    const unclaimed = await f.issue(1, undefined, false);
    assert.deepEqual(await f.runtime(connection, "connect", [], unclaimed, f.members[0].id), { ended: true });
    assert.equal((await f.as(2, () => f.db.query("SELECT campus_begin_socket() AS allowed"))).rows[0].allowed, false);
    assert.equal((await f.as(1, () => f.db.query("SELECT campus_begin_socket() AS allowed"))).rows[0].allowed, true);
    assert.equal((await f.as(1, () => f.db.query("SELECT campus_begin_socket() AS allowed"))).rows[0].allowed, false);
    const a = await f.connect(1);
    assert.equal(a.result.snapshot.players.length, 1);
    assert.equal(a.result.snapshot.self, f.members[0].id);
    assert.match((await f.connect(1)).result.error, /another tab/);
    assert.deepEqual(await f.runtime(randomUUID(), "step"), { ended: true });
    const payload = JSON.stringify(a.result);
    for (const privateValue of [connection, hash, id(1), "connection_id", "lease_until", "input_x", "user_id", "email", "blocked", "course"])
      assert.equal(payload.includes(privateValue), false, privateValue);
    const rows = (await f.db.query("SELECT relname,relrowsecurity FROM pg_class WHERE relname IN ('campus_presence','campus_runtime_lock')")).rows;
    assert.equal(rows.length, 2);
    assert.ok(rows.every((row) => row.relrowsecurity));
  } finally { await f.db.close(); }
});

test("all instances share atomic seats, capacity, per-viewer blocks and stale-connection cleanup", async () => {
  const f = await runtimeFixture(11);
  try {
    const a = await f.connect(1), b = await f.connect(2);
    await f.db.query("UPDATE campus_presence SET x=$1,z=$2", [SEATS[0].x, SEATS[0].z]);
    const raced = await Promise.all([a, b].map((p) => f.runtime(p.connection, "step", [{ type: "sit", data: SEATS[0].id }])));
    assert.equal(raced[1].snapshot.players.filter((p) => p.seat === SEATS[0].id).length, 1);
    await f.as(2, () => f.db.query("SELECT campus_block($1,true)", [f.members[0].id]));
    const filtered = (await f.runtime(b.connection, "step")).snapshot;
    assert.deepEqual(filtered.players.map((p) => p.id), [f.members[1].id]);
    assert.deepEqual(filtered.occupied, [SEATS[0].id]);
    assert.equal((await f.runtime(a.connection, "step", [{ type: "action", data: "study" }])).snapshot.players.find((p) => p.id === f.members[0].id).status, "studying");
    for (let n = 3; n <= 10; n++) assert.ok((await f.connect(n)).result.snapshot);
    assert.match((await f.connect(11)).result.error, /full/);
    await f.db.query("UPDATE campus_presence SET lease_until=clock_timestamp()-interval '1 second' WHERE connection_id=$1", [a.connection]);
    const next = await f.connect(11);
    assert.equal(next.result.snapshot.players.length, 10);
    assert.deepEqual(next.result.snapshot.occupied, []);
    assert.deepEqual(await f.runtime(a.connection, "step"), { ended: true });
    assert.deepEqual(await f.runtime(a.connection, "leave"), { ended: true });
    assert.equal((await f.runtime(next.connection, "step")).snapshot.players.length, 10);
    await f.runtime(next.connection, "leave");
    assert.equal((await f.db.query("SELECT count(*)::int AS n FROM campus_presence")).rows[0].n, 9);
  } finally { await f.db.close(); }
});

test("shared SQL simulation enforces the established speed, bounds, replay and stale-input rules", async () => {
  const f = await runtimeFixture(1);
  try {
    const a = await f.connect(1);
    const command = (x, z, seq) => ({ type: "input", data: { x, z, seq } });
    for (const data of [{ x: 2, z: 0, seq: 0 }, { x: null, z: 0, seq: 0 }, { x: 1, z: 0, seq: 0, course: "private" }, { x: 1, z: 0, seq: 0.5 }])
      await f.runtime(a.connection, "step", [{ type: "input", data }]);
    let row = (await f.db.query("SELECT * FROM campus_presence")).rows[0];
    assert.equal(row.sequence, -1);
    await f.runtime(a.connection, "step", [command(1, 1, 2)]);
    await f.runtime(a.connection, "step", [command(-1, -1, 2)]);
    row = (await f.db.query("SELECT * FROM campus_presence")).rows[0];
    assert.equal(row.input_x, 1, "replayed sequence cannot reverse movement");
    await f.db.exec("UPDATE campus_presence SET x=0,z=0,input_at=clock_timestamp()-interval '2 seconds',simulated_at=clock_timestamp()-interval '2 seconds'");
    const moved = (await f.runtime(a.connection, "step")).snapshot.players[0];
    assert.ok(Math.abs(moved.x - WORLD.speed * 0.35 / Math.sqrt(2)) < 0.002);
    assert.ok(Math.abs(moved.z - moved.x) < 0.002);
    const stopped = (await f.runtime(a.connection, "step")).snapshot.players[0];
    assert.equal(stopped.x, moved.x);
    await f.db.exec("UPDATE campus_presence SET x=8.99,z=6.99,input_at=clock_timestamp(),simulated_at=clock_timestamp()-interval '1 second'");
    const bounded = (await f.runtime(a.connection, "step")).snapshot.players[0];
    assert.ok(bounded.x <= WORLD.maxX && bounded.z <= WORLD.maxZ);
    assert.equal((await f.runtime(a.connection, "step", [{ type: "sit", data: SEATS[0].id }])).snapshot.occupied.length, 0, "distant seating denied");
    // Every constrained seat has the same fixed coordinates as the established protocol.
    for (const seat of SEATS) {
      await f.db.query("UPDATE campus_presence SET x=$1,z=$2,rate_count=0", [seat.x, seat.z]);
      const seated = (await f.runtime(a.connection, "step", [{ type: "sit", data: seat.id }])).snapshot.players[0];
      assert.equal(seated.x, seat.x); assert.equal(seated.z, seat.z);
      assert.equal(seated.seat, seat.id);
      await f.runtime(a.connection, "step", [{ type: "action", data: "stand" }]);
    }
  } finally { await f.db.close(); }
});

test("revocation, switch-off, invalid pseudonyms and expired leases remove presence without restoring old ownership", async () => {
  const f = await runtimeFixture();
  try {
    const a = await f.connect(1), b = await f.connect(2);
    await f.as(15, () => f.db.query("SELECT campus_manage_member($1,false,false,false)", [id(1)]));
    assert.equal((await f.runtime(b.connection, "step")).snapshot.players.length, 1);
    assert.deepEqual(await f.runtime(a.connection, "step"), { ended: true });
    await f.db.query("UPDATE campus_members SET pseudonym='Private learner name' WHERE campus_id=$1", [f.members[1].id]);
    assert.deepEqual(await f.runtime(b.connection, "step"), { ended: true });
    await f.db.query("UPDATE campus_members SET pseudonym='Quiet Maple aaaa02' WHERE campus_id=$1", [f.members[1].id]);
    const fresh = await f.connect(2);
    await f.runtime(b.connection, "leave");
    assert.equal((await f.runtime(fresh.connection, "step")).snapshot.players.length, 1);
    const pendingHash = await f.issue(2);
    await f.db.exec("UPDATE feature_flags SET enabled=false WHERE key='virtual_campus_enabled'");
    assert.deepEqual(await f.runtime(fresh.connection, "step"), { ended: true });
    assert.equal((await f.db.query("SELECT count(*)::int AS n FROM campus_presence")).rows[0].n, 0);
    assert.deepEqual(await f.runtime(randomUUID(), "connect", [], pendingHash, f.members[1].id), { ended: true });
  } finally { await f.db.close(); }
});
