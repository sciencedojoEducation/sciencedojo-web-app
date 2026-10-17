import { test } from "node:test";
import assert from "node:assert/strict";
import { campusConfiguration, campusSocketRequestAllowed } from "../lib/campus/security.ts";

test("Vercel transport is explicit, same-origin, default-off and does not require another service credential", () => {
  const keys = ["CAMPUS_TRANSPORT", "CAMPUS_PILOT_READY", "CAMPUS_PUBLIC_URL", "CAMPUS_SERVICE_KEY"];
  const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  try {
    for (const key of keys) delete process.env[key];
    process.env.CAMPUS_TRANSPORT = "vercel";
    assert.equal(campusConfiguration(), null);
    process.env.CAMPUS_PILOT_READY = "true";
    assert.deepEqual(campusConfiguration(), { transport: "vercel", publicUrl: "/api/campus/socket" });
    process.env.CAMPUS_TRANSPORT = "unknown";
    assert.equal(campusConfiguration(), null);
    delete process.env.CAMPUS_TRANSPORT;
    assert.equal(campusConfiguration(), null);
    process.env.CAMPUS_PUBLIC_URL = "wss://room.example.test";
    process.env.CAMPUS_SERVICE_KEY = "x".repeat(32);
    assert.deepEqual(campusConfiguration(), { transport: "colyseus", publicUrl: "wss://room.example.test" });
    process.env.CAMPUS_PUBLIC_URL = "wss://room.example.test/?credential=no";
    assert.equal(campusConfiguration(), null);
  } finally {
    for (const key of keys) {
      if (original[key] === undefined) delete process.env[key]; else process.env[key] = original[key];
    }
  }
});
test("campus sockets require exact origin and secure transport outside loopback", () => {
  const request = (url, origin, upgrade = "websocket") => new Request(url, { headers: { origin, upgrade } });
  assert.equal(campusSocketRequestAllowed(request("https://campus.example.test/api/campus/socket", "https://campus.example.test")), true);
  assert.equal(campusSocketRequestAllowed(request("https://campus.example.test/api/campus/socket", "https://evil.test")), false);
  assert.equal(campusSocketRequestAllowed(request("http://campus.example.test/api/campus/socket", "http://campus.example.test")), false);
  assert.equal(campusSocketRequestAllowed(request("https://campus.example.test/api/campus/socket", "https://campus.example.test", "")), false);
});
