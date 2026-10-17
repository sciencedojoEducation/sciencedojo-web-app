import assert from "node:assert/strict";
import { test } from "node:test";
import { createPresentation, receivePresentation, advancePresentation } from "../lib/campus/presentation.ts";
const pose = (x = 0, extra = {}) => ({ x, z: 0, rotation: 0, seat: null, ...extra });

test("five-Hz positions animate across frames, settle exactly and never extrapolate", () => {
  const source = Object.freeze(pose(.6));
  const view = createPresentation(pose(), 0);
  receivePresentation(view, source, 200);
  const xs = [216, 232, 248, 264, 280, 296, 312, 328, 344, 360, 376, 392].map(t => {
    advancePresentation(view, t); return view.x;
  });
  assert(xs.every((x, i) => x > 0 && x < .6 && (!i || x > xs[i - 1])));
  advancePresentation(view, 400);assert.equal(view.x, .6);
  advancePresentation(view, 5000);assert.equal(view.x, .6);
  assert.deepEqual(source, pose(.6));
});

test("a replacement target starts at the rendered position; duplicate packets do not restart it", () => {
  const view = createPresentation(pose(), 0);
  receivePresentation(view, pose(.6), 200);advancePresentation(view, 300);
  assert.equal(view.x, .3);
  receivePresentation(view, pose(.6), 300);advancePresentation(view, 350);
  assert(Math.abs(view.x - .45) < 1e-9);
  receivePresentation(view, pose(.9), 350);assert(Math.abs(view.x - .45) < 1e-9);
  advancePresentation(view, 400);assert.equal(view.x, .9);
});

test("sit, stand, large corrections and return after a long gap snap without gliding through desks", () => {
  for (const [initial, next, time] of [[pose(), pose(.5, { seat: "desk-1" }), 200],
    [pose(0, { seat: "desk-1" }), pose(1), 200], [pose(), pose(5), 200], [pose(), pose(.5), 1500]]) {
    const view = createPresentation(initial, 0);receivePresentation(view, next, time);
    assert.equal(view.x, next.x);assert.equal(view.seat, next.seat);assert.equal(view.duration, 0);
  }
});

test("turning crosses the angle boundary by the short path independently of frame sampling", () => {
  const a = createPresentation(pose(0, { rotation: 3.1 }), 0);
  const b = createPresentation(pose(0, { rotation: 3.1 }), 0);
  for (const view of [a, b]) receivePresentation(view, pose(.1, { rotation: -3.1 }), 200);
  for (let t = 201; t <= 300; t++) advancePresentation(a, t);
  advancePresentation(b, 300);
  assert(Math.cos(a.rotation) < -.999);assert.equal(a.rotation, b.rotation);assert.equal(a.x, b.x);
});
