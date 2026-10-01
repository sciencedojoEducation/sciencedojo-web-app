import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("labelled lesson dividers become readable section headings without changing blank separators", () => {
  const renderer = read("components/tutor-academy/AcademyLessonBlocks.tsx");
  assert.match(renderer, /if \(block.label\) \{\s*return <AcademySectionTransition/);
  assert.match(renderer, /role="separator"/);
  const transition = read("components/tutor-academy/AcademySectionTransition.tsx");
  assert.match(transition, /<h2/);
  assert.match(transition, /text-2xl/);
  assert.match(transition, /bg-linear-to-br/);
  assert.match(transition, /sr-only/);
  assert.doesNotMatch(transition, /uppercase|text-\[10px\]/);
});

test("interactive cards retain semantic controls, clear selection and keyboard focus styling", () => {
  const source = read("components/tutor-academy/AcademyInteractiveBlocks.tsx");
  assert.match(source, /role="tablist"/);
  assert.match(source, /aria-selected=\{active === index\}/);
  assert.match(source, /role="tabpanel"/);
  assert.match(source, /<summary/);
  assert.match(source, /focus-within:ring-2/);
  assert.match(source, /answers.includes\(option.id\) \? "border-/);
  assert.match(source, /role="status"/);
  assert.match(source, /motion-reduce:transition-none/);
});

test("presentation changes preserve quiz scoring and server completion rules", () => {
  const source = read("components/tutor-academy/AcademyInteractiveBlocks.tsx");
  assert.match(source, /if \(tracking.completion === "interact" \|\| correct\)/);
  assert.match(source, /recordAcademyBlockCompletion\(tracking.courseKey, tracking.blockId, answer\)/);
  assert.match(source, /disabled=\{!answers.length \|\| pending\}/);
  assert.match(source, /if \(result.error\) setSaveError\(result.error\)/);
});
