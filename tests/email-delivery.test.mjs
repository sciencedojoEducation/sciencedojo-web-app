import assert from "node:assert/strict";
import { test } from "node:test";
import { deliverProviderEmail } from "../lib/email-delivery.ts";

const message = { from: "hello@example.com", to: "team@example.com", subject: "Enquiry", html: "<p>Test</p>", replyTo: "prospect@example.com" };

test("a resolved provider error is a failure, even though the send promise fulfilled", async () => {
  const error = { name: "validation_error", message: "Sender rejected" };
  const result = await deliverProviderEmail(async () => ({ data: null, error }), message);
  assert.deepEqual(result, { success: false, error });
});

test("accepted message IDs, reply-to, and idempotency options are preserved", async () => {
  const response = { data: { id: "provider-id" }, error: null };
  const result = await deliverProviderEmail(async (payload, options) => {
    assert.deepEqual(payload, message);
    assert.deepEqual(options, { idempotencyKey: "business-enquiry-id" });
    return response;
  }, message, { idempotencyKey: "business-enquiry-id" });
  assert.deepEqual(result, { success: true, data: response });
});

test("a thrown transport failure and a response without a message ID cannot claim success", async () => {
  const error = new Error("Connection failed");
  assert.deepEqual(await deliverProviderEmail(async () => { throw error; }, message), { success: false, error });
  const missing = await deliverProviderEmail(async () => ({ data: null, error: null }), message);
  assert.equal(missing.success, false);
  assert.match(missing.error.message, /no message ID/);
});
