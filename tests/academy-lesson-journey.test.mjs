import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { academyLessonJourneySteps } from "../lib/academy-lesson-roadmap.ts";
import { germanA1RestructuredCourse } from "../lib/german-a1-restructured-course.ts";
import { germanA2Course } from "../lib/german-a2-course.ts";
import { germanB1Course } from "../lib/german-b1-course.ts";
import { germanB2Course } from "../lib/german-b2-course.ts";

test("topic steps partition every authored block exactly once, preserving course order", () => {
  for (const course of [germanA1RestructuredCourse, germanA2Course, germanB1Course, germanB2Course]) {
    for (const lesson of course.lessons) {
      const before = JSON.stringify(lesson.blocks);
      const steps = academyLessonJourneySteps(lesson.blocks, "Einstieg");
      if (steps.length) {
        assert.equal(steps[0].start, 0);
        assert.equal(steps.at(-1).end, lesson.blocks.length);
        const indices = steps.flatMap((step) => {
          assert.ok(step.end > step.start);
          return Array.from({ length: step.end - step.start }, (_, index) => step.start + index);
        });
        assert.deepEqual(indices, lesson.blocks.map((_, index) => index));
        assert.equal(new Set(steps.map((step) => step.id)).size, steps.length);
      }
      assert.equal(JSON.stringify(lesson.blocks), before);
    }
  }
});

test("A1 chapter one has an introduction followed by its ten original topics", () => {
  const steps = academyLessonJourneySteps(germanA1RestructuredCourse.lessons[0].blocks, "Einstieg");
  assert.equal(steps.length, 11);
  assert.equal(steps[0].label, "Einstieg");
  assert.match(steps[1].label, /^1\.1/);
  assert.match(steps.at(-1).label, /^1\.10/);
});

test("lessons without topics retain the original whole-lesson rendering", () => {
  assert.deepEqual(academyLessonJourneySteps([], "Start"), []);
  assert.deepEqual(academyLessonJourneySteps([{ type: "text", heading: "Introduction", paragraphs: ["Hi"] }], "Start"), []);
});

test("B2 lessons without numbered topics use learning stages as focused sections", () => {
  for (const lesson of germanB2Course.lessons) {
    const steps = academyLessonJourneySteps(lesson.blocks, "Einstieg");
    assert.ok(steps.length > 1, lesson.title);
  }
});

test("switching topics hides mounted children, protects recordings, and does not save completion", async () => {
  const source = await readFile(new URL("../components/tutor-academy/AcademyLessonJourney.tsx", import.meta.url), "utf8");
  assert.match(source, /steps\.map/);
  assert.match(source, /hidden=\{!whole && active !== index\}/);
  assert.match(source, /nodes\.slice\(step.start, step.end\)/);
  assert.match(source, /data-academy-recording/);
  assert.match(source, /hashchange/);
  assert.match(source, /aria-controls/);
  assert.doesNotMatch(source, /recordAcademyBlockCompletion|router\.refresh/);
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.academy-topic-content\[hidden\] \{ display: none; \}/);
});

test("the roadmap slot has a stable key and both rendering modes normalize block children", async () => {
  const blocks = await readFile(new URL("../components/tutor-academy/AcademyLessonBlocks.tsx", import.meta.url), "utf8");
  assert.match(blocks, /roadmap=\{<AcademyLessonRoadmap key="lesson-roadmap"/);
  assert.match(blocks, /key=\{block.id \|\| blockIndex\}/);
  const journey = await readFile(new URL("../components/tutor-academy/AcademyLessonJourney.tsx", import.meta.url), "utf8");
  assert.match(journey, /Children.toArray\(children\)/);
  assert.match(journey, /steps.length < 2.*\{roadmap\}\{nodes\}/);
});

test("focused navigation scrolls to a non-sticky start marker and shares the exact active topic", async () => {
  const journey = await readFile(new URL("../components/tutor-academy/AcademyLessonJourney.tsx", import.meta.url), "utf8");
  assert.match(journey, /ref=\{topicStart\} aria-hidden="true" className="h-0 scroll-mt-16"/);
  assert.match(journey, /topicStart.current\?\.scrollIntoView\(\{ block: "start", behavior: "instant" \}\)/);
  assert.doesNotMatch(journey, /navigator.current\?\.scrollIntoView/);
  assert.match(journey, /AcademyJourneyContext.Provider value=\{current.id\}/);
  const roadmap = await readFile(new URL("../components/tutor-academy/AcademyLessonRoadmap.tsx", import.meta.url), "utf8");
  assert.match(roadmap, /journeyCurrent \?\? scrollCurrent/);
  assert.doesNotMatch(roadmap, /visible.at\(-1\) \|\| targets\[0\]/);
});
