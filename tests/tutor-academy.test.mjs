import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  emptyAcademyProgress,
  getAcademyLessonProgressState,
  getAcademyProgressPercent,
  getAcademyQuizProgressState,
  getAcademyResumeHref,
  scoreTutorAcademyQuiz,
  tutorAcademyCourse,
} from "../lib/tutor-academy.ts";
import { validateAcademyCourse } from "../lib/academy-course-validation.ts";
import {
  ACADEMY_BLOCK_SCHEMA_VERSION,
  academyBlockRegistry,
  migrateAcademyCourse,
} from "../lib/academy-schema.ts";

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

  test("distinguishes unstarted, started, and completed lesson rings", () => {
    assert.equal(getAcademyLessonProgressState(emptyAcademyProgress, "excellent-lessons"), "unstarted");
    assert.equal(
      getAcademyLessonProgressState(
        { ...emptyAcademyProgress, currentLesson: "excellent-lessons" },
        "excellent-lessons",
      ),
      "unstarted",
    );
    assert.equal(
      getAcademyLessonProgressState(
        { ...emptyAcademyProgress, startedLessons: ["excellent-lessons"] },
        "excellent-lessons",
      ),
      "started",
    );
    assert.equal(
      getAcademyLessonProgressState(
        { ...emptyAcademyProgress, completedLessons: ["excellent-lessons"] },
        "excellent-lessons",
      ),
      "completed",
    );
  });

  test("shows the quiz as partial after a failed attempt and complete after passing", () => {
    assert.equal(getAcademyQuizProgressState(emptyAcademyProgress), "unstarted");
    assert.equal(getAcademyQuizProgressState({ ...emptyAcademyProgress, quizAttempts: 1 }), "started");
    assert.equal(
      getAcademyQuizProgressState({ ...emptyAcademyProgress, quizAttempts: 1, completedAt: new Date().toISOString() }),
      "completed",
    );
  });

  test("validates the code-managed course for database authoring", () => {
    assert.deepEqual(validateAcademyCourse(tutorAcademyCourse), { valid: true, errors: [] });
  });

  test("requires a new pass only when the published quiz revision changes", () => {
    const progress = { ...emptyAcademyProgress, completedLessons: tutorAcademyCourse.lessons.map((lesson) => lesson.slug), passedQuizRevision: 1 };
    assert.equal(getAcademyProgressPercent(progress, { ...tutorAcademyCourse, quizRevision: 1 }), 100);
    assert.equal(getAcademyProgressPercent(progress, { ...tutorAcademyCourse, quizRevision: 2 }), 86);
  });

  test("provides original icons and ordered quick access blocks for authoring", () => {
    assert.ok(academyBlockRegistry.every((definition) => definition.icon));
    assert.ok(academyBlockRegistry.every((definition) => definition.shortLabel));
    assert.deepEqual(
      academyBlockRegistry
        .filter((definition) => definition.quickAccessOrder)
        .sort((left, right) => left.quickAccessOrder - right.quickAccessOrder)
        .map((definition) => definition.type),
      [
        "text",
        "numbered-list",
        "image",
        "gallery",
        "video",
        "carousel",
        "process",
        "flashcards",
        "accordion",
        "knowledge-check",
      ],
    );
  });

  test("migrates existing text blocks to the single-column v2 schema", () => {
    const legacy = structuredClone(tutorAcademyCourse);
    const text = legacy.lessons[0].blocks.find((block) => block.type === "text");
    text.schemaVersion = 1;
    delete text.layout;
    const migrated = migrateAcademyCourse(legacy);
    const migratedText = migrated.lessons[0].blocks.find(
      (block) => block.type === "text",
    );
    assert.equal(migratedText.schemaVersion, ACADEMY_BLOCK_SCHEMA_VERSION);
    assert.equal(migratedText.layout, "single");
  });

  test("rejects rich text that skips directly to a subheading", () => {
    const invalid = structuredClone(tutorAcademyCourse);
    const text = invalid.lessons[0].blocks.find((block) => block.type === "text");
    text.content = {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 3 },
          content: [{ type: "text", text: "Skipped heading" }],
        },
      ],
    };
    const result = validateAcademyCourse(invalid);
    assert.equal(result.valid, false);
    assert.ok(
      result.errors.some((error) =>
        error.includes("needs a level 2 heading before a level 3 heading"),
      ),
    );
  });
});
