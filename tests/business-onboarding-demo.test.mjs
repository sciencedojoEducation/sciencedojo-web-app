import assert from "node:assert/strict";
import test from "node:test";
import { createDemoState, demoReducer, getDemoReview, getDemoScenario } from "../app/business/onboarding-demo.ts";

function commit(state, choice) {
  return demoReducer(demoReducer(state, { type: "select", choice }), { type: "check" });
}

function advance(state, choice) {
  return demoReducer(commit(state, choice), { type: "continue" });
}

test("a decision must be selected and committed before progressing, and cannot be changed after feedback", () => {
  const initial = createDemoState();
  assert.equal(demoReducer(initial, { type: "check" }), initial);
  assert.equal(demoReducer(initial, { type: "continue" }), initial);
  assert.equal(demoReducer(initial, { type: "select", choice: "align" }), initial);

  const selected = demoReducer(initial, { type: "select", choice: "promise" });
  assert.equal(selected.decisions.length, 0);
  assert.equal(demoReducer(selected, { type: "continue" }), selected);

  const checked = demoReducer(selected, { type: "check" });
  assert.equal(checked.decisions.length, 1);
  assert.equal(checked.decisions[0].choice, "promise");
  assert.equal(demoReducer(checked, { type: "check" }), checked);
  assert.equal(demoReducer(checked, { type: "select", choice: "clarify" }), checked);
});

test("the initial decision changes the trade-off context, and the scope decision changes the handover", () => {
  const firstContexts = ["clarify", "promise", "forward"].map((choice) => getDemoScenario(advance(createDemoState(), choice)).context);
  assert.equal(new Set(firstContexts).size, 3);
  assert.match(firstContexts[1], /started a handbook/);
  assert.match(firstContexts[2], /two-day estimate/);

  const stepOne = advance(createDemoState(), "clarify");
  const handovers = ["align", "assume", "escalate"].map((choice) => getDemoScenario(advance(stepOne, choice)));
  assert.equal(new Set(handovers.map((scenario) => scenario.context)).size, 3);
  assert.match(handovers[0].options[0].label, /approved checklist/);
  assert.match(handovers[1].options[0].label, /Confirm scope/);
  assert.match(handovers[1].options[0].label, /Friday 4 pm with Alex/);
  assert.match(handovers[1].options[0].feedback, /Alex confirms capacity for Friday at 4 pm/);
  assert.match(handovers[2].context, /approval is still missing/);
});

test("all 27 decision paths finish with the actual decisions recorded, including repair paths", () => {
  let paths = 0;
  for (const first of ["clarify", "promise", "forward"]) {
    for (const second of ["align", "assume", "escalate"]) {
      for (const third of ["confirm", "handoff", "notes"]) {
        let state = createDemoState();
        const labels = [];
        for (const choice of [first, second, third]) {
          labels.push(getDemoScenario(state).options.find((option) => option.choice === choice).label);
          state = advance(state, choice);
        }
        assert.equal(state.complete, true);
        assert.deepEqual(state.decisions.map((decision) => decision.choice), [first, second, third]);
        assert.deepEqual(state.decisions.map((decision) => decision.label), labels);
        assert.equal(demoReducer(state, { type: "select", choice: "confirm" }), state);

        const review = getDemoReview(state.decisions);
        assert.equal(review.outcome.includes("actionable"), third === "confirm");
        const gaps = Number(first !== "clarify") + Number(second !== "align") + Number(third !== "confirm");
        assert.equal(review.practice.length, gaps || 1);
        if (gaps === 0) assert.match(review.practice[0], /next handover/);
        assert.deepEqual(demoReducer(state, { type: "reset" }), createDemoState());
        paths += 1;
      }
    }
  }
  assert.equal(paths, 27);
});

test("restart clears both tentative and committed choices at every stage", () => {
  let state = createDemoState();
  for (const choice of ["promise", "assume", "notes"]) {
    const selected = demoReducer(state, { type: "select", choice });
    assert.deepEqual(demoReducer(selected, { type: "reset" }), createDemoState());
    const checked = demoReducer(selected, { type: "check" });
    assert.deepEqual(demoReducer(checked, { type: "reset" }), createDemoState());
    state = demoReducer(checked, { type: "continue" });
  }
});
