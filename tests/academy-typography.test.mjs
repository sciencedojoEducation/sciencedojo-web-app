import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("course body font has regular, bold and italic Atkinson Hyperlegible faces", () => {
  const font = read("lib/academy-fonts.ts");
  assert.match(font, /Atkinson_Hyperlegible\(/);
  assert.match(font, /weight: \["400", "700"\]/);
  assert.match(font, /style: \["normal", "italic"\]/);
  assert.match(font, /variable: "--font-academy-body"/);
});

test("learner routes and shared previews supply the body font without replacing headings", () => {
  for (const path of ["app/dashboard/academy/layout.tsx", "app/dashboard/tutor/academy/layout.tsx",
    "components/tutor-academy/AcademyThemeScope.tsx"]) {
    const source = read(path);
    assert.match(source, /academyBodyFont\.variable/, path);
    assert.match(source, /academy-course-typography/, path);
  }
  const css = read("app/globals.css");
  assert.match(css, /\.academy-course-typography :where\(p, td, textarea, input, figcaption, \.academy-reading-copy\)/);
  assert.match(css, /\[data-block-variant="editorial"\] :is\(\.ProseMirror h2, \.ProseMirror h3, h2, h3\) \{\s*font-family: var\(--font-academy-serif\)/);
  for (const path of ["components/tutor-academy/AcademyLessonBlocks.tsx", "components/tutor-academy/AcademyRichText.tsx"]) {
    const source = read(path);
    const headings = source.match(/<h[1-6]\b[^>]*>/gs) || [];
    assert.ok(headings.length > 0);
    assert.ok(headings.every((tag) => !tag.includes("--font-academy-body")));
  }
});

test("main paragraphs, transcripts and productive practice use the course body font", () => {
  for (const path of ["AcademyLessonBlocks", "AcademyRichText", "AcademyLanguagePractice",
    "AcademyInteractiveBlocks", "AcademyQuiz", "AcademyCarousel"]) {
    assert.match(read(`components/tutor-academy/${path}.tsx`), /--font-academy-body/, path);
  }
});
