import assert from "node:assert/strict";
import { test } from "node:test";
import { enrichA1ChapterTwo } from "../lib/german-a1-guided-practice.ts";
import { germanA1Course } from "../lib/german-a1-course.ts";
import { germanA1RestructuredCourse } from "../lib/german-a1-restructured-course.ts";
import { isAcademyBlockRequiredForCompletion } from "../lib/tutor-academy.ts";

const lesson = germanA1RestructuredCourse.lessons[1];
test("chapter two adds five original productive drills without new completion gates", () => {
  const drills = lesson.blocks.filter(block => block.id.startsWith("a1-route-02-guided-") && block.type === "writing-practice");
  assert.equal(drills.length, 5);
  for (const block of drills) {
    assert.equal(isAcademyBlockRequiredForCompletion(block), false);
    assert.ok(block.prompt.length > 100);
    assert.ok(block.checklist.length >= 3);
  }
});
test("guided stages precede existing independent portfolio tasks and preserve source IDs", () => {
  const source = germanA1Course.lessons.find(item => item.id === lesson.id);
  const enriched = enrichA1ChapterTwo(source.blocks);
  assert.deepEqual(enriched.filter(block => !block.id.startsWith("a1-route-02-guided-")).map(block => block.id), source.blocks.map(block => block.id));
  for (const [newId, suffix] of [["vom-profil-zum-text", "-schreiben"], ["wechselgespraech", "-sprechen"]]) {
    const index = enriched.findIndex(block => block.id === `a1-route-02-guided-${newId}`);
    assert.ok(index >= 0);
    assert.ok(enriched[index + 1].id.endsWith(suffix));
  }
  assert.equal(new Set(lesson.blocks.map(block => block.id)).size, lesson.blocks.length);
});
