import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { academyCourseOutline } from "../lib/academy-course-outline.ts";
import { emptyAcademyProgress } from "../lib/tutor-academy.ts";
import { germanA1RestructuredCourse } from "../lib/german-a1-restructured-course.ts";
import { germanA2Course } from "../lib/german-a2-course.ts";
import { germanB1Course } from "../lib/german-b1-course.ts";
import { germanB2Course } from "../lib/german-b2-course.ts";

test("outline headings retain authored casing and both menus use compact unframed controls", () => {
  const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  const outline = read("components/tutor-academy/AcademyCourseOutline.tsx");
  const summary = outline.match(/<summary className="([^"]+)"/)[1];
  assert.doesNotMatch(summary, /uppercase|tracking-/);
  assert.match(summary, /text-sm/);
  const previewCss = read("components/admin/academy-builder/AcademyDesktopPreviewLayout.module.css");
  const learnerCss = read("app/globals.css");
  for (const [css, selector] of [[previewCss, /\.toggle \{([\s\S]*?)\n  \}/], [learnerCss, /\.academy-topic-nav-toggle \{([\s\S]*?)\n\}/]]) {
    const rules = css.match(selector)[1];
    assert.match(rules, /width: 2\.25rem;/);
    assert.match(rules, /height: 2\.25rem;/);
    assert.match(rules, /border: 0;/);
    assert.doesNotMatch(rules, /box-shadow/);
    assert.match(css, /@media \(pointer: coarse\)/);
  }
});

test("preview course outline covers every lesson once, grouped in authored order with empty circles", () => {
  for (const course of [germanA1RestructuredCourse, germanA2Course, germanB1Course, germanB2Course]) {
    const outline = academyCourseOutline(course, emptyAcademyProgress, true);
    const rows = outline.groups.flatMap((group) => group.lessons);
    assert.deepEqual(rows.map((row) => row.lesson.slug), course.lessons.map((lesson) => lesson.slug));
    assert.equal(outline.percent, 0);
    assert.ok(rows.every((row) => row.state === "unstarted" && !row.locked));
  }
});

test("saved lesson completion drives circle and percentage; started does not mean complete", () => {
  const first = germanB2Course.lessons[0];
  const started = { ...emptyAcademyProgress, startedLessonIds: [first.id], startedLessons: [first.slug] };
  const inProgress = academyCourseOutline(germanB2Course, started);
  assert.equal(inProgress.groups[0].lessons[0].state, "started");
  assert.equal(inProgress.percent, 0);
  const completed = { ...started, completedLessonIds: [first.id], completedLessons: [first.slug] };
  const outline = academyCourseOutline(germanB2Course, completed);
  assert.equal(outline.groups[0].lessons[0].state, "completed");
  assert.ok(outline.percent > 0 && outline.percent < 100);
  assert.equal(academyCourseOutline(germanB2Course, completed, true).groups[0].lessons[0].state, "unstarted");
});

test("real learner outline keeps linear locks and selected exam routes", () => {
  const outline = academyCourseOutline(germanA2Course, emptyAcademyProgress);
  const rows = outline.groups.flatMap((group) => group.lessons);
  assert.ok(rows.every(({ lesson }) => !lesson.examTrack));
  assert.ok(rows.some((row) => row.locked));
});

test("previews supply an outline; learners use their existing themed course navigation without a duplicate", () => {
  for (const file of ["app/dashboard/admin/academy/[courseKey]/preview/page.tsx", "app/dashboard/admin/academy/new/preview/page.tsx"]) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    assert.match(source, /outline=\{<AcademyCourseOutline course=\{course\}/);
    assert.doesNotMatch(source, /courseOutline=/);
  }
  for (const file of ["app/dashboard/tutor/academy/courses/[courseKey]/lessons/[lessonSlug]/page.tsx", "app/dashboard/tutor/academy/lessons/[lessonSlug]/page.tsx"]) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /AcademyCourseOutline|courseOutline=/);
  }
  for (const file of ["app/dashboard/academy/[courseKey]/layout.tsx", "app/dashboard/tutor/academy/layout.tsx"]) {
    assert.match(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), /<AcademyCourseNavigation/);
  }
  const menu = readFileSync(new URL("../components/tutor-academy/AcademyTopicNavigator.tsx", import.meta.url), "utf8");
  assert.match(menu, /\{courseOutline \|\| children\}/);
  assert.match(menu, /!courseOutline && docked/);
  const view = readFileSync(new URL("../components/tutor-academy/AcademyCourseOutline.tsx", import.meta.url), "utf8");
  assert.match(view, /aria-valuenow=\{outline.percent\}/);
  assert.match(view, /<AcademyProgressRing state=\{state\} size=\{17\}/);
  assert.match(view, /aria-current=\{active \? "page"/);
  assert.match(view, /aria-disabled="true"/);
  assert.match(view, /<details key=\{group.key\}/);
  const blocks = readFileSync(new URL("../components/tutor-academy/AcademyLessonBlocks.tsx", import.meta.url), "utf8");
  assert.match(blocks, /key=\{lessonId \|\| blocks\[0\]\?\.id \|\| courseKey\}/);
});

test("preview outline uses the learner's course image, theme accent and compact progress rows", () => {
  const source = readFileSync(new URL("../components/tutor-academy/AcademyCourseOutline.tsx", import.meta.url), "utf8");
  assert.match(source, /<Image src=\{course.heroImage/);
  assert.match(source, /course.shortTitle \|\| course.title/);
  assert.match(source, /border-l-\[var\(--academy-accent\)\]/);
  assert.match(source, /min-h-\[52px\]/);
  assert.doesNotMatch(source, /min-h-24|from-\[#173A63\]/);
});

test("learner navigation mounts in the course segment rather than a cached pathname-dependent catalogue layout", () => {
  const read = file => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  const catalogue = read("app/dashboard/academy/layout.tsx");
  const course = read("app/dashboard/academy/[courseKey]/layout.tsx");
  assert.doesNotMatch(catalogue, /x-next-pathname|AcademyCourseNavigation/);
  assert.match(course, /params: Promise<\{ courseKey: string \}>/);
  assert.match(course, /const \{ courseKey \} = await params/);
  assert.match(course, /<AcademyCourseNavigation/);
  assert.match(course, /course_pilot_access/);
  assert.match(course, /getTutorAcademyProgress\(course.key\)/);
  assert.doesNotMatch(course, /x-next-pathname/);
  const links = read("components/tutor-academy/AcademyCourseUtilityLinks.tsx");
  assert.match(links, /usePathname\(\)/);
  assert.match(links, /encodeURIComponent\(lesson\)/);
});
