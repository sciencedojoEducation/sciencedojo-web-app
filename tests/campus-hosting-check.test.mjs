import { test } from "node:test";
import assert from "node:assert/strict";
import { HOSTING_CHECK_EXPIRES, hostingCheckEnabled, hostingCheckRequestAllowed } from "../lib/campus/hosting-check.ts";

test("hosting experiment is closed in production, other branches, missing configuration and after expiry", () => {
  const env = { VERCEL_ENV: "preview", VERCEL_GIT_COMMIT_REF: "codex/virtual-sciencedojo-beta" };
  assert.equal(hostingCheckEnabled(env, HOSTING_CHECK_EXPIRES - 1), true);
  assert.equal(hostingCheckEnabled(env, HOSTING_CHECK_EXPIRES), false);
  assert.equal(hostingCheckEnabled({}, 0), false);
  assert.equal(hostingCheckEnabled({ ...env, VERCEL_ENV: "production" }, 0), false);
  assert.equal(hostingCheckEnabled({ ...env, VERCEL_GIT_COMMIT_REF: "main" }, 0), false);
});
test("hosting experiment accepts only same-origin HTTPS preview WebSocket requests", () => {
  const url = "https://synthetic-preview.vercel.app/api/campus-hosting-check";
  const request = (origin, upgrade = "websocket", target = url) => new Request(target, { headers: { origin, upgrade } });
  assert.equal(hostingCheckRequestAllowed(request("https://synthetic-preview.vercel.app")), true);
  assert.equal(hostingCheckRequestAllowed(request("https://evil.test")), false);
  assert.equal(hostingCheckRequestAllowed(request("null")), false);
  assert.equal(hostingCheckRequestAllowed(request("https://synthetic-preview.vercel.app", "")), false);
  assert.equal(hostingCheckRequestAllowed(request("http://synthetic-preview.vercel.app", "websocket", url.replace("https:", "http:"))), false);
  assert.equal(hostingCheckRequestAllowed(request("https://vercel.app.evil.test", "websocket", "https://vercel.app.evil.test/test")), false);
});
