import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fixture, id } from "./helpers/course-pilot-fixture.mjs";
const hash = "a".repeat(64);
async function setup() {
  const f = await fixture();
  await f.db.exec("CREATE ROLE service_role BYPASSRLS");
  await f.db.exec(
    await readFile(
      new URL("../sql/070_virtual_campus.sql", import.meta.url),
      "utf8",
    ),
  );
  return f;
}
async function service(db, sql, args = []) {
  await db.exec("SET ROLE service_role");
  try {
    return await db.query(sql, args);
  } finally {
    await db.exec("RESET ROLE");
  }
}
async function invite(f, n) {
  await f.as(15, () =>
    f.db.query("SELECT campus_manage_member($1,true,true,true)", [id(n)]),
  );
  await f.as(n, () =>
    f.db.query("SELECT campus_accept_notice('campus-adult-pilot-v1')"),
  );
  return (await f.as(n, () => f.db.query("SELECT campus_self() AS identity")))
    .rows[0].identity;
}

test("campus defaults closed; only reviewed invite and notice allow one-use service-only admission", async () => {
  const f = await setup();
  try {
    const a = await invite(f, 1);
    await assert.rejects(
      f.as(1, () => f.db.query("SELECT campus_issue_ticket($1)", [hash])),
      /unavailable/,
    );
    await f.db.exec(
      "UPDATE feature_flags SET enabled=true WHERE key='virtual_campus_enabled'",
    );
    await assert.rejects(
      f.as(2, () =>
        f.db.query("SELECT campus_accept_notice('campus-adult-pilot-v1')"),
      ),
      /invitation/,
    );
    await assert.rejects(
      f.as(2, () =>
        f.db.query("SELECT campus_manage_member($1,true,true,true)", [id(2)]),
      ),
      /Admin/,
    );
    await f.as(1, () => f.db.query("SELECT campus_issue_ticket($1)", [hash]));
    await assert.rejects(
      f.as(1, () => f.db.query("SELECT campus_redeem_ticket($1)", [hash])),
      /permission denied/,
    );
    assert.deepEqual(
      (
        await service(f.db, "SELECT campus_redeem_ticket($1) AS identity", [
          hash,
        ])
      ).rows[0].identity,
      { id: a.id, pseudonym: a.pseudonym, colour: a.colour, blocked: [] },
    );
    assert.equal(
      (
        await service(f.db, "SELECT campus_redeem_ticket($1) AS identity", [
          hash,
        ])
      ).rows[0].identity,
      null,
    );
    await f.db.query(
      "UPDATE campus_members SET last_admission=NULL WHERE user_id=$1",
      [id(1)],
    );
    await f.as(1, () => f.db.query("SELECT campus_issue_ticket($1)", [hash]));
    await assert.rejects(
      f.as(1, () =>
        f.db.query("SELECT campus_issue_ticket($1)", ["b".repeat(64)]),
      ),
      /wait/,
    );
    await f.db.exec(
      "UPDATE campus_tickets SET expires_at=now()-interval '1 minute'",
    );
    assert.equal(
      (
        await service(f.db, "SELECT campus_redeem_ticket($1) AS identity", [
          hash,
        ])
      ).rows[0].identity,
      null,
    );
  } finally {
    await f.db.close();
  }
});
test("real RLS isolates mapping, reports, blocks and audit; spoofed metadata grants nothing", async () => {
  const f = await setup();
  try {
    const a = await invite(f, 1),
      b = await invite(f, 2);
    await f.db.exec(
      "UPDATE feature_flags SET enabled=true WHERE key='virtual_campus_enabled'",
    );
    await f.as(1, async () => {
      assert.equal(
        (await f.db.query("SELECT * FROM campus_members")).rows.length,
        0,
      );
      await assert.rejects(
        f.db.query("UPDATE campus_members SET enabled=true"),
        /permission denied/,
      );
      await assert.rejects(
        f.db.query("SELECT * FROM campus_tickets"),
        /permission denied/,
      );
      await f.db.query("SELECT campus_block($1,true)", [b.id]);
      await f.db.query("SELECT campus_report($1,'harassment')", [b.id]);
      assert.equal(
        (await f.db.query("SELECT * FROM campus_reports")).rows.length,
        0,
      );
      assert.equal(
        (await f.db.query("SELECT * FROM campus_audit")).rows.length,
        0,
      );
      await f.db.query(
        'SELECT set_config(\'request.jwt.claims\',\'{"user_metadata":{"role":"admin"}}\',false)',
      );
      await assert.rejects(
        f.db.query("SELECT campus_manage_member($1,true,true,true)", [id(3)]),
        /Admin/,
      );
    });
    await f.as(2, async () => {
      assert.equal(
        (await f.db.query("SELECT * FROM campus_blocks")).rows.length,
        0,
      );
    });
    assert.deepEqual(
      (
        await service(f.db, "SELECT campus_service_identity($1) AS identity", [
          a.id,
        ])
      ).rows[0].identity.blocked,
      [b.id],
    );
    await f.as(15, async () => {
      assert.equal(
        (await f.db.query("SELECT * FROM campus_members")).rows.length,
        2,
      );
      const r = (await f.db.query("SELECT * FROM campus_reports")).rows[0];
      await f.db.query("SELECT campus_resolve_report($1)", [r.id]);
    });
    await f.db.exec("SET ROLE anon");
    await assert.rejects(
      f.db.query("SELECT campus_self()"),
      /permission denied/,
    );
    await f.db.exec("RESET ROLE");
  } finally {
    await f.db.close();
  }
});
test("revocation, suspension, unverified users, switch-off and report abuse all fail closed", async () => {
  const f = await setup();
  try {
    const a = await invite(f, 1),
      b = await invite(f, 2);
    await f.db.exec(
      "UPDATE feature_flags SET enabled=true WHERE key='virtual_campus_enabled'",
    );
    for (let n = 0; n < 5; n++)
      await f.as(1, () =>
        f.db.query("SELECT campus_report($1,'other')", [b.id]),
      );
    await assert.rejects(
      f.as(1, () => f.db.query("SELECT campus_report($1,'other')", [b.id])),
      /limit/,
    );
    await f.db.query("UPDATE profiles SET is_suspended=true WHERE id=$1", [
      id(1),
    ]);
    assert.equal(
      (
        await service(f.db, "SELECT campus_service_identity($1) AS identity", [
          a.id,
        ])
      ).rows[0].identity,
      null,
    );
    await f.db.query("UPDATE profiles SET is_suspended=false WHERE id=$1", [
      id(1),
    ]);
    await f.db.query(
      "UPDATE auth.users SET email_confirmed_at=NULL WHERE id=$1",
      [id(1)],
    );
    await assert.rejects(
      f.as(1, () => f.db.query("SELECT campus_issue_ticket($1)", [hash])),
      /unavailable/,
    );
    await f.as(15, () =>
      f.db.query("SELECT campus_manage_member($1,false,false,false)", [id(2)]),
    );
    assert.equal(
      (
        await service(f.db, "SELECT campus_service_identity($1) AS identity", [
          b.id,
        ])
      ).rows[0].identity,
      null,
    );
    await f.db.exec(
      "UPDATE feature_flags SET enabled=false WHERE key='virtual_campus_enabled'",
    );
    assert.equal(
      (
        await service(f.db, "SELECT campus_service_identity($1) AS identity", [
          a.id,
        ])
      ).rows[0].identity,
      null,
    );
  } finally {
    await f.db.close();
  }
});
