import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { deliverBusinessEnquiryWithDeadline, handleBusinessEnquirySubmission, processBusinessEnquiryNotifications } from "../lib/business-enquiry-service.ts";
import { businessEnquiryHash } from "../lib/business-enquiry-security.ts";

const hash = (character) => character.repeat(64);
async function fixture() {
  const db = new PGlite();
  await db.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; GRANT USAGE ON SCHEMA public TO anon,authenticated,service_role;");
  await db.exec(await readFile(new URL("../sql/068_business_enquiries.sql", import.meta.url), "utf8"));
  const receive = async (options = {}) => {
    const values = { id: randomUUID(), name: "Alex Example", email: "alex@example.com", organisation: "Example IT", goal: "Prepare a handover", timing: "", ip: hash("a"), emailHash: hash("b"), payload: hash("c"), ...options };
    const { rows } = await db.query("SELECT * FROM receive_business_enquiry($1,$2,$3,$4,$5,$6,$7,$8,$9)", Object.values(values));
    return rows[0];
  };
  const claim = async (id = null) => (await db.query("SELECT * FROM claim_business_enquiry_notifications($1,10)", [id])).rows;
  const finish = async (row, success = true, messageId = "provider-123") => (await db.query(
    "SELECT finish_business_enquiry_notification($1,$2,$3,$4,$5) AS updated", [row.id, row.notification_lease_token, success, success ? messageId : null, success ? null : "provider-error"],
  )).rows[0].updated;
  return { db, receive, claim, finish };
}

test("migration locks tables and every enquiry RPC away from public and authenticated clients", async () => {
  const { db } = await fixture();
  try {
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`SET ROLE ${role}`);
      for (const table of ["business_enquiries", "business_enquiry_rate_limits"]) {
        await assert.rejects(db.query(`SELECT * FROM ${table}`), /permission denied/);
        await assert.rejects(db.query(`DELETE FROM ${table}`), /permission denied/);
      }
      await assert.rejects(db.query("SELECT * FROM claim_business_enquiry_notifications()"), /permission denied/);
      await assert.rejects(db.query("SELECT finish_business_enquiry_notification($1,$2,false)", [randomUUID(), randomUUID()]), /permission denied/);
      await assert.rejects(db.query("SELECT * FROM receive_business_enquiry($1,'A','a@example.com','IT','Handover','',$2,$3,$4)", [randomUUID(), hash("a"), hash("b"), hash("c")]), /permission denied/);
      await db.exec("RESET ROLE");
    }
    await db.exec("SET ROLE service_role");
    assert.equal((await db.query("SELECT * FROM claim_business_enquiry_notifications()")).rows.length, 0);
  } finally { await db.close(); }
});

test("database saves once for a repeated token, rejects changed payload, and avoids duplicate rate consumption", async () => {
  const { db, receive } = await fixture();
  try {
    const id = randomUUID();
    assert.equal((await receive({ id })).outcome, "saved");
    for (let n = 0; n < 8; n++) assert.equal((await receive({ id })).outcome, "duplicate");
    assert.equal((await receive({ id, payload: hash("d") })).outcome, "conflict");
    assert.equal((await db.query("SELECT count(*)::integer AS total FROM business_enquiries")).rows[0].total, 1);
    assert.deepEqual((await db.query("SELECT attempts FROM business_enquiry_rate_limits")).rows.map((r) => r.attempts), [1, 1]);
  } finally { await db.close(); }
});

test("email and IP counters enforce distinct limits atomically and expiry permits a fresh window", async () => {
  const { db, receive } = await fixture();
  try {
    for (let n = 0; n < 3; n++) assert.equal((await receive()).outcome, "saved");
    assert.equal((await receive()).outcome, "limited");
    assert.equal((await receive({ emailHash: hash("d") })).outcome, "saved");
    assert.equal((await receive({ emailHash: hash("e") })).outcome, "saved");
    assert.equal((await receive({ emailHash: hash("f") })).outcome, "limited");
    assert.equal((await db.query("SELECT count(*)::integer AS total FROM business_enquiries")).rows[0].total, 5);
    await db.exec("UPDATE business_enquiry_rate_limits SET window_start=window_start-interval '20 minutes'");
    assert.equal((await receive()).outcome, "saved");
  } finally { await db.close(); }
});

