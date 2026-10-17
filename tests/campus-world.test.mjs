import { test } from "node:test";
import assert from "node:assert/strict";
import { admissionLimiter } from "../services/campus-server/admission-limit.mjs";
import { CampusWorld } from "../lib/campus/world.ts";
import { isInput, isSnapshot, SEATS } from "../lib/campus/protocol.ts";
import {
  hashTicket,
  validServiceKey,
  sameOrigin,
  readCampusJson,
} from "../lib/campus/security.ts";
const identity = (n) => ({
  id: `40000000-0000-0000-0000-${String(n).padStart(12, "0")}`,
  pseudonym: `Quiet Maple aaaa${String(n).padStart(2, "0")}`,
  colour: n % 5,
  blocked: [],
  email: "private@example.test",
  course: "secret-course",
  grade: 99,
});

test("snapshot validation rejects leaked fields, duplicate identities and invalid world state", () => {
  const world = new CampusWorld(); world.join(identity(1));
  const valid = world.snapshot(identity(1).id);
  assert.equal(isSnapshot(valid), true);
  for (const mutate of [
    (s) => { s.players[0].email = "private@example.test"; },
    (s) => { s.players.push({ ...s.players[0] }); },
    (s) => { s.players[0].x = Infinity; },
    (s) => { s.players[0].seat = "invented"; },
    (s) => { s.players[0].status = "studying"; },
    (s) => { s.self = "not-a-present-campus-id"; },
    (s) => { s.occupied = ["desk-1", "desk-1"]; },
  ]) {
    const value = structuredClone(valid); mutate(value);
    assert.equal(isSnapshot(value), false);
  }
});

test("admission limits bound single-source and distributed traffic and reset after a minute", () => {
  const allow = admissionLimiter("temporary-test-salt");
  for (let n = 0; n < 60; n++) assert.equal(allow("one-address", 100000), true);
  assert.equal(allow("one-address", 100000), false);
  for (let n = 0; n < 59; n++) assert.equal(allow(`other-${n}`, 100000), true);
  assert.equal(allow("new-address", 100000), false);
  assert.equal(allow("one-address", 160001), true);
});

test("campus JSON reading bounds actual bytes and rejects malformed or non-object requests", async () => {
  const request = (body) =>
    new Request("https://example.test/api", { method: "POST", body });
  assert.deepEqual(await readCampusJson(request('{"action":"block"}')), {
    action: "block",
  });
  assert.equal(await readCampusJson(request("[]")), null);
  assert.equal(await readCampusJson(request("{")), null);
  assert.equal(
    await readCampusJson(request(JSON.stringify({ data: "x".repeat(3000) }))),
    null,
  );
});

test("movement is authoritative, bounded, rate limited and rejects replay and extra fields", () => {
  const world = new CampusWorld(),
    p = identity(1);
  world.join(p);
  for (const bad of [
    { x: Infinity, z: 0, seq: 0 },
    { x: 0, z: 0, seq: 0, email: "leak" },
    { x: 2, z: 0, seq: 0 },
    { x: 0, z: NaN, seq: 0 },
  ])
    assert.equal(isInput(bad), false);
  assert.equal(world.input(p.id, { x: 1, z: 0, seq: 1 }, 0), true);
  assert.equal(world.input(p.id, { x: 1, z: 0, seq: 1 }, 0), false);
  const start = world.players.get(p.id).x;
  world.step(10, 100);
  assert.equal(world.players.get(p.id).x, start + 0.3);
  world.step(1, 500);
  assert.equal(world.players.get(p.id).x, start + 0.3, "stale movement stops");
  for (let i = 2; i < 80; i++) world.input(p.id, { x: 1, z: 0, seq: i }, 100);
  assert.equal(world.input(p.id, { x: 1, z: 0, seq: 100 }, 100), false);
  for (let i = 1; i <= 100; i++) {
    world.input(p.id, { x: 1, z: 1, seq: 100 + i }, i * 1000);
    world.step(0.1, i * 1000);
  }
  assert.ok(world.players.get(p.id).x <= 9 && world.players.get(p.id).z <= 7);
});
test("seat race, study states, block filtering, copies, cleanup and no identity leakage", () => {
  const w = new CampusWorld(),
    a = identity(1),
    b = identity(2);
  w.join(a);
  w.join(b);
  assert.equal(w.sit(a.id, SEATS[0].id), false, "distant sit denied");
  for (const id of [a.id, b.id])
    Object.assign(w.players.get(id), { x: SEATS[0].x, z: SEATS[0].z });
  assert.equal(w.sit(a.id, SEATS[0].id), true);
  assert.equal(w.sit(b.id, SEATS[0].id), false);
  assert.equal(w.status(a.id, "study"), true);
  assert.equal(w.players.get(a.id).status, "studying");
  assert.equal(w.input(a.id, { x: 1, z: 0, seq: 1 }, 0), false);
  w.blocks.set(b.id, new Set([a.id]));
  const snap = w.snapshot(b.id);
  assert.equal(snap.players.length, 1);
  assert.deepEqual(snap.occupied, [SEATS[0].id]);
  assert.doesNotMatch(
    JSON.stringify(w.snapshot(a.id)),
    /private@|secret-course|email|grade|blocked/,
  );
  snap.players[0].x = 999;
  assert.notEqual(w.players.get(b.id).x, 999);
  assert.equal(w.status(a.id, "close"), true);
  assert.equal(w.status(a.id, "stand"), true);
  assert.equal(w.sit(b.id, SEATS[0].id), true);
  w.remove(b.id);
  assert.deepEqual(w.snapshot(a.id).occupied, []);
});
test("capacity and duplicate identities never create extra instances", () => {
  const w = new CampusWorld();
  for (let i = 1; i <= 10; i++) w.join(identity(i));
  assert.throws(() => w.join(identity(1)), /Already/);
  assert.throws(() => w.join(identity(11)), /full/);
});
test("ticket hashing, constant-time service authorization and exact same-origin mutations", () => {
  const key = "k".repeat(40);
  assert.equal(hashTicket("x"), hashTicket("x"));
  assert.equal(hashTicket("x").length, 64);
  assert.ok(validServiceKey(`Bearer ${key}`, key));
  assert.equal(validServiceKey("Bearer nope", key), false);
  assert.equal(validServiceKey(null, key), false);
  assert.equal(
    sameOrigin(
      new Request("https://example.test/api", {
        headers: { origin: "https://example.test" },
      }),
    ),
    true,
  );
  assert.equal(
    sameOrigin(
      new Request("https://example.test/api", {
        headers: { origin: "https://evil.test" },
      }),
    ),
    false,
  );
});
