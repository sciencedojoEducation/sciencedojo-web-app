import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("chapter completion replaces Next only at the final topic or end of whole-chapter view", () => {
  const journey = read("components/tutor-academy/AcademyLessonJourney.tsx");
  assert.match(journey, /lessonEnd && \(whole \|\| active \+ 1 >= steps.length\)/);
  assert.match(journey, /\{nodes\}\{lessonEnd\}/);
  assert.match(read("components/tutor-academy/AcademyLessonBlocks.tsx"), /lessonEnd=\{lessonEnd\}/);
});

test("learner pages supply one server-gated next action without a second Continue footer", () => {
  const page = read("app/dashboard/tutor/academy/courses/[courseKey]/lessons/[lessonSlug]/page.tsx");
  assert.match(page, /lessonEnd=\{missingRequiredBlocks.length \?/);
  assert.match(page, /<form action=\{completeAction\}>/);
  assert.match(page, /Nächstes Kapitel/);
  assert.doesNotMatch(page, /<footer|"Continue"|"Complete and continue"/);
});
