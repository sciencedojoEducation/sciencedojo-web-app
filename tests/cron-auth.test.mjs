import assert from "node:assert/strict";
import { afterEach, describe, mock, test } from "node:test";

import { checkCronAuthorization } from "../lib/cronAuth.ts";

const originalCronSecret = process.env.CRON_SECRET;

afterEach(() => {
  mock.restoreAll();
  if (originalCronSecret === undefined) {
    delete process.env.CRON_SECRET;
  } else {
    process.env.CRON_SECRET = originalCronSecret;
  }
});

describe("checkCronAuthorization", () => {
  for (const [label, secret] of [
    ["unset", undefined],
    ["empty", ""],
    ["whitespace-only", "   "],
  ]) {
    test(`fails closed when CRON_SECRET is ${label}`, () => {
      const log = mock.method(console, "error", () => {});
      if (secret === undefined) {
        delete process.env.CRON_SECRET;
      } else {
        process.env.CRON_SECRET = secret;
      }

      assert.deepEqual(checkCronAuthorization("Bearer anything"), {
        ok: false,
        status: 500,
        error: "Cron is not configured",
      });
      assert.equal(log.mock.callCount(), 1);
    });
  }

  for (const [label, authorizationHeader] of [
    ["missing", null],
    ["malformed", "cron-test-secret"],
    ["incorrect", "Bearer wrong-secret"],
  ]) {
    test(`rejects a ${label} bearer token`, () => {
      process.env.CRON_SECRET = "cron-test-secret";

      assert.deepEqual(checkCronAuthorization(authorizationHeader), {
        ok: false,
        status: 401,
        error: "Unauthorized",
      });
    });
  }

  test("accepts only the exact configured bearer token", () => {
    process.env.CRON_SECRET = "cron-test-secret";

    assert.equal(checkCronAuthorization("Bearer cron-test-secret"), null);
  });
});
