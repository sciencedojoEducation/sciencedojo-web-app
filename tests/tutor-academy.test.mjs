import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  emptyAcademyProgress,
  getAcademyProgressPercent,
  getAcademyResumeHref,
  scoreTutorAcademyQuiz,
  tutorAcademyCourse,
} from "../lib/tutor-academy.ts";

describe("Tutor Academy course", () => {
  test("contains six unique lessons and ten quiz questions", () => {
    assert.equal(tutorAcademyCourse.lessons.length, 6);
    assert.equal(new Set(tutorAcademyCourse.lessons.map((lesson) => lesson.slug)).size, 6);
    assert.equal(tutorAcademyCourse.quiz.length, 10);
  });

  test("starts at the first lesson and resumes the current lesson", () => {
    assert.equal(
      getAcademyResumeHref(emptyAcademyProgress),
      "/dashboard/tutor/academy/lessons/welcome-to-sciencedojo",
    );
    assert.equal(
      getAcademyResumeHref({ ...emptyAcademyProgress, currentLesson: "excellent-lessons" }),
      "/dashboard/tutor/academy/lessons/excellent-lessons",
    );
    assert.equal(
      getAcademyResumeHref({ ...emptyAcademyProgress, completedAt: new Date().toISOString() }),
      "/dashboard/tutor/academy/lessons/welcome-to-sciencedojo",
    );
  });

  test("scores the quiz with an 80 percent pass mark", () => {
    const correctAnswers = Object.fromEntries(
      tutorAcademyCourse.quiz.map((question) => [question.id, question.correctOptionId]),
    );
    const passed = scoreTutorAcademyQuiz(correctAnswers);
    assert.equal(passed.score, 100);
    assert.equal(passed.passed, true);

    const eightCorrect = { ...correctAnswers };
    for (const question of tutorAcademyCourse.quiz.slice(0, 2)) {
      eightCorrect[question.id] = "definitely-wrong";
    }
    assert.equal(scoreTutorAcademyQuiz(eightCorrect).score, 80);
    assert.equal(scoreTutorAcademyQuiz(eightCorrect).passed, true);
  });

  test("counts course completion as the seventh progress step", () => {
    const completedLessons = tutorAcademyCourse.lessons.map((lesson) => lesson.slug);
    assert.equal(getAcademyProgressPercent({ ...emptyAcademyProgress, completedLessons }), 86);
    assert.equal(
      getAcademyProgressPercent({ ...emptyAcademyProgress, completedLessons, completedAt: new Date().toISOString() }),
      100,
    );
  });
});
