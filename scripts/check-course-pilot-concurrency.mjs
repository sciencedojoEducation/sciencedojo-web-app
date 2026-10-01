// Uses a fresh local cluster only. Never connects to a staging or production database.
// Install embedded-postgres and pg in a temporary directory and pass that directory.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";
import {
  fixture,
  course,
  internal,
  id,
} from "../tests/helpers/course-pilot-fixture.mjs";

const runtime = process.argv[2];
if (!runtime)
  throw new Error(
    "Usage: node scripts/check-course-pilot-concurrency.mjs /absolute/path/to/temporary/npm/runtime",
  );
const requireRuntime = createRequire(join(runtime, "package.json"));
const EmbeddedPostgres = requireRuntime("embedded-postgres").default;
const { Client } = requireRuntime("pg");
const probe = createServer();
await new Promise((resolve) => probe.listen(0, "127.0.0.1", resolve));
const port = probe.address().port;
await new Promise((resolve) => probe.close(resolve));
const postgres = new EmbeddedPostgres({
  databaseDir: await mkdtemp(join(tmpdir(), "course-pilot-pg-")),
  port,
  user: "postgres",
  password: "local-test-only",
  persistent: false,
  createPostgresUser: false,
  postgresFlags: ["-c", "listen_addresses=127.0.0.1"],
  onLog: () => {},
  onError: () => {},
});
const clients = [];
let started = false;
try {
  await postgres.initialise();
  await postgres.start();
  started = true;
  for (let n = 0; n < 3; n++) {
    const client = new Client({
      host: "127.0.0.1",
      port,
      user: "postgres",
      password: "local-test-only",
      database: "postgres",
    });
    await client.connect();
    clients.push(client);
  }
  const [owner, first, second] = clients;
  const setup = await fixture({
    exec: (sql) => owner.query(sql),
    query: (sql, params) => owner.query(sql, params),
  });
  for (let n = 1; n <= 9; n++) await setup.join(n);
  async function identity(client, n) {
    await client.query("SET ROLE authenticated");
    await client.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [
      id(n),
    ]);
  }
  async function checkBlocked(pid) {
    for (let n = 0; n < 30; n++) {
      const result = await owner.query(
        "SELECT wait_event_type FROM pg_stat_activity WHERE pid=$1",
        [pid],
      );
      if (result.rows[0]?.wait_event_type === "Lock") return;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    throw new Error("Competing request did not wait on the course row lock");
  }
  await identity(first, 10);
  await identity(second, 11);
  const firstPid = (await first.query("SELECT pg_backend_pid() AS pid")).rows[0]
    .pid;
  const secondPid = (await second.query("SELECT pg_backend_pid() AS pid"))
    .rows[0].pid;
  await first.query("BEGIN");
  assert.equal(
    (await first.query("SELECT course_pilot_join('pilot',false) AS status"))
      .rows[0].status,
    "enrolled",
  );
  const contender = second.query(
    "SELECT course_pilot_join('pilot',false) AS status",
  );
  await checkBlocked(secondPid);
  await first.query("COMMIT");
  assert.equal((await contender).rows[0].status, "waitlisted");
  assert.equal(
    (
      await owner.query(
        "SELECT count(*)::int AS n FROM course_pilot_memberships WHERE course_id=$1 AND status='enrolled'",
        [course],
      )
    ).rows[0].n,
    10,
  );
  console.log(
    "PASS: two connections contest the last place; second waits, then becomes waitlisted. Exactly 10 enrolled.",
  );

  await identity(first, 12);
  await identity(second, 12);
  const duplicates = await Promise.all([
    first.query("SELECT course_pilot_join('pilot',false) AS status"),
    second.query("SELECT course_pilot_join('pilot',false) AS status"),
  ]);
  assert.deepEqual(
    duplicates.map((r) => r.rows[0].status),
    ["waitlisted", "waitlisted"],
  );
  assert.equal(
    (
      await owner.query(
        "SELECT count(*)::int AS n FROM course_pilot_memberships WHERE course_id=$1 AND user_id=$2",
        [course, id(12)],
      )
    ).rows[0].n,
    1,
  );
  console.log("PASS: concurrent duplicate requests create one membership.");

  await owner.query(
    "INSERT INTO course_pilot_listings(course_id,listed) VALUES($1,true)",
    [internal],
  );
  for (let n = 1; n <= 9; n++)
    await owner.query(
      "INSERT INTO course_pilot_memberships(course_id,user_id,status,enrolled_at) VALUES($1,$2,'enrolled',now())",
      [internal, id(n)],
    );
  await owner.query(
    "INSERT INTO course_pilot_memberships(course_id,user_id,status) VALUES($1,$2,'waitlisted')",
    [internal, id(12)],
  );
  await identity(first, 10);
  await identity(second, 15);
  await second.query("BEGIN");
  await second.query("SELECT course_pilot_promote($1,$2)", [internal, id(12)]);
  const claim = first.query(
    "SELECT course_pilot_join('internal',false) AS status",
  );
  await checkBlocked(firstPid);
  await second.query("COMMIT");
  assert.equal((await claim).rows[0].status, "waitlisted");
  assert.equal(
    (
      await owner.query(
        "SELECT count(*)::int AS n FROM course_pilot_memberships WHERE course_id=$1 AND status='enrolled'",
        [internal],
      )
    ).rows[0].n,
    10,
  );
  console.log(
    "PASS: manual promotion and enrollment share the same lock and cannot exceed 10 places.",
  );
} finally {
  await Promise.allSettled(clients.map((c) => c.end()));
  if (started) await postgres.stop();
}
