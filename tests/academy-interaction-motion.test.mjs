import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { animateAcademyPanel, observeAcademyDisclosure } from "../lib/academy-interaction-motion.ts";

function fixture(t, reduced = false) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
  const preferenceListeners = new Map();
  const listeners = new Map();
  const summaryListeners = new Map();
  const preference = { matches: reduced, addEventListener: (name, fn) => preferenceListeners.set(name, fn), removeEventListener: (name) => preferenceListeners.delete(name) };
  Object.defineProperty(globalThis, "window", { configurable: true, value: { matchMedia: () => preference } });
  t.after(() => { if (descriptor) Object.defineProperty(globalThis, "window", descriptor); else delete globalThis.window; });
  const animations = [];
  const element = {
    open: false,
    querySelector: () => ({ addEventListener: (name, fn) => summaryListeners.set(name, fn), removeEventListener: (name) => summaryListeners.delete(name) }),
    getBoundingClientRect: () => ({ height: element.open ? 180 : 64 }),
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name) => listeners.delete(name),
    animate: (frames, options) => {
      const animation = { frames, options, cancelled: false, cancel() { this.cancelled = true; } };
      animations.push(animation);
      return animation;
    },
  };
  const click = () => {
    let prevented = false;
    summaryListeners.get("click")({ preventDefault: () => prevented = true });
    if (!prevented) element.open = !element.open;
    return prevented;
  };
  return { element, animations, preference, preferenceListeners, listeners, summaryListeners, click };
}

test("panel reveals are directional, brief and immediately cancel for interaction or reduced motion", (t) => {
  const env = fixture(t);
  const stop = animateAcademyPanel(env.element, -1);
  assert.equal(env.animations[0].frames[0].transform, "translateX(-10px)");
  assert.equal(env.animations[0].options.duration, 240);
  env.listeners.get("focusin")();
  assert.equal(env.animations[0].cancelled, true);
  stop();
  assert.equal(env.listeners.size, 0);
  assert.equal(env.preferenceListeners.size, 0);
  env.preference.matches = true;
  animateAcademyPanel(env.element)();
  assert.equal(env.animations.length, 1);
});

test("disclosure opens and closes smoothly, releasing height and retaining native semantics", (t) => {
  const env = fixture(t);
  const stop = observeAcademyDisclosure(env.element);
  assert.equal(env.click(), true);
  assert.equal(env.element.open, true);
  assert.deepEqual(env.animations[0].frames, [{ height: "64px" }, { height: "180px" }]);
  env.animations[0].onfinish();
  assert.equal(env.element.open, true);
  env.click();
  assert.equal(env.element.open, true, "closing content remains rendered during motion");
  assert.deepEqual(env.animations[1].frames, [{ height: "180px" }, { height: "64px" }]);
  env.animations[1].onfinish();
  assert.equal(env.element.open, false);
  stop();
  assert.equal(env.summaryListeners.size, 0);
  assert.equal(env.preferenceListeners.size, 0);
});

test("rapid accordion clicks reverse from the current height and preference changes settle the target", (t) => {
  const env = fixture(t);
  const stop = observeAcademyDisclosure(env.element);
  env.click();
  env.click();
  assert.equal(env.animations[0].cancelled, true);
  assert.equal(env.animations[1].frames[1].height, "64px");
  env.click();
  assert.equal(env.animations[2].frames[1].height, "180px");
  env.preference.matches = true;
  env.preferenceListeners.get("change")();
  assert.equal(env.element.open, true);
  assert.equal(env.animations[2].cancelled, true);
  env.click();
  assert.equal(env.element.open, false);
  stop();
  assert.equal(env.element.open, false, "cleanup must not overwrite native reduced-motion toggles");
});

test("missing animation API preserves native disclosure and visible panels", (t) => {
  const env = fixture(t);
  delete env.element.animate;
  observeAcademyDisclosure(env.element)();
  animateAcademyPanel(env.element)();
  assert.equal(env.summaryListeners.size, 0);
});

test("shared interactive components have stable-height tabs, keyboard controls and isolated feedback motion", () => {
  const source = readFileSync(new URL("../components/tutor-academy/AcademyInteractiveBlocks.tsx", import.meta.url), "utf8");
  assert.match(source, /col-start-1 row-start-1/);
  assert.match(source, /inert=\{active !== index\}/);
  assert.match(source, /event.key === "ArrowRight"/);
  assert.match(source, /event.key === "Home"/);
  assert.match(source, /animateAcademyPanel\(feedback.current\)/);
  assert.match(source, /inert=\{step !== index \+ 1\}/);
  const reveal = readFileSync(new URL("../components/tutor-academy/AcademyScrollReveal.tsx", import.meta.url), "utf8");
  assert.match(reveal, /disabled \|\| ref.current.querySelector\("\[data-academy-motion-list\]"\)/);
});
