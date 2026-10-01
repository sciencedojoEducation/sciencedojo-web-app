import assert from "node:assert/strict";
import { test } from "node:test";
import { academyScrollContainer, academyScrollOffset } from "../lib/academy-scroll-container.ts";

test("uses dashboard/iframe scrolling panels instead of a stationary window", (t) => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
  const browser = { scrollY: 0, getComputedStyle: (node) => ({ overflowY: node.overflowY }) };
  Object.defineProperty(globalThis, "window", { configurable: true, value: browser });
  t.after(() => { if (previous) Object.defineProperty(globalThis, "window", previous); else delete globalThis.window; });
  const outer = { overflowY: "auto", scrollTop: 300, parentElement: null };
  const panel = { overflowY: "auto", scrollTop: 1000, parentElement: outer };
  const content = { overflowY: "visible", parentElement: panel };
  assert.equal(academyScrollContainer({ parentElement: content }), panel);
  assert.equal(academyScrollOffset(panel), 1000);
  assert.equal(academyScrollOffset(browser), 0);
  assert.equal(academyScrollContainer({ parentElement: { overflowY: "visible", parentElement: null } }), browser);
});
