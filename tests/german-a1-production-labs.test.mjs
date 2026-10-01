import assert from "node:assert/strict";
import { test } from "node:test";
import { germanA1ProductionLabs, enrichA1Production } from "../lib/german-a1-production-labs.ts";
import { germanA1RestructuredCourse } from "../lib/german-a1-restructured-course.ts";
import { isAcademyBlockRequiredForCompletion } from "../lib/tutor-academy.ts";

const core = germanA1RestructuredCourse.lessons.filter(lesson => !lesson.examTrack);
test("every core chapter contains an original guided production lab and responsive speaking", () => {
  assert.equal(Object.keys(germanA1ProductionLabs).length, 15);
  for (const [index, lesson] of core.entries()) {
    const prefix = `a1-route-${String(index + 1).padStart(2, "0")}-production`;
    const example = lesson.blocks.findIndex(block => block.id === `${prefix}-example`);
    const writing = lesson.blocks.findIndex(block => block.id === `${prefix}-write`);
    const exchange = lesson.blocks.findIndex(block => block.id === `${prefix}-exchange`);
    assert.ok(example >= 0 && writing > example && exchange > writing, lesson.title);
    assert.equal(isAcademyBlockRequiredForCompletion(lesson.blocks[writing]), false);
    assert.equal(isAcademyBlockRequiredForCompletion(lesson.blocks[exchange]), false);
    assert.match(lesson.blocks[exchange].prompt, /Rückfrage/);
    assert.match(lesson.blocks[exchange].prompt, /keine aufgenommene Partnerstimme/);
    assert.equal(new Set(lesson.blocks.map(block => block.id)).size, lesson.blocks.length);
  }
});
test("spaced review revisits two, four and seven chapters back without later language", () => {
  for (const [index, lesson] of core.entries()) {
    const number = index + 1;
    const review = lesson.blocks.find(block => block.id.endsWith("-production-spaced-review"));
    const expected = [number - 2, number - 4, number - 7].filter(n => n > 0);
    if (!expected.length) { assert.equal(review, undefined); continue; }
    assert.deepEqual([...review.prompt.matchAll(/Aus Kapitel (\d+):/g)].map(match => Number(match[1])), expected);
    assert.equal(isAcademyBlockRequiredForCompletion(review), false);
    assert.ok(expected.every(n => n < number - 1));
  }
});
test("enrichment keeps pre-existing block objects and order unchanged", () => {
  const blocks = [
    { id: "custom", type: "text", heading: "Custom", paragraphs: ["Preserve me"] },
    { id: "writing", type: "writing-practice" },
    { id: "speaking", type: "speaking-practice" },
  ];
  const enriched = enrichA1Production({ title: "Test", durationMinutes: 60, blocks }, 4);
  assert.deepEqual(enriched.blocks.filter(block => blocks.includes(block)), blocks);
  assert.equal(enriched.durationMinutes, 80);
});
