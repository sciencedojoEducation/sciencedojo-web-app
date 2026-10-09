import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { Resend } from "resend";
import {
  BUSINESS_ENQUIRY_LIMITS,
  buildBusinessEnquiryNotification,
  isBusinessEmail,
  validateBusinessEnquiry,
} from "../lib/business-enquiry-validation.ts";
import {
  handleBusinessEnquirySubmission,
  deliverBusinessEnquiryWithDeadline,
  processBusinessEnquiryNotifications,
} from "../lib/business-enquiry-service.ts";
import { businessEnquiryHash, getBusinessEnquiryRequestIp } from "../lib/business-enquiry-security.ts";

const token = "40000000-0000-4000-8000-000000000001";
function form(overrides = {}) {
  const result = new FormData();
  for (const [key, value] of Object.entries({
    name: "Alex Example", email: "Alex@Example.com", organisation: "Example IT",
    goal: "Prepare an actionable client handover.", timing: "", website: "", submissionToken: token,
    ...overrides,
  })) result.set(key, value);
  return result;
}
const dependency = (overrides = {}) => ({
  generateToken: randomUUID,
  persist: async (id) => ({ id, outcome: "saved" }),
  notify: async () => {},
  ...overrides,
});

test("valid public enquiry normalizes email and permits optional timing", () => {
  const fields = form({ name: " Alex Example ", goal: "First step\r\nSecond step" });
  fields.delete("timing");
  const parsed = validateBusinessEnquiry(fields);
  assert.equal(parsed.valid, true);
  assert.equal(parsed.values.name, "Alex Example");
  assert.equal(parsed.values.email, "alex@example.com");
  assert.equal(parsed.values.goal, "First step\nSecond step");
});

test("required, duplicate, oversized, binary and control-character values fail server validation", () => {
  for (const field of ["name", "email", "organisation", "goal"]) {
    assert.ok(validateBusinessEnquiry(form({ [field]: " " })).fieldErrors[field]);
    assert.ok(validateBusinessEnquiry(form({ [field]: "x".repeat(BUSINESS_ENQUIRY_LIMITS[field] + 1) })).fieldErrors[field]);
  }
  const duplicate = form(); duplicate.append("email", "other@example.com");
  assert.ok(validateBusinessEnquiry(duplicate).fieldErrors.email);
  const binary = form(); binary.set("name", new Blob(["name"]));
  assert.ok(validateBusinessEnquiry(binary).fieldErrors.name);
  assert.ok(validateBusinessEnquiry(form({ name: "Name\nBcc: other@example.com" })).fieldErrors.name);
  assert.ok(validateBusinessEnquiry(form({ goal: "unsafe\u0000" })).fieldErrors.goal);
});

test("mailboxes reject header injection and broken domains while accepting common plus addresses", () => {
  for (const email of ["x@example.com\r\nBcc:x@bad.com", "x@localhost", "x@@example.com", ".x@example.com", "x..x@example.com", "x@-bad.com", "x@bad-.com"]) {
    assert.equal(isBusinessEmail(email), false, email);
  }
  assert.equal(isBusinessEmail("first.last+pilot@example.co.uk"), true);
});

test("honeypot and bad submission tokens do not save or notify", async () => {
  let saves = 0;
  for (const candidate of [form({ website: "spam" }), form({ submissionToken: "bad-token" })]) {
    const state = await handleBusinessEnquirySubmission(candidate, dependency({ persist: async () => { saves++; throw new Error(); } }));
    assert.equal(state.status, "error");
  }
  assert.equal(saves, 0);
});

test("blank no-JavaScript token is generated on the server and returned", async () => {
  const generated = randomUUID(); let savedToken;
  const state = await handleBusinessEnquirySubmission(form({ submissionToken: "" }), dependency({
    generateToken: () => generated,
    persist: async (id) => { savedToken = id; return { id, outcome: "saved" }; },
  }));
  assert.equal(state.status, "success");
  assert.equal(savedToken, generated);
  assert.equal(state.submissionToken, generated);
});

test("storage failure preserves input and never claims success or sends a notification", async () => {
  let notifications = 0;
  const state = await handleBusinessEnquirySubmission(form(), dependency({
    persist: async () => { throw new Error("offline"); }, notify: async () => { notifications++; },
  }));
  assert.equal(state.status, "error");
  assert.equal(state.values.goal, "Prepare an actionable client handover.");
  assert.match(state.message, /could not record/);
  assert.equal(notifications, 0);
});

test("a saved or repeated enquiry remains successful when staff notification fails", async () => {
  for (const outcome of ["saved", "duplicate"]) {
    const state = await handleBusinessEnquirySubmission(form(), dependency({
      persist: async (id) => ({ id, outcome }), notify: async () => { throw new Error("provider offline"); },
    }));
    assert.equal(state.status, "success");
    assert.match(state.message, /recorded/);
    assert.doesNotMatch(state.message, /delivered|inbox|sent/);
  }
});

test("rate limit and changed-payload token conflict are errors; conflict gets a fresh token", async () => {
  const limited = await handleBusinessEnquirySubmission(form(), dependency({ persist: async () => ({ id: null, outcome: "limited" }) }));
  assert.equal(limited.status, "error");
  assert.match(limited.message, /10 minutes/);
  const conflict = await handleBusinessEnquirySubmission(form(), dependency({ persist: async () => ({ id: token, outcome: "conflict" }) }));
  assert.equal(conflict.status, "error");
  assert.notEqual(conflict.submissionToken, token);
});

