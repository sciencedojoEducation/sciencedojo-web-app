import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { observeAcademyScrollMotion } from "../lib/academy-scroll-motion.ts";

function setup(t, reduced = false) {
  const saved = Object.fromEntries(["window", "document", "IntersectionObserver"].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const listeners = new Map();
  const preference = { matches: reduced, addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: (name) => listeners.delete(name) };
  const animations = [];
  let callback, observed = false, hidden = false, focused = false;
  let cancellations = 0;
  const element = {
    getClientRects: () => hidden ? [] : [{}],
    contains: () => focused,
    animate: (frames, options) => { animations.push({ frames, options }); return { cancel: () => cancellations++ }; },
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name) => listeners.delete(name),
  };
  Object.defineProperty(globalThis, "window", { configurable: true, value: { matchMedia: () => preference } });
  Object.defineProperty(globalThis, "document", { configurable: true, value: { activeElement: null } });
  Object.defineProperty(globalThis, "IntersectionObserver", { configurable: true, value: class {
    constructor(fn, options) { callback = fn; assert.equal(options.threshold, 0); }
    observe() { observed = true; }
    disconnect() { observed = false; }
  } });
  t.after(() => { for (const [key, descriptor] of Object.entries(saved)) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } });
  return { element, preference, listeners, animations, enter: () => callback([{ isIntersecting: true }]), setHidden: (value) => hidden = value, setFocused: (value) => focused = value, observed: () => observed, cancellations: () => cancellations };
}

test("reveals once, skips hidden subsections, and cleans up on unmount", (t) => {
  const env = setup(t);
  const cleanup = observeAcademyScrollMotion(env.element);
  env.setHidden(true); env.enter(); assert.equal(env.animations.length, 0);
  env.setHidden(false); env.enter(); env.enter();
  assert.equal(env.animations.length, 1);
  assert.equal(env.observed(), false);
  assert.equal(env.animations[0].options.duration, 520);
  assert.equal(env.animations[0].frames[0].transform, "translateY(18px)");
  assert.equal(env.animations[0].frames[0].opacity, 0);
  assert.equal(env.animations[0].frames[1].opacity, 1);
  cleanup(); assert.equal(env.cancellations(), 1); assert.equal(env.listeners.size, 0);
});

test("reduced motion prevents animation and preference changes cancel running motion", (t) => {
  const env = setup(t, true);
  const cleanup = observeAcademyScrollMotion(env.element, true);
  assert.equal(env.observed(), false); env.enter(); assert.equal(env.animations.length, 0);
  env.preference.matches = false; env.listeners.get("change")(); env.enter();
  assert.equal(env.animations[0].options.duration, 300);
  assert.equal(env.animations[0].frames[0].opacity, 0.45);
  assert.equal(env.animations[0].frames[0].transform, "translateY(6px)");
  env.preference.matches = true; env.listeners.get("change")();
  assert.equal(env.cancellations(), 1); cleanup();
});

test("pointer interaction immediately stops a reveal without replaying or hiding the activity", (t) => {
  const env = setup(t);
  const cleanup = observeAcademyScrollMotion(env.element, true);
  env.enter();
  env.listeners.get("pointerdown")();
  assert.equal(env.cancellations(), 1);
  env.enter();
  assert.equal(env.animations.length, 1);
  cleanup();
  assert.equal(env.listeners.size, 0);
});

test("interaction before the observer fires prevents a delayed entrance", (t) => {
  const env = setup(t);
  const cleanup = observeAcademyScrollMotion(env.element);
  env.listeners.get("pointerdown")();
  env.enter();
  assert.equal(env.observed(), false);
  assert.equal(env.animations.length, 0);
  cleanup();
});

test("bullet entrances slide visibly from the left with a bounded stagger and release their styles", (t) => {
  const env = setup(t);
  const cleanup = observeAcademyScrollMotion(env.element, false, { slide: true, delayMs: 900 });
  env.enter();
  assert.equal(env.animations[0].frames[0].transform, "translateX(-28px)");
  assert.equal(env.animations[0].frames[1].transform, "translateX(0)");
  assert.equal(env.animations[0].options.duration, 520);
  assert.equal(env.animations[0].options.delay, 240);
  assert.equal(env.animations[0].options.fill, "backwards");
  cleanup();
});

test("keyboard focus cancels motion and already-focused content does not animate", (t) => {
  const env = setup(t);
  const cleanup = observeAcademyScrollMotion(env.element);
  env.setFocused(true); env.enter(); assert.equal(env.animations.length, 0); cleanup();
  env.setFocused(false);
  const cleanupAgain = observeAcademyScrollMotion(env.element);
  env.enter(); env.listeners.get("focusin")(); assert.equal(env.cancellations(), 1); cleanupAgain();
});

test("media entrances use a restrained scale profile separate from reading copy", (t) => {
  const env = setup(t);
  const cleanup = observeAcademyScrollMotion(env.element, false, { media: true });
  env.enter();
  assert.equal(env.animations[0].options.duration, 480);
  assert.equal(env.animations[0].frames[0].transform, "translateY(12px) scale(0.985)");
  assert.equal(env.animations[0].frames[1].transform, "translateY(0) scale(1)");
  cleanup();
});

test("unavailable motion API leaves content alone; shared renderer keeps navigation outside reveal", (t) => {
  const env = setup(t);
  delete env.element.animate;
  assert.doesNotThrow(() => observeAcademyScrollMotion(env.element)());
  const component = readFileSync(new URL("../components/tutor-academy/AcademyScrollReveal.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(component, /opacity-0|hidden|aria-hidden|setTimeout/);
  const renderer = readFileSync(new URL("../components/tutor-academy/AcademyLessonBlocks.tsx", import.meta.url), "utf8");
  assert.match(renderer, /<AcademyScrollReveal disabled=\{block.type === "divider" \|\| block.type === "numbered-list"\} gentle=/);
  assert.match(renderer, /gentle=\{[^}]*block.type === "audio"/);
  assert.match(renderer, /<\/AcademyScrollReveal>\s*<\/AcademyBlockBackground>/);
});

test("bulleted, checklist, numbered and rich text lists retain semantic items with shared slide observers", () => {
  const renderer = readFileSync(new URL("../components/tutor-academy/AcademyLessonBlocks.tsx", import.meta.url), "utf8");
  const richText = readFileSync(new URL("../components/tutor-academy/AcademyRichText.tsx", import.meta.url), "utf8");
  const reveal = readFileSync(new URL("../components/tutor-academy/AcademyScrollReveal.tsx", import.meta.url), "utf8");
  assert.match(renderer, /<ol data-academy-motion-list/);
  assert.match(richText, /<ul\s+key=\{key\}\s+data-academy-motion-list/);
  assert.match(richText, /<ol\s+key=\{key\}\s+data-academy-motion-list/);
  assert.match(reveal, /observeAcademyListMotion\(ref.current\)/);
  assert.match(reveal, /stopBlock\(\); stopItems\(\);/);
});
