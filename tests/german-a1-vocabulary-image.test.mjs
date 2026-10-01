import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { germanA1VocabularyImage } from "../lib/german-a1-vocabulary-image.ts";
import { germanA1VocabularySheets } from "../lib/german-a1-vocabulary-sheet-bounds.ts";
import { germanA1RestructuredCourse } from "../lib/german-a1-restructured-course.ts";

test("all 800 original word images have positive, non-overlapping measured windows", () => {
  assert.equal(germanA1VocabularySheets.length, 32);
  for (const sheet of germanA1VocabularySheets) {
    for (const [axis, limit] of [[sheet.columns, sheet.width], [sheet.rows, sheet.height]]) {
      assert.equal(axis.length, 5);
      axis.forEach(([start, end], index) => {
        assert.ok(start >= 0 && end <= limit && end > start);
        if (index) assert.ok(start >= axis[index - 1][1]);
      });
    }
    for (let index = 1; index <= 25; index++) {
      const image = germanA1VocabularyImage(`/images/academy/german-a1/word-cards/chapter-${String(sheet.chapter).padStart(2, "0")}-${String(index).padStart(2, "0")}.jpg`);
      assert.ok(image);
      assert.ok(existsSync(new URL(`../public${image.src}`, import.meta.url)));
    }
  }
});

test("uneven rows recover details clipped by the old uniform square crop", () => {
  const image = germanA1VocabularyImage("/images/academy/german-a1/word-cards/chapter-01-21.jpg");
  assert.equal(image.top, 962);
  assert.equal(image.height, 241);
  assert.equal(image.left, 7);
  const last = germanA1VocabularyImage("/images/academy/german-a1/word-cards/chapter-31-25.jpg");
  assert.equal(last.top, 958);
  assert.equal(last.height, 288);
});

test("every pictured A1 course card uses a recoverable original illustration", () => {
  const cards = germanA1RestructuredCourse.lessons.flatMap((lesson) => lesson.blocks
    .filter((block) => block.type === "flashcards").flatMap((block) => block.items));
  const pictured = cards.filter((card) => card.src);
  assert.ok(pictured.length >= 600);
  assert.ok(pictured.every((card) => germanA1VocabularyImage(card.src)));
});

test("custom images and invalid indices are never remapped", () => {
  for (const src of [undefined, "/custom.jpg", "https://example.com/chapter-01-01.jpg",
    "/images/academy/german-a1/word-cards/chapter-01-00.jpg",
    "/images/academy/german-a1/word-cards/chapter-33-01.jpg",
    "/images/academy/german-a1/word-cards/chapter-01-26.jpg"]) {
    assert.equal(germanA1VocabularyImage(src), null);
  }
});

test("measured visuals preserve proportions without a hover zoom that clips edges", () => {
  const source = readFileSync(new URL("../components/tutor-academy/AcademyInteractiveBlocks.tsx", import.meta.url), "utf8");
  const measured = source.slice(source.indexOf("if (illustration)"), source.indexOf("role={item.sprite"));
  assert.match(measured, /aspectRatio:/);
  assert.doesNotMatch(measured, /scale-\[|object-cover/);
  assert.match(measured, /alt=\{item.alt/);
});

test("future image slicing uses the same measured rectangles rather than equal square cells", () => {
  const source = readFileSync(new URL("../scripts/slice-german-a1-vocabulary-images.mjs", import.meta.url), "utf8");
  assert.match(source, /germanA1VocabularyImage\(/);
  assert.match(source, /String\(illustration.height\)/);
  assert.match(source, /String\(illustration.width\)/);
  assert.doesNotMatch(source, /sheetSize|Math.min\(right/);
});
