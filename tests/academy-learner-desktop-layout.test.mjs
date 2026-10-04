import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
const read = file => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("desktop learner lesson bodies and headers widen without changing phone sizes", () => {
  for (const file of ["components/tutor-academy/AcademyLessonHeader.tsx", "app/dashboard/tutor/academy/courses/[courseKey]/lessons/[lessonSlug]/page.tsx", "app/dashboard/tutor/academy/lessons/[lessonSlug]/page.tsx"]) {
    assert.match(read(file), /max-w-\[728px\] lg:max-w-\[1080px\] xl:max-w-\[1200px\]/);
  }
});

test("desktop hamburger owns the themed rail instead of a separate topic menu", () => {
  const navigation = read("components/tutor-academy/AcademyCourseNavigation.tsx");
  assert.match(navigation, /useState\(true\)/);
  assert.match(navigation, /data-open=\{desktopOpen\} inert=\{!desktopOpen\}/);
  assert.match(navigation, /aria-controls=\{railId\} aria-expanded=\{desktopOpen\}/);
  assert.match(navigation, /setDesktopOpen\(value => !value\)/);
  assert.match(navigation, /<AcademyCourseNavigationContext.Provider value=\{true\}>/);
  assert.match(read("components/tutor-academy/AcademyTopicNavigator.tsx"), /if \(courseShellOwnsNavigation\) return null/);
  const css = read("app/globals.css");
  assert.match(css, /\.academy-desktop-course-rail\[data-open="false"\] \{\s*width: 0;\s*visibility: hidden;/);
  assert.match(css, /\.academy-desktop-course-rail\[data-open="false"\] \{ transition: none;/);
});

test("rail can shrink past its fixed-width child and retains a bounded scroll height", () => {
  const css = read("app/globals.css");
  const rail = css.match(/\.academy-desktop-course-rail \{\s*display: block;([\s\S]*?)\n  \}/)[1];
  assert.match(rail, /min-width: 0;/);
  assert.match(rail, /min-height: 0;/);
  assert.match(rail, /height: 100%;/);
  assert.match(rail, /overflow: clip;/);
  const navigation = read("components/tutor-academy/AcademyCourseNavigation.tsx");
  assert.match(navigation, /h-full w-\[280px\] shrink-0 overflow-y-auto/);
});
