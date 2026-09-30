import assert from "node:assert/strict";
import { test } from "node:test";
import { germanA1RestructuredCourse } from "../lib/german-a1-restructured-course.ts";
import { styleGermanA1Lesson } from "../lib/german-a1-visual-design.ts";
import { academyBackgroundNeedsContentPanel } from "../lib/academy-block-background.ts";

function withoutAppearance(block) {
  const content = { ...block };
  delete content.appearance;
  return content;
}

test("every A1 chapter has a scene and differentiated skill colours", () => {
  for (const lesson of germanA1RestructuredCourse.lessons.filter((item) => !item.examTrack)) {
    const backgrounds = lesson.blocks.map((block) => block.appearance?.background).filter(Boolean);
    assert.ok(backgrounds.some((background) => background.kind === "image"), lesson.title);
    assert.ok(new Set(backgrounds.map((background) => background.color).filter(Boolean)).size >= 5, lesson.title);
    for (const type of ["audio", "flashcards", "writing-practice", "speaking-practice"]) {
      assert.ok(lesson.blocks.filter((block) => block.type === type).every((block) => block.appearance?.background), `${lesson.title}: ${type}`);
    }
  }
});

test("visual styling preserves content and explicit author choices and is idempotent", () => {
  for (const lesson of germanA1RestructuredCourse.lessons) {
    assert.deepEqual(styleGermanA1Lesson(lesson), lesson);
    const unstyled = { ...lesson, blocks: lesson.blocks.map(withoutAppearance) };
    const styled = styleGermanA1Lesson(unstyled);
    assert.deepEqual(styled.blocks.map(withoutAppearance), unstyled.blocks);
  }
  const lesson = { blocks: [{ type: "audio", id: "chosen", appearance: { background: { kind: "custom", color: "#123456" } } }] };
  assert.deepEqual(styleGermanA1Lesson(lesson), lesson);
});

test("all scenic backgrounds retain a readable content panel", () => {
  const scenes = germanA1RestructuredCourse.lessons.flatMap((lesson) => lesson.blocks)
    .map((block) => block.appearance?.background).filter((background) => background?.kind === "image");
  assert.equal(scenes.length, 15);
  assert.ok(scenes.every(academyBackgroundNeedsContentPanel));
});
