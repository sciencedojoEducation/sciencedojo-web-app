import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("goal callouts use compact phone proportions in portrait and landscape only", () => {
  const css = read("app/globals.css");
  const callout = css.split("/* Goal/tip callouts")[1].split("/* Tablet proportions:")[0];
  assert.match(callout, /@media \(max-width: 899px\)/);
  assert.match(callout, /\.academy-callout \{ padding: 1rem;/);
  assert.match(callout, /\.academy-callout h2 \{ font-size: 1\.25rem; line-height: 1\.35;/);
  assert.match(callout, /\.academy-reading-copy \{ font-size: 1rem; line-height: 1\.6; margin-top: 0\.375rem;/);
  assert.match(callout, /\.academy-callout-icon \{ width: 1\.5rem; height: 1\.5rem;/);
  assert.match(callout, /\.academy-callout-icon svg \{ width: 1\.125rem; height: 1\.125rem;/);
  assert.match(read("components/tutor-academy/AcademyLessonBlocks.tsx"), /academy-callout border-l-4 p-6 sm:p-7/);
});

test("phone typography reduces long headings, reading copy and rating prompts without shrinking controls", () => {
  const css = read("app/globals.css");
  const phone = css.split("/* Phone proportions:")[1].split("/* Tablet proportions:")[0];
  assert.match(phone, /@media \(max-width: 639px\)/);
  assert.match(phone, /academy-course-cover h1 \{ font-size: 1\.625rem; line-height: 1\.25;/);
  assert.match(phone, /\[data-academy-lesson\] h2 \{ font-size: 1\.375rem;/);
  assert.match(phone, /font-size: 1rem; line-height: 1\.65;/);
  assert.match(phone, /academy-rating-card > p,[\s\S]*?font-size: 1\.0625rem; line-height: 1\.5; font-weight: 600;/);
  assert.match(phone, /min-height: 2\.75rem;/);
  assert.match(phone, /academy-block-stack \{ gap: 2rem;/);
  assert.match(read("components/tutor-academy/AcademyInteractiveBlocks.tsx"), /academy-rating-card border/);
});

test("tablet copy and headings use a smaller scale without changing desktop settings", () => {
  const css = read("app/globals.css");
  assert.match(css, /@media \(min-width: 640px\) and \(max-width: 1199px\)/);
  assert.match(css, /\[data-academy-lesson\] h2 \{ font-size: 1\.375rem; line-height: 1\.35;/);
  assert.match(css, /academy-lesson-header h1 \{ font-size: 1\.875rem;/);
  assert.match(css, /academy-knowledge-card label \{ padding: 0\.75rem; min-height: 3rem;/);
  assert.match(css, /font-size: 1\.125rem; line-height: 1\.75;/);
});

test("tablet menu is left aligned and landscape content makes space without moving navigation sentinel", () => {
  const css = read("app/globals.css");
  assert.match(css, /left: var\(--academy-topic-dock-left, 1rem\);\s*right: auto;/);
  assert.match(css, /\[data-topic-menu-open="true"\] > \.academy-topic-body \{ padding-left: 16rem;/);
  assert.doesNotMatch(css, /\[data-topic-menu-open="true"\] \{ padding-left/);
  assert.match(css, /prefers-reduced-motion: reduce\)\s*\{\s*\[data-academy-lesson\] > \.academy-topic-body \{ transition: none;/);
});

test("outline buttons preserve topic selection, recording guard and actual saved completion markers", () => {
  const navigator = read("components/tutor-academy/AcademyTopicNavigator.tsx");
  assert.match(navigator, /aria-current=\{index === active \? "step"/);
  assert.match(navigator, /step.requiredIds.length > 0 && step.requiredIds.every/);
  assert.match(navigator, /onSelect\(index\)/);
  const journey = read("components/tutor-academy/AcademyLessonJourney.tsx");
  assert.match(journey, /onSelect=\{move\}/);
  assert.match(journey, /if \(!canNavigate\(\)\) return;/);
});
