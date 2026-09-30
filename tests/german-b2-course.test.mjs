import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { validateAcademyCourse } from "../lib/academy-course-validation.ts";
import { germanB2Course } from "../lib/german-b2-course.ts";
import { germanB2Chapters } from "../lib/german-b2-curriculum.ts";
import { germanB2Lexicon } from "../lib/german-b2-lexicon.ts";
import { germanB2AdvancedListening } from "../lib/german-b2-advanced-listening.ts";
import { germanB2ExamGlimpses } from "../lib/german-b2-exam-glimpses.ts";

test("B2 course has complete shared and distinct Goethe/telc routes", () => {
  const result = validateAcademyCourse(germanB2Course);
  assert.deepEqual(result.errors, []);
  assert.equal(germanB2Chapters.length, 18);
  assert.equal(germanB2Lexicon.length, 18);
  assert.equal(germanB2AdvancedListening.length, 6);
  assert.equal(germanB2ExamGlimpses.length, 18);
  assert.deepEqual(new Set(germanB2ExamGlimpses.map((item) => item.track)), new Set(["goethe", "telc"]));
  assert.ok(germanB2AdvancedListening.every((item) => item.segments.length >= 4 && item.segments.reduce((sum, segment) => sum + segment.text.split(/\s+/).length, 0) >= 175));
  assert.ok(germanB2Lexicon.every((set) => set.terms.length >= 5 && set.functionPhrase && set.discussionPhrase && set.wordFamily.length === 3 && set.register.length === 3));
  const core = germanB2Course.lessons.filter((lesson) => !lesson.examTrack);
  const goethe = germanB2Course.lessons.filter((lesson) => lesson.examTrack === "goethe");
  const telc = germanB2Course.lessons.filter((lesson) => lesson.examTrack === "telc");
  assert.equal(core.length, 18);
  assert.equal(goethe.length, 10);
  assert.equal(telc.length, 12);
  assert.ok(goethe.some((lesson) => lesson.title.includes("Forumbeitrag")));
  assert.ok(telc.some((lesson) => lesson.title.includes("Sprachbausteine")));
  assert.ok(telc.some((lesson) => lesson.title.includes("gemeinsam planen")));
  assert.ok(core.every((lesson) => ["audio", "writing-practice", "speaking-practice", "knowledge-check", "process"].every((type) =>
    lesson.blocks.some((block) => block.type === type))));
  assert.ok(germanB2Course.lessons.every((lesson) => lesson.blocks.filter((block) =>
    block.type === "writing-practice" || block.type === "speaking-practice").every((block) => block.completion === "interact")));
  assert.ok(core.every((lesson) => lesson.blocks.some((block) => block.heading === "Themenwortschatz im Zusammenhang" && block.items.length >= 5)));
  assert.ok(core.every((lesson) => lesson.blocks.some((block) => block.heading?.startsWith("Prüfungsblick ·") && block.type === "knowledge-check" && block.completion === "pass")));
  assert.ok(germanB2Course.lessons.every((lesson) => lesson.blocks.every((block) =>
    block.curriculum?.cefr === "B2" && block.curriculum.topic && block.curriculum.skills.length)));
  assert.ok(germanB2Chapters.every((chapter) => chapter.reading.trim().split(/\s+/).length >= 150));
  assert.ok(germanB2Chapters.every((chapter) => chapter.listening.trim().split(/\s+/).length >= 80));
  const technology = core[9];
  assert.equal(technology.blocks.find((block) => block.id === "de-b2-10-people")?.items.length, 4);
  assert.ok(technology.blocks.filter((block) => block.type === "knowledge-check" && block.heading?.startsWith("Lesen")).length >= 3);
  assert.ok(telc[3].blocks.some((block) => block.heading?.includes("Sprachbausteine · Grammatik")));
  assert.ok(telc[4].blocks.some((block) => block.heading?.includes("Sprachbausteine · Kollokation")));
});

test("B2 final assessment contains the evidence needed to answer each question", () => {
  assert.equal(germanB2Course.quiz.length, 18);
  for (const question of germanB2Course.quiz) {
    assert.ok(question.options.some((option) => option.id === question.correctOptionId));
    if (question.id.includes("final-read")) assert.ok(question.prompt.length > 300);
    if (question.id.includes("final-listen")) {
      assert.ok(question.audioTranscript?.length > 100);
      assert.ok(question.audioUrl);
    }
  }
});

test("every referenced B2 listening recording is present and nonempty", () => {
  const urls = new Set([
    ...germanB2Course.lessons.flatMap((lesson) => lesson.blocks.filter((block) => block.type === "audio").map((block) => block.url)),
    ...germanB2Course.quiz.flatMap((question) => question.audioUrl ? [question.audioUrl] : []),
  ]);
  assert.equal(urls.size, 24);
  for (const url of urls) {
    const path = resolve(import.meta.dirname, "../public", url.slice(1));
    assert.ok(existsSync(path), `${url} is missing`);
    assert.ok(statSync(path).size > 10_000, `${url} is empty`);
  }
});