test("notification HTML escapes user content and cannot inject headers through the subject", () => {
  const parsed = validateBusinessEnquiry(form({ name: '<img src=x onerror="bad()">', organisation: "<script>alert(1)</script>", goal: "<a href='bad'>Click & send</a>" }));
  const message = buildBusinessEnquiryNotification(token, parsed.values);
  assert.doesNotMatch(message.html, /<script>|<img |<a href='bad'/);
  assert.match(message.html, /&lt;script&gt;/);
  assert.match(message.html, /Click &amp; send/);
  assert.equal(message.subject, "ScienceDojo for Business: new pilot enquiry");
});

test("only the platform-overwritten IP is trusted in Vercel production; arbitrary chains fail closed", () => {
  const production = { vercel: true, production: true };
  assert.equal(getBusinessEnquiryRequestIp(new Headers({ "x-forwarded-for": "203.0.113.3" }), production), "203.0.113.3");
  assert.equal(getBusinessEnquiryRequestIp(new Headers({ "x-forwarded-for": "2001:db8::1" }), production), "2001:db8::1");
  for (const headers of [new Headers(), new Headers({ "x-forwarded-for": "client, proxy" }), new Headers({ "x-real-ip": "203.0.113.3" })]) {
    assert.throws(() => getBusinessEnquiryRequestIp(headers, production));
  }
  assert.throws(() => getBusinessEnquiryRequestIp(new Headers(), { vercel: false, production: true }));
  assert.equal(getBusinessEnquiryRequestIp(new Headers({ "x-forwarded-for": "spoofed" }), { vercel: false, production: false }), "127.0.0.1");
});

test("rate hashes use a secret and separate domains without retaining raw IP or email", () => {
  const secret = "x".repeat(32);
  const ip = businessEnquiryHash(secret, "ip", "203.0.113.3");
  assert.match(ip, /^[a-f0-9]{64}$/);
  assert.notEqual(ip, businessEnquiryHash(secret, "email", "203.0.113.3"));
  assert.notEqual(ip, businessEnquiryHash("y".repeat(32), "ip", "203.0.113.3"));
  assert.throws(() => businessEnquiryHash("short", "ip", "203.0.113.3"));
});

const record = {
  id: token, name: "Alex Example", email: "alex@example.com", organisation: "Example IT",
  goal: "Prepare a handover", timing: "", notification_lease_token: randomUUID(), notification_attempts: 1,
};
test("notifications require provider message IDs, queue provider failures, and bound attempts", async () => {
  for (const [attempts, send, expected] of [
    [1, async () => ({ accepted: true, messageId: "provider-123" }), "accepted"],
    [1, async () => ({ accepted: true, messageId: "" }), "retryQueued"],
    [1, async () => { throw new Error("network"); }, "retryQueued"],
    [5, async () => ({ accepted: false, errorCode: "provider-error" }), "exhausted"],
  ]) {
    let finishResult;
    const summary = await processBusinessEnquiryNotifications({
      claim: async () => [{ ...record, notification_attempts: attempts }], send,
      finish: async (_, result) => { finishResult = result; return true; },
    });
    assert.equal(summary[expected], 1);
    assert.equal(finishResult.accepted, expected === "accepted");
  }
});

test("failed persistence of notification outcome leaves a recoverable lease and does not report acceptance", async () => {
  const summary = await processBusinessEnquiryNotifications({
    claim: async () => [record], send: async () => ({ accepted: true, messageId: "provider-123" }),
    finish: async () => { throw new Error("database offline"); },
  });
  assert.equal(summary.accepted, 0);
  assert.equal(summary.unresolved, 1);
});

test("stalled installed Resend transport receives an actual abort signal and returns a bounded retryable timeout", async (context) => {
  const originalFetch = globalThis.fetch;
  let observedAbort = false;
  let observedKey;
  globalThis.fetch = async (_, options) => {
    assert.ok(options.signal instanceof AbortSignal);
    observedKey = options.headers.get("Idempotency-Key");
    return new Promise((_, reject) => {
      options.signal.addEventListener("abort", () => {
        observedAbort = true;
        reject(new DOMException("Aborted", "AbortError"));
      }, { once: true });
    });
  };
  context.after(() => { globalThis.fetch = originalFetch; });
  const resend = new Resend("test-key-never-sent");
  const started = performance.now();
  const result = await deliverBusinessEnquiryWithDeadline(async (signal) => {
    const response = await resend.emails.send({ from: "from@example.com", to: "staff@example.com", subject: "Test", html: "<p>Test</p>" }, {
      signal, idempotencyKey: `business-enquiry/${token}`,
    });
    return response.error ? { accepted: false, errorCode: "provider-error" } : { accepted: true, messageId: response.data.id };
  }, 25);
  assert.equal(observedAbort, true);
  assert.equal(observedKey, `business-enquiry/${token}`);
  assert.deepEqual(result, { accepted: false, errorCode: "provider-timeout" });
  assert.ok(performance.now() - started < 1000);
});
