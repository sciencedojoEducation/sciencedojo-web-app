import { readFile } from "node:fs/promises";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { fixture, id } from "./course-pilot-fixture.mjs";
import { withBasketballRuntime } from "../../lib/campus/basketball-shared.ts";

export async function runtimeFixture(count = 2) {
  const f = await fixture();
  await f.db.exec("CREATE ROLE service_role BYPASSRLS");
  for (const file of ["070_virtual_campus.sql", "071_campus_vercel_presence.sql", "072_campus_school.sql", "073_campus_basketball.sql", "074_campus_living_cube.sql"])
    await f.db.exec(await readFile(new URL(`../../sql/${file}`, import.meta.url), "utf8"));
  await f.db.query("INSERT INTO campus_staff(user_id) VALUES($1)", [id(15)]);
  await f.db.exec("UPDATE feature_flags SET enabled=true WHERE key='virtual_campus_enabled'");
  const members = [];
  for (let n = 1; n <= count; n++) {
    await f.as(15, () => f.db.query("SELECT campus_manage_member($1,true,true,true)", [id(n)]));
    await f.as(n, () => f.db.query("SELECT campus_accept_notice('campus-adult-pilot-v1')"));
    members.push((await f.as(n, () => f.db.query("SELECT campus_self() AS value"))).rows[0].value);
  }
  const rawRuntime = (connection, operation, commands = [], ticket = null, expected = null, renew = false) =>
    f.db.transaction(async (tx) => {
      await tx.exec("SET LOCAL ROLE service_role");
      return (await tx.query("SELECT campus_runtime($1,$2,$3::jsonb,$4,$5,$6) AS value", [
        connection, operation, JSON.stringify(commands), ticket, expected, renew,
      ])).rows[0].value;
    });
  const commitBasketball = (args) => f.db.transaction(async tx => {
    await tx.exec("SET LOCAL ROLE service_role");
    return (await tx.query("SELECT campus_basketball_commit($1,$2,$3::jsonb) AS value",[args.game_connection,args.game_version,JSON.stringify(args.game_state)])).rows[0].value;
  });
  const combined = withBasketballRuntime(args => rawRuntime(args.runtime_connection,args.runtime_operation,args.runtime_commands,args.ticket_hash,args.expected_campus,args.runtime_renew),commitBasketball);
  const runtime = (connection,operation,commands=[],ticket=null,expected=null,renew=false)=>combined({runtime_connection:connection,runtime_operation:operation,runtime_commands:commands,ticket_hash:ticket,expected_campus:expected,runtime_renew:renew});
  const issue = async (n, raw = randomBytes(32).toString("hex"), begin = true) => {
    const hash = createHash("sha256").update(raw).digest("hex");
    await f.db.query("UPDATE campus_members SET last_admission=NULL WHERE user_id=$1", [id(n)]);
    await f.as(n, () => f.db.query("SELECT campus_issue_ticket($1)", [hash]));
    if (begin) await f.as(n, () => f.db.query("SELECT campus_begin_socket()"));
    return hash;
  };
  const connect = async (n, connection = randomUUID()) => ({
    connection,
    result: await runtime(connection, "connect", [], await issue(n), members[n - 1].id),
  });
  const issueRaw = async (n) => {
    const raw = randomBytes(32).toString("hex");
    await issue(n, raw);
    return raw;
  };
  return { ...f, members, runtime, rawRuntime, commitBasketball, issue, issueRaw, connect };
}
