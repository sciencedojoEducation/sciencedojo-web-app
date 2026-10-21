import assert from "node:assert/strict";
import { test } from "node:test";
import { getPublicResourceNavigation } from "../lib/public-resource-navigation.ts";

const keys = ["learning_hub_enabled", "practice_dojo_enabled", "focus_dojo_enabled", "community_enabled"];
const routes = ["/learning-hub", "/ai-practice-studio", "/focus-dojo", "/community"];

test("public resources expose only enabled destinations across every flag combination", () => {
  for (let mask = 0; mask < 16; mask++) {
    const flags = Object.fromEntries(keys.map((key, index) => [key, Boolean(mask & (1 << index))]));
    assert.deepEqual(getPublicResourceNavigation(flags).map(item => item.href), routes.filter((_, index) => flags[keys[index]]));
  }
});
