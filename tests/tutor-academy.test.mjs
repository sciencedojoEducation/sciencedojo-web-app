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
import { academyTemplates, filterAcademyTemplates } from "../lib/academy-templates.ts";
import { academyAccentPalettes, academyJourneyPaletteKeys, academyThemeStyle } from "../lib/academy-theme.ts";
import { academyRecipes, createAcademyRecipe } from "../lib/academy-recipes.ts";
import { getAcademyJourneyLessonState, getAcademyJourneyResumeTarget } from "../lib/academy-journey.ts";

function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map((part) => parseInt(part, 16) / 255);
  const [red, green, blue] = channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(first, second) {
  const values = [luminance(first), luminance(second)].sort((left, right) => right - left);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

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
    assert.deepEqual(validateAcademyCourse(tutorAcademyCourse), {
      valid: true,
      errors: [],
      issues: [],
    });
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
        "survey",
        "knowledge-check",
      ],
    );
  });

  test("creates a publishable interactive survey block", () => {
    const survey = academyBlockRegistry.find(
      (definition) => definition.type === "survey",
    ).create();
    const course = migrateAcademyCourse(structuredClone(tutorAcademyCourse));
    course.lessons[0].blocks.push(survey);
    assert.equal(survey.type, "survey");
    assert.equal(survey.completion, "interact");
    assert.equal(survey.appearance.variant, "scale");
    assert.equal(validateAcademyCourse(course).valid, true);
  });

  test("offers optional Process build-up without changing the default style", () => {
    const definition = academyBlockRegistry.find(
      (item) => item.type === "process",
    );
    const process = definition.create();
    assert.equal(process.appearance.variant, "slides");
    assert.deepEqual(
      definition.variants.map((variant) => variant.key),
      ["slides", "timeline", "build-up"],
    );

    const course = migrateAcademyCourse(structuredClone(tutorAcademyCourse));
    process.appearance.variant = "build-up";
    course.lessons[0].blocks.push(process);
    assert.equal(validateAcademyCourse(course).valid, true);
    const reloaded = migrateAcademyCourse(structuredClone(course));
    assert.equal(reloaded.lessons[0].blocks.at(-1).appearance.variant, "build-up");
  });

  test("migrates older documents to v6 without changing stable IDs", () => {
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
    const migratedImage = migrated.lessons[0].blocks.find(
      (block) => block.type === "image",
    );
    assert.equal(migratedText.schemaVersion, ACADEMY_BLOCK_SCHEMA_VERSION);
    assert.equal(migrated.schemaVersion, ACADEMY_DOCUMENT_SCHEMA_VERSION);
    assert.equal(migrated.lessons[0].id, originalLessonId);
    assert.equal(migratedText.id, originalBlockId);
    assert.equal(migratedText.layout, "single");
    assert.deepEqual(migratedImage.captionItems, []);
    assert.deepEqual(migratedText.appearance, {
      variant: "default",
      surface: "plain",
      spacing: "comfortable",
      width: "reading",
    });
    assert.equal(migrated.theme.typography, "modern-sans");
    assert.equal(migrated.theme.coverStyle, "full-image");
  });

  test("keeps Learning Journey opt-in with three accessible energetic palettes", () => {
    assert.equal(academyThemeStyle(tutorAcademyCourse)["--academy-accent"], academyAccentPalettes.blue.accent);
    assert.deepEqual(academyJourneyPaletteKeys, ["blue-citrus", "coral-navy", "violet-mint"]);
    for (const key of academyJourneyPaletteKeys) {
      const palette = academyAccentPalettes[key];
      assert.ok(contrast(palette.accent, "#FFFFFF") >= 4.5, `${key} primary control contrast`);
      assert.ok(contrast(palette.ink, palette.soft) >= 4.5, `${key} reading contrast`);
      assert.ok(contrast("#17202C", palette.spark) >= 4.5, `${key} milestone contrast`);
    }
    const oldCourse = structuredClone(tutorAcademyCourse);
    oldCourse.schemaVersion = 5;
    oldCourse.theme = undefined;
    const migrated = migrateAcademyCourse(oldCourse);
    assert.equal(migrated.schemaVersion, ACADEMY_DOCUMENT_SCHEMA_VERSION);
    assert.equal(migrated.theme.preset, "editorial");
  });

  test("roadmap resumes the first incomplete step and respects linear navigation", () => {
    const course = structuredClone(tutorAcademyCourse);
    course.rules = { ...course.rules, navigation: "linear", requireFinalAssessment: true };
    const first = course.lessons[0];
    const second = course.lessons[1];
    assert.deepEqual(getAcademyJourneyResumeTarget(course, emptyAcademyProgress), { kind: "lesson", slug: first.slug });
    assert.equal(getAcademyJourneyLessonState(course, emptyAcademyProgress, 1).locked, true);
    const oneComplete = { ...emptyAcademyProgress, completedLessons: [first.slug] };
    assert.deepEqual(getAcademyJourneyResumeTarget(course, oneComplete), { kind: "lesson", slug: second.slug });
    assert.equal(getAcademyJourneyLessonState(course, oneComplete, 1).locked, false);
    const allComplete = { ...emptyAcademyProgress, completedLessons: course.lessons.map((lesson) => lesson.slug) };
    assert.deepEqual(getAcademyJourneyResumeTarget(course, allComplete), { kind: "assessment" });
    assert.equal(getAcademyJourneyResumeTarget(course, { ...allComplete, completedAt: new Date().toISOString() }), null);
    course.rules.requireFinalAssessment = false;
    assert.equal(getAcademyJourneyResumeTarget(course, allComplete), null);
  });

  test("creates unique, optional, publish-blocked learning sequences", () => {
    assert.equal(academyRecipes.length, 2);
    for (const recipe of academyRecipes) {
      const blocks = createAcademyRecipe(recipe.key);
      assert.deepEqual(blocks.map((block) => block.type), recipe.key === "explain-practise-check" ? ["text", "flashcards", "knowledge-check"] : ["text", "process", "knowledge-check"]);
      assert.equal(new Set(blocks.map((block) => block.id)).size, 3);
      assert.equal(blocks[1].completion, "view");
      assert.equal(blocks[2].completion, "view");
      if (blocks[1].type === "process") assert.equal(blocks[1].appearance.variant, "build-up");
      const course = migrateAcademyCourse(structuredClone(tutorAcademyCourse));
      course.lessons[0].blocks.splice(1, 0, ...blocks);
      assert.ok(validateAcademyCourse(course).errors.some((error) => error.includes("author note")));
    }
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
    const issue = result.issues.find((item) => item.scope === "block");
    assert.equal(issue.lessonId, invalid.lessons[0].id);
    assert.equal(issue.blockId, text.id);
  });

  test("locates media and assessment readiness issues", () => {
    const invalid = structuredClone(tutorAcademyCourse);
    const image = invalid.lessons[0].blocks.find(
      (block) => block.type === "image",
    );
    image.alt = "";
    invalid.quiz[0].explanation = "";
    const result = validateAcademyCourse(invalid);
    const mediaIssue = result.issues.find((issue) => issue.scope === "media");
    const assessmentIssue = result.issues.find(
      (issue) => issue.scope === "assessment",
    );
    assert.equal(mediaIssue.lessonId, invalid.lessons[0].id);
    assert.equal(mediaIssue.blockId, image.id);
    assert.equal(mediaIssue.field, "alt");
    assert.equal(assessmentIssue.questionId, invalid.quiz[0].id);
    assert.equal(assessmentIssue.field, "explanation");
  });

  test("keeps structured inserts inside their media caption", () => {
    const course = migrateAcademyCourse(structuredClone(tutorAcademyCourse));
    const image = course.lessons[0].blocks.find(
      (block) => block.type === "image",
    );
    image.captionItems = [
      {
        id: "caption-list",
        type: "ordered-list",
        items: ["First detail", "Second detail"],
      },
      {
        id: "caption-table",
        type: "table",
        columns: ["Term", "Meaning"],
        rows: [["Velocity", "Speed in a direction"]],
      },
      {
        id: "caption-equation",
        type: "equation",
        latex: "v = d/t",
        shortDescription: "Velocity equals distance divided by time",
        longDescription: "The equation defines average velocity.",
      },
    ];
    assert.equal(course.lessons[0].blocks.length, 4);
    assert.equal(validateAcademyCourse(course).valid, true);

    image.captionItems[2].shortDescription = "";
    assert.ok(
      validateAcademyCourse(course).errors.some((error) =>
        error.includes("incomplete structured caption content"),
      ),
    );
  });

  test("validates a long lesson containing 100 blocks", () => {
    const longCourse = structuredClone(tutorAcademyCourse);
    const source = longCourse.lessons[0].blocks.find(
      (block) => block.type === "text",
    );
    longCourse.lessons[0].blocks = Array.from({ length: 100 }, (_, index) => ({
      ...structuredClone(source),
      id: `long-block-${index + 1}`,
    }));
    const startedAt = performance.now();
    const result = validateAcademyCourse(longCourse);
    assert.equal(result.valid, true);
    assert.ok(performance.now() - startedAt < 500);
  });

  test("provides thirteen distinct stakeholder and subject starters", () => {
    assert.equal(academyTemplates.length, 13);
    assert.equal(new Set(academyTemplates.map((item) => item.key)).size, 13);
    assert.equal(
      academyTemplates.filter((item) => item.category === "UK subject learning").length,
      3,
    );
    for (const item of academyTemplates) {
      assert.ok(item.image.startsWith("/images/"));
      assert.ok(item.learningPattern.length > 10);
      assert.ok(item.course.lessons.length > 0);
      assert.deepEqual(item.course.audienceRoles, item.audienceRoles);
      assert.equal(new Set(item.course.lessons.map((lesson) => lesson.slug)).size, item.course.lessons.length);
      assert.ok(item.course.lessons.every((lesson) => lesson.blocks.length > 0));
      assert.ok(
        validateAcademyCourse(item.course).errors.every((error) => error.includes("author note")),
        `${item.key} has an unexpected publishing issue`,
      );
    }
  });

  test("filters starters by stakeholder, purpose, and search", () => {
    assert.deepEqual(
      filterAcademyTemplates({ audience: "parent", category: "Platform training" }).map((item) => item.key),
      ["parent-getting-started", "parent-progress-guide"],
    );
    assert.deepEqual(
      filterAcademyTemplates({ search: "KS3 English" }).map((item) => item.key),
      ["ks3-english-close-reading"],
    );
    assert.equal(filterAcademyTemplates({ category: "Platform updates" }).length, 1);
  });

  test("requires author notes to be resolved before publishing a starter", () => {
    const starter = academyTemplates.find((item) => item.key === "tutor-decision-practice");
    const result = validateAcademyCourse(starter.course);
    assert.equal(result.valid, false);
    const issue = result.issues.find((item) => item.message.includes("author note"));
    assert.equal(issue.scope, "block");
    assert.equal(issue.lessonId, starter.course.lessons[0].id);
    assert.ok(issue.blockId);
    const revised = structuredClone(starter.course);
    revised.lessons[0].blocks = revised.lessons[0].blocks.filter(
      (block) => !JSON.stringify(block).includes("[[AUTHOR:"),
    );
    assert.equal(validateAcademyCourse(revised).valid, true);
  });

  test("locates author notes in course copy and final questions", () => {
    const starter = structuredClone(academyTemplates.find((item) => item.key === "ks3-maths-concept").course);
    starter.description = "[[AUTHOR: Check this summary.]]";
    starter.quiz = [{
      id: "author-review-question",
      type: "single-choice",
      prompt: "[[AUTHOR: Write the question.]]",
      options: [{ id: "a", label: "Yes" }, { id: "b", label: "No" }],
      correctOptionId: "a",
      explanation: "Explain the answer using the learning objective.",
    }];
    starter.rules.requireFinalAssessment = true;
    const issues = validateAcademyCourse(starter).issues;
    assert.ok(issues.some((issue) => issue.scope === "course" && issue.field === "description"));
    assert.ok(issues.some((issue) => issue.scope === "assessment" && issue.questionId === "author-review-question"));
  });

  test("keeps subject examples tied to England KS3 and correct practice feedback", () => {
    const subjectTemplates = academyTemplates.filter((item) => item.category === "UK subject learning");
    assert.deepEqual(
      subjectTemplates.map((item) => item.curriculumLabel),
      ["England KS3 · Mathematics", "England KS3 · English", "England KS3 · Science"],
    );
    for (const item of subjectTemplates) {
      assert.equal(validateAcademyCourse(item.course).valid, true);
      const checks = item.course.lessons.flatMap((lesson) =>
        lesson.blocks.filter((block) => block.type === "knowledge-check"),
      );
      assert.ok(checks.length > 0);
      assert.ok(checks.every((block) =>
        block.question.options.some((option) => option.id === block.question.correctOptionId)
        && block.question.explanation.length > 20,
      ));
    }
  });
});
