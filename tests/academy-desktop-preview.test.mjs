import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("desktop preview fills the available screen without device scaling or bezel", () => {
  const frame = read("components/admin/academy-builder/AcademyPreviewFrame.tsx");
  assert.match(frame, /const desktop = deviceId === "desktop"/);
  assert.match(frame, /width: desktop \? "100%"/);
  assert.match(frame, /transform: desktop \? "none"/);
  assert.match(frame, /transform: desktop \? "none" : `scale\(\$\{frame.scale\}\)`/);
});

test("every preview pushes content aside; narrow devices retain page width and wide devices reflow", () => {
  const css = read("components/admin/academy-builder/AcademyDesktopPreviewLayout.module.css");
  assert.match(css, /\.outline \{[\s\S]*?overflow-y: auto;/);
  assert.match(css, /@media \(min-width: 900px\)/);
  assert.match(css, /\.layout \{ --outline-width: min\(16rem, 85vw\); overflow-x: clip;/);
  assert.match(css, /\.content \{[^}]*width: 100%; margin-left: var\(--outline-width\);/);
  assert.match(css, /@media \(min-width: 900px\) \{\s*\.content \{ width: auto; \}/);
  assert.doesNotMatch(css, /\.backdrop/);
  assert.match(css, /\.layout :global\(\.academy-topic-nav\) \{ display: none; \}/);
  const layout = read("components/admin/academy-builder/AcademyDesktopPreviewLayout.tsx");
  assert.match(layout, /import styles from "\.\/AcademyDesktopPreviewLayout.module.css"/);
  assert.match(layout, /className=\{styles.outline\}/);
  assert.doesNotMatch(layout, /styles.backdrop/);
});

test("desktop outline starts open, hides smoothly without unmounting, and remains keyboard accessible", () => {
  const component = read("components/admin/academy-builder/AcademyDesktopPreviewLayout.tsx");
  const css = read("components/admin/academy-builder/AcademyDesktopPreviewLayout.module.css");
  assert.match(component, /useState\(true\)/);
  assert.match(component, /useState\(false\)/);
  assert.match(component, /useSyncExternalStore\(subscribeViewport/);
  assert.match(component, /const open = wide \? desktopOpen : mobileOpen/);
  assert.match(component, /Skip course outline/);
  assert.match(component, /aria-controls=\{outlineId\} aria-expanded=\{open\}/);
  assert.match(component, /inert=\{!open\} aria-hidden=\{!open\}/);
  assert.match(component, /setOpen\(\(value\) => !value\)/);
  assert.match(component, /event.key === "Escape"/);
  assert.match(component, /focus\(\{ preventScroll: true \}\)/);
  assert.match(css, /\.closed \.content \{ margin-left: 0;/);
  assert.match(css, /\.closed \.outline \{ transform: translateX\(-100%\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test("cover, lesson and quiz views share the desktop outline for drafts and starter templates", () => {
  for (const file of ["app/dashboard/admin/academy/[courseKey]/preview/page.tsx", "app/dashboard/admin/academy/new/preview/page.tsx"]) {
    const source = read(file);
    assert.match(source, /<AcademyDesktopPreviewLayout[\s\S]*?outline=\{<AcademyCourseOutline/);
    assert.ok(source.indexOf("<AcademyDesktopPreviewLayout") < source.indexOf('{view === "cover"'));
    assert.match(source, /progress=\{emptyAcademyProgress\}/);
    assert.match(source, /<AcademyCourseContents\s+preview/);
  }
  assert.match(read("components/admin/academy-builder/AcademyTemplatePreviewStudio.tsx"), /useState<AcademyPreviewDeviceId>\("desktop"\)/);
  assert.match(read("components/admin/AcademyCourseEditor.tsx"), /useState<AcademyPreviewDeviceId>\("desktop"\)/);
});

test("preview cover permits exploration of every lesson without weakening learner gates", () => {
  const contents = read("components/tutor-academy/AcademyCourseContents.tsx");
  const journey = read("components/tutor-academy/AcademyJourneyContents.tsx");
  for (const component of [contents, journey]) {
    assert.match(component, /preview = false/);
    assert.match(component, /preview \? course.lessons : getAcademyRequiredLessons/);
  }
  assert.match(journey, /preview \? \{ status: "unstarted", locked: false \} : getAcademyJourneyLessonState/);
});
