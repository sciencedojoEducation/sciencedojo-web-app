import test from "node:test";
import assert from "node:assert/strict";
import { academyNavigationCourse } from "../lib/academy-navigation-data.ts";
import { tutorAcademyCourse, emptyAcademyProgress, getAcademyProgressPercent } from "../lib/tutor-academy.ts";

test("navigation omits exercise payloads while preserving progress calculations and source content", () => {
  const navigation = academyNavigationCourse(tutorAcademyCourse);
  assert.ok(tutorAcademyCourse.lessons.some(lesson => lesson.blocks.length));
  assert.ok(navigation.lessons.every(lesson => lesson.blocks.length === 0));
  assert.ok(JSON.stringify(navigation).length < JSON.stringify(tutorAcademyCourse).length / 2);
  for (const completedLessons of [[], [tutorAcademyCourse.lessons[0].slug], tutorAcademyCourse.lessons.map(lesson => lesson.slug)]) {
    const progress = { ...emptyAcademyProgress, completedLessons };
    assert.equal(getAcademyProgressPercent(progress, navigation), getAcademyProgressPercent(progress, tutorAcademyCourse));
  }
  assert.deepEqual(navigation.lessons.map(lesson => lesson.slug), tutorAcademyCourse.lessons.map(lesson => lesson.slug));
});
