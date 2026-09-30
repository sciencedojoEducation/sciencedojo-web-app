import assert from "node:assert/strict";
import { test } from "node:test";

import { getAcademyLessonOutline } from "../lib/academy-lesson-outline.ts";
import { germanA1RestructuredCourse } from "../lib/german-a1-restructured-course.ts";

test("long beginner chapters expose their ten sections and production tasks", () => {
  for (const lesson of germanA1RestructuredCourse.lessons.slice(0, 3)) {
    const outline = getAcademyLessonOutline(lesson);
    assert.equal(outline.length, 12, lesson.title);
    assert.match(outline[0].label, /^\d\.1 /);
    assert.deepEqual(outline.slice(-2).map((item) => item.label),
      ["Direkt zu Schreiben", "Direkt zu Sprechen"]);
    assert.ok(outline.every((item) => lesson.blocks.some((block) => block.id === item.id)));
  }
});

test("later chapters expose a concise four-skill route without changing block IDs", () => {
  const lesson = germanA1RestructuredCourse.lessons.find((item) => item.slug === "a1-kapitel-04");
  const outline = getAcademyLessonOutline(lesson);
  assert.deepEqual(outline.map((item) => item.label),
    ["Hören", "Lesen", "Wortschatz", "Schreiben", "Sprechen", "Alltags-Challenge", "Freiwilliger Wortschatz", "Kapitelabschluss"]);
  assert.equal(new Set(outline.map((item) => item.id)).size, outline.length);
});

test("short route lessons do not get an unnecessary jump list", () => {
  const orientation = germanA1RestructuredCourse.lessons.find((item) => item.slug === "a1-goethe-01");
  assert.deepEqual(getAcademyLessonOutline(orientation), []);
});
