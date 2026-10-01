import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("reading copy uses a responsive comfortable scale without resizing every paragraph/control", () => {
  const css = read("app/globals.css");
  assert.match(css, /\.academy-prose :where\(p, li\),\s*\.academy-reading-copy\s*\{[^}]*font-size: 1\.125rem;[^}]*line-height: 1\.8;[^}]*max-width: 68ch;/);
  assert.match(css, /@media \(min-width: 640px\)\s*\{\s*\.academy-prose[\s\S]*?font-size: 1\.25rem;/);
  assert.match(css, /\.academy-prose > p \+ p \{ margin-top: 1\.75rem;/);
  assert.match(css, /\[data-academy-lesson\] \[data-block-variant\] \.academy-reading-copy/);
});

test("legacy text, rich text, interactive explanations and productive models share the scale", () => {
  assert.match(read("components/tutor-academy/AcademyRichText.tsx"), /academy-prose space-y-6/);
  assert.match(read("components/tutor-academy/AcademyLessonBlocks.tsx"), /academy-prose space-y-6/);
  assert.match(read("components/tutor-academy/AcademyInteractiveBlocks.tsx"), /academy-reading-copy min-h-28/);
  assert.match(read("components/tutor-academy/AcademyLanguagePractice.tsx"), /academy-reading-copy mt-3 whitespace-pre-wrap/);
});
