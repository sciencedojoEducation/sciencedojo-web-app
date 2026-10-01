import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { academyPreviewContentClass, academyPreviewHeaderClass } from "../lib/academy-preview-layout.ts";

test("preview grows on desktop but retains mobile/tablet width and readable paragraphs", () => {
  assert.match(academyPreviewContentClass, /max-w-\[728px\]/);
  assert.match(academyPreviewContentClass, /lg:max-w-\[1080px\]/);
  assert.match(academyPreviewContentClass, /xl:max-w-\[1200px\]/);
  assert.match(academyPreviewContentClass, /lg:\[&_p\]:max-w-\[68ch\]/);
  assert.match(academyPreviewHeaderClass, /xl:max-w-\[1152px\]/);
});

test("both draft and template previews share the wider layout", () => {
  for (const path of ["app/dashboard/admin/academy/[courseKey]/preview/page.tsx", "app/dashboard/admin/academy/new/preview/page.tsx"]) {
    const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
    assert.match(source, /contentWidthClass=\{academyPreviewHeaderClass\}/);
    assert.equal((source.match(/\$\{academyPreviewContentClass\}/g) || []).length, 2);
  }
});

test("learner header width stays unchanged unless a preview requests the wider layout", () => {
  const source = readFileSync(new URL("../components/tutor-academy/AcademyLessonHeader.tsx", import.meta.url), "utf8");
  assert.match(source, /contentWidthClass = "max-w-\[728px\]"/);
});
