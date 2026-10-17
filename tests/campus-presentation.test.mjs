import assert from "node:assert/strict";
import { test } from "node:test";
import { createPresentation, receivePresentation, advancePresentation, PRESENTATION_DELAY_MS } from "../lib/campus/presentation.ts";
const pose = (x = 0, extra = {}) => ({ x, z: 0, rotation: 0, seat: null, ...extra });

test("buffered five-Hz positions animate across frames, settle exactly and never extrapolate", () => {
  const source = Object.freeze(pose(.6));
  const view = createPresentation(pose(), 0);
  receivePresentation(view, source, 200);
  const xs = [316, 332, 348, 364, 380, 396, 412, 428, 444, 460, 476, 492].map(t => {
    advancePresentation(view, t); return view.x;
  });
  assert(xs.every((x, i) => x > 0 && x < .6 && (!i || x > xs[i - 1])));
  advancePresentation(view, 500);assert.equal(view.x, .6);
  advancePresentation(view, 5000);assert.equal(view.x, .6);
  assert.deepEqual(source, pose(.6));
});

test("duplicate samples preserve movement history and the exact time of a stop", () => {
  const view = createPresentation(pose(), 0);
  receivePresentation(view, pose(.6), 200);
  receivePresentation(view, pose(.6), 300);
  advancePresentation(view, 400);assert.equal(view.x, .3);
  receivePresentation(view, pose(.9), 450);
  advancePresentation(view, 600);assert.equal(view.x, .6);
  advancePresentation(view, 675);assert(Math.abs(view.x - .75) < 1e-9);
  advancePresentation(view, 750);assert.equal(view.x, .9);
});

test("sit, stand, large corrections and return after a long gap snap without gliding through desks", () => {
  for (const [initial, next, time] of [[pose(), pose(.5, { seat: "desk-1" }), 200],
    [pose(0, { seat: "desk-1" }), pose(1), 200], [pose(), pose(5), 200], [pose(), pose(.5), 1500]]) {
    const view = createPresentation(initial, 0);receivePresentation(view, next, time);
    assert.equal(view.x, next.x);assert.equal(view.seat, next.seat);
    advancePresentation(view, time + 10);assert.equal(view.x, next.x);
  }
});

test("turning crosses the angle boundary by the short path independently of frame sampling", () => {
  const a = createPresentation(pose(0, { rotation: 3.1 }), 0);
  const b = createPresentation(pose(0, { rotation: 3.1 }), 0);
  for (const view of [a, b]) receivePresentation(view, pose(.1, { rotation: -3.1 }), 200);
  for (let t = 301; t <= 400; t++) advancePresentation(a, t);
  advancePresentation(b, 400);
  assert(Math.cos(a.rotation) < -.999);assert.equal(a.rotation, b.rotation);assert.equal(a.x, b.x);
});

test("uneven snapshot arrivals do not introduce stops during a sustained walk", () => {
  const view = createPresentation(pose(), 0);
  const gaps = [120, 280, 160, 240, 140, 260, 180, 220];
  const arrivals = [];let at = 0;
  for (let i = 0; i < 32; i++) { at += gaps[i % gaps.length]; arrivals.push(at); }
  let next = 0, previous = 0, still = 0, longest = 0;
  for (let t = 0; t < at; t += 10) {
    while (next < arrivals.length && arrivals[next] <= t) {
      receivePresentation(view, pose(arrivals[next] * .0015), arrivals[next]);next++;
    }
    advancePresentation(view, t);
    if (t > 600) { still = Math.abs(view.x - previous) < .000001 ? still + 10 : 0;longest = Math.max(longest, still); }
    previous = view.x;
    assert(view.x <= (arrivals[next - 1] ?? 0) * .0015, "Never move beyond confirmed positions");
    assert(view.samples.length <= 6, "Old samples must be discarded");
  }
  assert(longest < 40, `Character paused for ${longest}ms between updates`);
});

test("a buffer underrun holds the last confirmed position and demand rendering stops when settled", () => {
  const view = createPresentation(pose(), 0);
  receivePresentation(view, pose(.6), 200);
  assert.equal(advancePresentation(view, 200 + PRESENTATION_DELAY_MS), false);
  assert.equal(view.x, .6);
  assert.equal(advancePresentation(view, 2000), false);
  assert.equal(view.x, .6);
});
