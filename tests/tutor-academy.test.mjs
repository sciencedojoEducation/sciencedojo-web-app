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
import {
  groupAcademyValidationErrors,
  validateAcademyCourse,
} from "../lib/academy-course-validation.ts";
import {
  ACADEMY_BLOCK_SCHEMA_VERSION,
  ACADEMY_DOCUMENT_SCHEMA_VERSION,
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

  test("migrates v2 documents to v3 without changing stable IDs", () => {
    const legacy = structuredClone(tutorAcademyCourse);
    const originalLessonId = "stable-lesson";
    const originalBlockId = "stable-block";
    legacy.schemaVersion = 2;
    legacy.lessons[0].id = originalLessonId;
    const text = legacy.lessons[0].blocks.find((block) => block.type === "text");
    text.id = originalBlockId;
    text.schemaVersion = 1;
    delete text.layout;
    delete text.appearance;
    legacy.theme = {
      preset: "editorial",
      accent: "blue",
      typography: "sans",
      density: "comfortable",
    };
    const migrated = migrateAcademyCourse(legacy);
    const migratedText = migrated.lessons[0].blocks.find(
      (block) => block.type === "text",
    );
    assert.equal(migratedText.schemaVersion, ACADEMY_BLOCK_SCHEMA_VERSION);
    assert.equal(migrated.schemaVersion, ACADEMY_DOCUMENT_SCHEMA_VERSION);
    assert.equal(migrated.lessons[0].id, originalLessonId);
    assert.equal(migratedText.id, originalBlockId);
    assert.equal(migratedText.layout, "single");
    assert.deepEqual(migratedText.appearance, {
      variant: "default",
      surface: "plain",
      spacing: "comfortable",
    });
    assert.equal(migrated.theme.typography, "modern-sans");
    assert.equal(migrated.theme.coverStyle, "full-image");
  });

  test("groups publishing issues into actionable readiness sections", () => {
    const groups = groupAcademyValidationErrors([
      "Course title must contain at least 3 characters.",
      "Lesson 1 needs a valid duration.",
      "Welcome, block 1 needs a transcript before publishing.",
      "Quiz question 1 must identify a valid correct answer.",
    ]);
    assert.equal(groups.course.length, 1);
    assert.equal(groups.lessons.length, 1);
    assert.equal(groups.media.length, 1);
    assert.equal(groups.assessment.length, 1);
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
