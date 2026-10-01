import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { test } from "node:test";
import sharp from "sharp";

test("every learning phase has a compact transparent illustration", async () => {
  for (const phase of ["learn", "try", "use", "review"]) {
    const path = new URL(`../public/images/academy/journey/${phase}-v1.webp`, import.meta.url);
    const buffer = await readFile(path);
    const metadata = await sharp(buffer).metadata();
    assert.equal(metadata.format, "webp");
    assert.equal(metadata.hasAlpha, true);
    assert.equal(metadata.height, 384);
    assert.ok((await stat(path)).size < 50000);
  }
});

test("stage characters remain decorative, uncropped and responsive", async () => {
  const source = await readFile(new URL("../components/tutor-academy/AcademyLessonRoadmap.tsx", import.meta.url), "utf8");
  assert.match(source, /journey\/\$\{phase\}-v1\.webp/);
  assert.match(source, /alt="" aria-hidden="true"/);
  assert.match(source, /object-contain/);
  assert.match(source, /h-24 w-24 shrink-0/);
  assert.match(source, /sm:h-28 sm:w-30/);
});