test("invalid hash and invalid field length fail without creating records or consuming a rate counter", async () => {
  const { db, receive } = await fixture();
  try {
    await assert.rejects(receive({ ip: "raw-ip-address" }), /Invalid enquiry metadata/);
    await assert.rejects(receive({ name: "x".repeat(101) }), /check constraint/);
    assert.equal((await db.query("SELECT count(*)::integer AS total FROM business_enquiry_rate_limits")).rows[0].total, 0);
  } finally { await db.close(); }
});

test("daily queue processing expires old abuse hashes even when no new enquiry arrives", async () => {
  const { db, receive, claim } = await fixture();
  try {
    await receive();
    await db.exec("UPDATE business_enquiry_rate_limits SET window_start=now()-interval '2 days'");
    await claim();
    assert.equal((await db.query("SELECT count(*)::integer AS total FROM business_enquiry_rate_limits")).rows[0].total, 0);
    assert.equal((await db.query("SELECT count(*)::integer AS total FROM business_enquiries")).rows[0].total, 1);
  } finally { await db.close(); }
});

test("a notification can only be claimed once; finish requires the current lease and provider ID", async () => {
  const { db, receive, claim, finish } = await fixture();
  try {
    const { enquiry_id: id } = await receive();
    const [first] = await claim(id);
    assert.equal(first.notification_attempts, 1);
    assert.equal((await claim(id)).length, 0);
    assert.equal(await finish({ ...first, notification_lease_token: randomUUID() }), false);
    await assert.rejects(finish(first, true, ""), /requires a message ID/);
    assert.equal(await finish(first), true);
    assert.equal((await claim(id)).length, 0);
    const saved = (await db.query("SELECT * FROM business_enquiries WHERE id=$1", [id])).rows[0];
    assert.equal(saved.notification_status, "sent");
    assert.equal(saved.provider_message_id, "provider-123");
    assert.ok(saved.notified_at);
  } finally { await db.close(); }
});

test("failed deliveries back off and exhaust after five attempts while retaining the original enquiry", async () => {
  const { db, receive, claim, finish } = await fixture();
  try {
    const { enquiry_id: id } = await receive();
    for (let n = 1; n <= 5; n++) {
      const [row] = await claim(id);
      assert.equal(row.notification_attempts, n);
      assert.equal(await finish(row, false), true);
      const saved = (await db.query("SELECT * FROM business_enquiries WHERE id=$1", [id])).rows[0];
      assert.equal(saved.notification_status, n < 5 ? "queued" : "exhausted");
      assert.equal(saved.notification_error_code, "provider-error");
      assert.equal((await claim(id)).length, 0);
      await db.query("UPDATE business_enquiries SET next_notification_at=now()-interval '1 second' WHERE id=$1", [id]);
    }
    assert.equal((await claim(id)).length, 0);
    assert.equal((await db.query("SELECT name FROM business_enquiries WHERE id=$1", [id])).rows[0].name, "Alex Example");
  } finally { await db.close(); }
});

test("expired lease is recoverable, stale worker cannot overwrite the newer result, and retry window is bounded", async () => {
  const { db, receive, claim, finish } = await fixture();
  try {
    const { enquiry_id: id } = await receive();
    const [first] = await claim(id);
    await db.query("UPDATE business_enquiries SET notification_lease_expires_at=now()-interval '1 minute' WHERE id=$1", [id]);
    const [second] = await claim(id);
    assert.equal(second.notification_attempts, 2);
    assert.notEqual(second.notification_lease_token, first.notification_lease_token);
    assert.equal(await finish(first), false);
    assert.equal(await finish(second, false), true);
    await db.query("UPDATE business_enquiries SET created_at=now()-interval '8 days' WHERE id=$1", [id]);
    assert.equal((await claim(id)).length, 0);
    const saved = (await db.query("SELECT notification_status,notification_error_code FROM business_enquiries WHERE id=$1", [id])).rows[0];
    assert.equal(saved.notification_status, "exhausted");
    assert.equal(saved.notification_error_code, "retry-window-expired");
  } finally { await db.close(); }
});

