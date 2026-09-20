import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  isMaintenanceModeEnabled,
  resolveDashboardRole,
} from "../lib/public-render.ts";

describe("resolveDashboardRole", () => {
  test("prefers the profile role over auth metadata", () => {
    assert.equal(resolveDashboardRole("admin", "parent", false), "admin");
  });

  test("routes a parent with a tutor application to the tutor dashboard", () => {
    assert.equal(resolveDashboardRole("parent", "parent", true), "tutor");
  });

  test("uses metadata and falls back to the user dashboard", () => {
    assert.equal(resolveDashboardRole(null, "internal", false), "internal");
    assert.equal(resolveDashboardRole(null, null, false), "user");
  });
});

describe("isMaintenanceModeEnabled", () => {
  test("enables maintenance only for the exact true value", () => {
    assert.equal(isMaintenanceModeEnabled("true"), true);
    assert.equal(isMaintenanceModeEnabled("TRUE"), false);
    assert.equal(isMaintenanceModeEnabled("false"), false);
    assert.equal(isMaintenanceModeEnabled(undefined), false);
  });
});
