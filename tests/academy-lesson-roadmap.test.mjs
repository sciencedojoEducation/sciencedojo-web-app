import assert from "node:assert/strict";
import { test } from "node:test";
import { academyBlockAnchor, academyLessonRoadmap, isRoadmapSectionComplete } from "../lib/academy-lesson-roadmap.ts";
import { germanA1RestructuredCourse } from "../lib/german-a1-restructured-course.ts";
import { germanA2Course } from "../lib/german-a2-course.ts";
import { germanB1Course } from "../lib/german-b1-course.ts";
import { germanB2Course } from "../lib/german-b2-course.ts";
import { isGermanAcademyCourse } from "../lib/german-academy-course.ts";

test("every roadmap anchor resolves to an existing block across A1–B2", () => {
  for (const course of [germanA1RestructuredCourse, germanA2Course, germanB1Course, germanB2Course]) {
    assert.ok(isGermanAcademyCourse(course.key));
    for (const lesson of course.lessons) {
      const original = JSON.stringify(lesson.blocks);
      const roadmap = academyLessonRoadmap(lesson.blocks);
      const anchors = new Set(lesson.blocks.map(academyBlockAnchor));
      for (const item of [...roadmap.sections, ...roadmap.phases]) assert.ok(anchors.has(item.id), item.id);
      assert.equal(new Set(roadmap.sections.map((item) => item.id)).size, roadmap.sections.length);
      assert.equal(JSON.stringify(lesson.blocks), original, "No content reordering or mutation");
    }
  }
});

test("A1 alphabet roadmap preserves all ten authored subchapter transitions in order", () => {
  const roadmap = academyLessonRoadmap(germanA1RestructuredCourse.lessons[0].blocks);
  assert.equal(roadmap.sections.length, 10);
  assert.match(roadmap.sections[0].label, /^1\.1/);
  assert.match(roadmap.sections[9].label, /^1\.10/);
  assert.deepEqual(roadmap.phases.map((item) => item.phase), ["learn", "try", "use", "review"]);
});

test("roadmap completion requires every saved required activity; visiting never counts", () => {
  const item = { id: "section", label: "Practice", requiredIds: ["write", "speak"] };
  assert.equal(isRoadmapSectionComplete(item, []), false);
  assert.equal(isRoadmapSectionComplete(item, ["write"]), false);
  assert.equal(isRoadmapSectionComplete(item, ["write", "speak"]), true);
  assert.equal(isRoadmapSectionComplete({ ...item, requiredIds: [] }, ["write", "speak"]), false);
});

test("empty lessons and id-less legacy blocks are handled without broken anchors", () => {
  assert.deepEqual(academyLessonRoadmap([]), { sections: [], phases: [] });
  assert.equal(academyBlockAnchor({ type: "divider", label: "A" }, 3), "academy-block-position-3");
});
