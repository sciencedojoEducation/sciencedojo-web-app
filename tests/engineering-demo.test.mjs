import assert from "node:assert/strict";
import test from "node:test";
import { engineeringDemoReducer as reduce, engineeringScenarios, initialEngineeringDemo } from "../lib/engineering-demo.ts";

test("every scenario can complete, recover from a blocked handoff and reset", () => {
  for (const scenario of Object.keys(engineeringScenarios)) {
    let state = reduce(initialEngineeringDemo, { type: "select", scenario });
    state = reduce(state, { type: "run", recover: false });
    state = reduce(state, { type: "resolve", attempt: state.attempt });
    assert.equal(state.phase, "complete");
    state = reduce(state, { type: "run", recover: true });
    state = reduce(state, { type: "resolve", attempt: state.attempt });
    assert.equal(state.phase, "blocked");
    state = reduce(state, { type: "retry" });
    state = reduce(state, { type: "resolve", attempt: state.attempt });
    assert.equal(state.phase, "complete");
    state = reduce(state, { type: "reset" });
    assert.equal(state.phase, "ready");
    assert.equal(state.scenario, scenario);
  }
});

test("late completion cannot overwrite a new selection, reset or newer attempt", () => {
  const running = reduce(initialEngineeringDemo, { type: "run", recover: true });
  for (const event of [{ type: "select", scenario: "integration" }, { type: "reset" }, { type: "run", recover: false }, { type: "choice", choice: "incomplete" }]) {
    const next = reduce(running, event);
    assert.equal(reduce(next, { type: "resolve", attempt: running.attempt }), next);
  }
  assert.equal(reduce(initialEngineeringDemo, { type: "retry" }), initialEngineeringDemo);
});

test("a visitor's design choice changes the outcome and can be corrected without losing the scenario", () => {
  for (const scenario of Object.keys(engineeringScenarios)) {
    let state = reduce(initialEngineeringDemo, { type: "select", scenario });
    state = reduce(state, { type: "choice", choice: "incomplete" });
    state = reduce(state, { type: "run", recover: false });
    state = reduce(state, { type: "resolve", attempt: state.attempt });
    assert.equal(state.phase, "blocked");
    assert.equal(state.recover, false);
    state = reduce(state, { type: "retry" });
    assert.equal(state.choice, "ready");
    state = reduce(state, { type: "resolve", attempt: state.attempt });
    assert.equal(state.phase, "complete");
    assert.equal(state.scenario, scenario);
  }
});
