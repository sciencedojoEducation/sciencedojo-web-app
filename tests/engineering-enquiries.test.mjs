import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { handleEngineeringEnquirySubmission as submit, ENGINEERING_DESCRIPTION_LIMIT } from "../lib/engineering-enquiry.ts";
import { BUSINESS_ENQUIRY_LIMITS } from "../lib/business-enquiry-validation.ts";

function form() {
  const result = new FormData();
  for (const [key, value] of Object.entries({ name: "Synthetic QA", email: "qa@example.com", organisation: "Example team", goal: "Connect the request tool.", timing: "", website: "", interest: "integration", submissionToken: randomUUID() })) result.set(key, value);
  return result;
}
const deps = (overrides = {}) => ({ generateToken: randomUUID, persist: async id => ({ id, outcome: "saved" }), notify: async () => {}, ...overrides });

test("validated engineering context fits the existing contract and does not leak into draft recovery", async () => {
  for (const interest of ["workflow", "application", "integration", "unsure"]) {
    const input = form(); input.set("interest", interest); input.set("goal", "x".repeat(ENGINEERING_DESCRIPTION_LIMIT));
    let stored;
    const state = await submit(input, deps({ persist: async (id, values) => { stored = values; return { id, outcome: "saved" }; } }));
    assert.equal(state.status, "success");
    assert.match(stored.goal, /^Service: Software & Product Engineering\nInterest:/);
    assert.ok(stored.goal.length <= BUSINESS_ENQUIRY_LIMITS.goal);
    assert.equal(state.values.goal, "x".repeat(ENGINEERING_DESCRIPTION_LIMIT));
  }
});

test("tampering, multiplicity, overlength, missing required fields and honeypots never persist", async () => {
  const cases = [
    f => f.set("interest", "toString"), f => f.append("interest", "workflow"), f => f.set("interest", new Blob(["workflow"])),
    f => f.set("goal", "x".repeat(ENGINEERING_DESCRIPTION_LIMIT + 1)), f => f.append("goal", "second"),
    f => f.set("organisation", ""), f => f.set("email", "x@example.com\nBcc:bad@example.com"),
    f => f.set("website", "spam"), f => f.append("website", ""), f => f.append("submissionToken", randomUUID()), f => f.set("submissionToken", "bad"),
  ];
  let saves = 0;
  for (const change of cases) {
    const input = form(); change(input);
    const state = await submit(input, deps({ persist: async () => { saves++; throw new Error(); } }));
    assert.equal(state.status, "error");
  }
  assert.equal(saves, 0);
});

test("missing optional interest uses an explicit unsure context", async () => {
  const input = form(); input.delete("interest"); let goal;
  await submit(input, deps({ persist: async (id, values) => { goal = values.goal; return { id, outcome: "saved" }; } }));
  assert.match(goal, /Interest: Let's work it out/);
});

test("unenhanced forms receive a generated token that survives a storage error", async () => {
  const input = form(); input.set("submissionToken", "");
  const generated = randomUUID(); let attempted;
  const state = await submit(input, deps({ generateToken: () => generated, persist: async id => { attempted = id; throw new Error(); } }));
  assert.equal(attempted, generated);
  assert.equal(state.submissionToken, generated);
  assert.equal(state.values.goal, input.get("goal"));
});

test("storage, rate and token errors preserve the original description; notification failure still means recorded only", async () => {
  for (const outcome of ["throw", "limited", "conflict", "duplicate", "saved"]) {
    const input = form(); const original = input.get("goal"); let notifications = 0;
    const state = await submit(input, deps({
      persist: async id => { if (outcome === "throw") throw new Error(); return { id, outcome }; },
      notify: async () => { notifications++; throw new Error("provider down"); },
    }));
    assert.equal(state.values.goal, original);
    assert.equal(state.status, ["saved", "duplicate"].includes(outcome) ? "success" : "error");
    assert.equal(notifications, ["saved", "duplicate"].includes(outcome) ? 1 : 0);
    if (state.status === "success") assert.match(state.message, /recorded/);
    if (outcome === "conflict") assert.notEqual(state.submissionToken, input.get("submissionToken"));
  }
});