test("complete submission saves privately, reaches the staff transport, confirms receipt, and double submission sends once", async () => {
  const { db, receive, claim, finish } = await fixture();
  const delivered = [];
  const request = new FormData();
  const id = randomUUID();
  for (const [key, value] of Object.entries({ name: "Test Buyer", email: "buyer@example.com", organisation: "Test IT", goal: "Prepare <strong>accurate</strong> handovers.", timing: "", submissionToken: id, website: "" })) request.set(key, value);
  const notificationDependencies = {
    claim,
    send: async (_, message) => { delivered.push(message); return { accepted: true, messageId: "test-provider-accepted" }; },
    finish: (row, result) => finish(row, result.accepted, result.accepted ? result.messageId : null),
  };
  try {
    const dependencies = {
      generateToken: randomUUID,
      persist: async (token, values) => {
        const receipt = await receive({ id: token, ...values, payload: businessEnquiryHash("test-secret".repeat(4), "payload", JSON.stringify(values)) });
        return { id: receipt.enquiry_id, outcome: receipt.outcome };
      },
      notify: (token) => processBusinessEnquiryNotifications(notificationDependencies, token),
    };
    const states = await Promise.all([
      handleBusinessEnquirySubmission(request, dependencies),
      handleBusinessEnquirySubmission(request, dependencies),
    ]);
    assert.ok(states.every((state) => state.status === "success" && state.message.includes("recorded")));
    assert.equal(delivered.length, 1);
    assert.equal(delivered[0].replyTo, "buyer@example.com");
    assert.equal(delivered[0].idempotencyKey, `business-enquiry/${id}`);
    assert.match(delivered[0].html, /&lt;strong&gt;accurate&lt;\/strong&gt;/);
    const row = (await db.query("SELECT name,goal,notification_status,provider_message_id FROM business_enquiries WHERE id=$1", [id])).rows[0];
    assert.equal(row.name, "Test Buyer");
    assert.equal(row.notification_status, "sent");
    assert.equal(row.provider_message_id, "test-provider-accepted");
  } finally { await db.close(); }
});

test("complete route records provider failure, waits for cooldown, and retries with the same message and key", async () => {
  const { db, receive, claim, finish } = await fixture();
  const sends = [];
  try {
    const { enquiry_id: id } = await receive();
    const dependencies = {
      claim,
      send: async (_, message) => {
        sends.push(message);
        return sends.length === 1 ? { accepted: false, errorCode: "provider-error" } : { accepted: true, messageId: "retry-accepted" };
      },
      finish: (row, result) => finish(row, result.accepted, result.accepted ? result.messageId : null),
    };
    assert.equal((await processBusinessEnquiryNotifications(dependencies, id)).retryQueued, 1);
    assert.equal((await processBusinessEnquiryNotifications(dependencies, id)).claimed, 0);
    await db.query("UPDATE business_enquiries SET next_notification_at=now()-interval '1 second' WHERE id=$1", [id]);
    assert.equal((await processBusinessEnquiryNotifications(dependencies, id)).accepted, 1);
    assert.deepEqual(sends[0], sends[1]);
    const row = (await db.query("SELECT notification_status,notification_attempts FROM business_enquiries WHERE id=$1", [id])).rows[0];
    assert.equal(row.notification_status, "sent");
    assert.equal(row.notification_attempts, 2);
  } finally { await db.close(); }
});

test("stalled notification transport is aborted, original enquiry remains saved, and timeout is queued", async () => {
  const { db, receive, claim } = await fixture();
  const form = new FormData();
  const id = randomUUID();
  for (const [key, value] of Object.entries({ name: "Timeout Test", email: "timeout@example.com", organisation: "Test IT", goal: "Prepare a handover", timing: "", submissionToken: id, website: "" })) form.set(key, value);
  let aborted = false;
  try {
    const state = await handleBusinessEnquirySubmission(form, {
      generateToken: randomUUID,
      persist: async (token, values) => {
        const receipt = await receive({ id: token, ...values });
        return { id: receipt.enquiry_id, outcome: receipt.outcome };
      },
      notify: (token) => processBusinessEnquiryNotifications({
        claim,
        send: () => deliverBusinessEnquiryWithDeadline((signal) => new Promise((_, reject) => {
          signal.addEventListener("abort", () => { aborted = true; reject(new DOMException("Aborted", "AbortError")); }, { once: true });
        }), 25),
        finish: async (row, result) => (await db.query("SELECT finish_business_enquiry_notification($1,$2,$3,$4,$5) AS updated", [row.id, row.notification_lease_token, result.accepted, result.accepted ? result.messageId : null, result.accepted ? null : result.errorCode])).rows[0].updated,
      }, token),
    });
    assert.equal(aborted, true);
    assert.equal(state.status, "success");
    assert.match(state.message, /recorded/);
    const row = (await db.query("SELECT notification_status,notification_error_code,notified_at FROM business_enquiries WHERE id=$1", [id])).rows[0];
    assert.equal(row.notification_status, "queued");
    assert.equal(row.notification_error_code, "provider-timeout");
    assert.equal(row.notified_at, null);
    assert.equal((await claim(id)).length, 0);
  } finally { await db.close(); }
});
