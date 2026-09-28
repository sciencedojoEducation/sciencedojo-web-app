import assert from "node:assert/strict";
import { test } from "node:test";
import { matchesTutorSubject } from "../lib/tutor-subject-match.ts";

test("Math includes the Mathematics wording used in tutor profiles", () => {
  assert.equal(matchesTutorSubject(["Mathematics"], "Math"), true);
  assert.equal(matchesTutorSubject(["Mathematics and Physics"], "Math"), true);
  assert.equal(matchesTutorSubject(["Chemistry"], "Math"), false);
});

test("Science includes natural science subjects but not Computer Science alone", () => {
  assert.equal(matchesTutorSubject(["Mathematics and Physics"], "Science"), true);
  assert.equal(matchesTutorSubject(["Chemistry"], "Science"), true);
  assert.equal(matchesTutorSubject(["Computer Science"], "Science"), false);
});

test("Programming includes Computer Science", () => {
  assert.equal(matchesTutorSubject(["Computer Science"], "Programming"), true);
});
