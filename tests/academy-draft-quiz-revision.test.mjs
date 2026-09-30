import assert from "node:assert/strict";
import { test } from "node:test";

import { resolveDraftQuizRevision } from "../lib/academy-draft-quiz-revision.ts";

test("an unchanged seeded quiz keeps the draft's newer revision", () => {
  assert.equal(resolveDraftQuizRevision(2, 3, false), 3);
  assert.equal(resolveDraftQuizRevision(5, 3, false), 5);
});

test("a changed seeded quiz advances beyond the current draft revision", () => {
  assert.equal(resolveDraftQuizRevision(2, 3, true), 4);
  assert.equal(resolveDraftQuizRevision(7, 3, true), 7);
});
