import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const css = read("app/globals.css");

test("block sizing follows available reading width beside outlines and inside backgrounds", () => {
  assert.match(css, /container: academy-block \/ inline-size/);
  assert.match(css, /@container academy-block \(max-width: 639px\)/);
  assert.match(css, /@container academy-block \(min-width: 640px\) and \(max-width: 899px\)/);
  assert.match(read("components/tutor-academy/AcademyLessonBlocks.tsx"), /blockType=\{block.type\}/);
  const background = read("components/tutor-academy/AcademyBlockBackground.tsx");
  assert.equal(background.match(/data-academy-block-type=\{blockType\}/g).length, 2);
  assert.doesNotMatch(background, /paddingTop:/);
});

test("compact callouts give paragraphs the full width instead of an icon column", () => {
  assert.match(css, /academy-callout-copy \{ display: contents;/);
  assert.match(css, /academy-callout-layout \{ display: grid; grid-template-columns: 1\.25rem minmax\(0, 1fr\)/);
  assert.match(css, /academy-callout \.academy-reading-copy \{ grid-column: 1 \/ -1;/);
  assert.match(css, /academy-callout h2 \{ font-size: 1\.25rem; line-height: 1\.35; margin: 0;/);
});

test("narrow activities compact space without clipping content or shrinking arrow targets", () => {
  assert.match(css, /academy-process > div:first-child > div \{ min-height: 12rem; padding: 1\.25rem;/);
  assert.match(css, /academy-carousel-copy \{ min-height: 0; padding: 1rem;/);
  assert.match(css, /academy-process-count \{ display: inline;/);
  const interactive = read("components/tutor-academy/AcademyInteractiveBlocks.tsx");
  assert.match(interactive, /col-start-1 row-start-1 flex min-w-0 flex-col justify-between/);
  assert.match(interactive, /academy-process-pagination flex min-w-0 flex-1 flex-wrap/);
  assert.match(interactive, /h-11 w-11/);
});

test("long chapter roadmaps disclose topics on demand rather than consuming multiple phone screens", () => {
  assert.match(read("components/tutor-academy/AcademyLessonRoadmap.tsx"), /open=\{sections.length <= 4\}/);
  assert.match(css, /academy-lesson-roadmap > ol a \{ flex-direction: row; align-items: center; min-height: 3\.25rem;/);
  assert.match(css, /\[data-academy-block-type="table"\] :where\(td, th\) \{ padding: 0\.625rem 0\.75rem;/);
});
