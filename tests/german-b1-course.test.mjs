import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { validateAcademyCourse } from "../lib/academy-course-validation.ts";
import { germanB1Course } from "../lib/german-b1-course.ts";
import { germanB1Chapters } from "../lib/german-b1-curriculum.ts";
import { b1ExamListening } from "../lib/german-b1-exam-practice.ts";
import { b1ChapterMastery } from "../lib/german-b1-mastery.ts";
import { emptyAcademyProgress, getAcademyRequiredLessons, getAcademyResumeHref } from "../lib/tutor-academy.ts";

test("B1 document validates, keeps stable identities, and has all requested chapters and tracks", () => {
  assert.deepEqual(validateAcademyCourse(germanB1Course).errors, []);
  assert.equal(germanB1Course.key, "german-b1-complete");
  assert.equal(germanB1Chapters.length, 16);
  assert.equal(germanB1Course.lessons.length, 35);
  assert.equal(germanB1Course.lessons.filter((lesson) => !lesson.examTrack).length, 16);
  assert.equal(germanB1Course.lessons.filter((lesson) => lesson.examTrack === "goethe").length, 9);
  assert.equal(germanB1Course.lessons.filter((lesson) => lesson.examTrack === "telc").length, 10);
  const blocks = germanB1Course.lessons.flatMap((lesson) => lesson.blocks);
  assert.equal(new Set(blocks.map((block) => block.id)).size, blocks.length);
  assert.equal(new Set(germanB1Course.lessons.map((lesson) => lesson.slug)).size, 35);
  assert.ok(blocks.every((block) => block.curriculum?.cefr === "B1" && block.curriculum.topic && block.curriculum.skills.length));
  assert.ok(germanB1Course.lessons.filter((lesson) => lesson.examTrack).every((lesson) => lesson.blocks.every((block) => block.curriculum.examTrack === lesson.examTrack)));
});

test("each core chapter teaches all skills with original texts, feedback and transfer assessment", () => {
  const core = germanB1Course.lessons.filter((lesson) => !lesson.examTrack);
  for (const [index, chapter] of germanB1Chapters.entries()) {
    const lesson = core[index];
    assert.ok(chapter.reading.split(/\s+/).length >= 110);
    assert.ok(chapter.listening.split(/\s+/).length >= 90);
    assert.equal(chapter.vocabulary.length, 6);
    const skills = new Set(lesson.blocks.flatMap((block) => block.curriculum.skills));
    for (const skill of ["reading", "listening", "grammar", "vocabulary", "writing", "speaking", "interaction", "mediation"]) assert.ok(skills.has(skill), `${chapter.title}: ${skill}`);
    for (const type of ["audio", "flashcards", "writing-practice", "speaking-practice", "worked-example", "knowledge-check"]) assert.ok(lesson.blocks.some((block) => block.type === type));
    assert.equal(lesson.blocks.filter((block) => block.type === "speaking-practice").length, 2);
    for (const block of lesson.blocks.filter((block) => block.type === "writing-practice")) {
      const words = block.modelAnswer.split(/\s+/).length;
      assert.ok(words >= block.minWords && words <= block.maxWords, `${chapter.title}: model ${words} words`);
      assert.equal(block.completion, "interact");
    }
    const mastery = lesson.blocks.find((block) => block.id.endsWith("mastery-check"));
    assert.equal(mastery.completion, "pass");
    assert.notEqual(mastery.question.prompt, chapter.grammarCheck.prompt);
    assert.equal(mastery.question.prompt, b1ChapterMastery[index].prompt);
    assert.ok(lesson.blocks.some((block) => block.id.endsWith("recall")));
  }
  assert.equal(core[0].blocks.filter((block) => block.id.startsWith("b1-diagnostic-") && block.type === "knowledge-check").length, 7);
  assert.ok(core[0].blocks.filter((block) => block.id.startsWith("b1-diagnostic-") && block.type === "knowledge-check").every((block) => block.completion !== "pass"));
});

test("Goethe and telc production tasks differ and mocks disclose their shortened scope", () => {
  const goethe = germanB1Course.lessons.filter((lesson) => lesson.examTrack === "goethe");
  const telc = germanB1Course.lessons.filter((lesson) => lesson.examTrack === "telc");
  const gw = goethe[3].blocks.filter((block) => block.type === "writing-practice");
  assert.equal(gw.length, 3);
  assert.deepEqual(gw.map((block) => block.heading), ["Persönliche E-Mail", "Meinungsbeitrag", "Kurze formelle Nachricht"]);
  assert.equal(telc[4].blocks.filter((block) => block.type === "writing-practice").length, 1);
  assert.equal(goethe[4].blocks.filter((block) => block.type === "speaking-practice").length, 3);
  assert.equal(telc[5].blocks.filter((block) => block.type === "speaking-practice").length, 3);
  assert.ok(telc[2].blocks.filter((block) => block.type === "knowledge-check").length >= 6);
  assert.match(goethe[0].blocks.find((block) => block.type === "comparison-table").rows[2][1], /60/);
  assert.match(telc[0].blocks.find((block) => block.type === "comparison-table").rows[0][1], /90.*ohne Pause/);
  for (const lesson of [goethe[6], telc[7]]) {
    assert.match(lesson.blocks.find((block) => block.id.endsWith("mock-scope")).body, /verkürzte/);
    for (const type of ["audio", "writing-practice", "speaking-practice", "knowledge-check"]) assert.ok(lesson.blocks.some((block) => block.type === type));
  }
  for (const lesson of [goethe.at(-1), telc.at(-1)]) {
    assert.ok(lesson.blocks.some((block) => block.type === "resources"));
    assert.equal(lesson.blocks.find((block) => block.type === "process").items.length, 5);
  }
});

test("all B1 audio exists, has transcripts and uses German multi-speaker exam recordings", () => {
  const blocks = germanB1Course.lessons.flatMap((lesson) => lesson.blocks).filter((block) => block.type === "audio");
  assert.ok(blocks.every((block) => block.transcript?.length > 150));
  const urls = new Set([...blocks.map((block) => block.url), ...germanB1Course.quiz.flatMap((question) => question.audioUrl ? [question.audioUrl] : [])]);
  assert.equal(urls.size, 24);
  for (const url of urls) {
    const path = resolve(import.meta.dirname, "../public", url.slice(1));
    assert.ok(existsSync(path), `${url} missing`);
    assert.ok(statSync(path).size > 10_000, `${url} empty`);
  }
  assert.ok(b1ExamListening.slice(2).every((recording) => new Set(recording.segments.map((segment) => segment.speaker)).size === 2));
  assert.ok(b1ExamListening.every((recording) => recording.segments.every((segment) => segment.speaker === "Anna" || segment.speaker === "Eddy (German (Germany))")));
});

test("final assessment contains its evidence and has valid, varied answers", () => {
  assert.equal(germanB1Course.quiz.length, 18);
  const positions = new Set(germanB1Course.quiz.map((question) => question.correctOptionId));
  assert.deepEqual(positions, new Set(["a", "b", "c"]));
  const questions = [...germanB1Course.quiz, ...germanB1Course.lessons.flatMap((lesson) => lesson.blocks.filter((block) => block.type === "knowledge-check").map((block) => block.question))];
  for (const question of questions) {
    assert.ok(question.options.some((option) => option.id === question.correctOptionId));
    assert.equal(new Set(question.options.map((option) => option.label)).size, question.options.length);
    assert.ok(question.explanation);
  }
  assert.ok(germanB1Course.quiz.filter((question) => question.id.includes("read")).every((question) => question.prompt.length > 500));
  assert.ok(germanB1Course.quiz.filter((question) => question.id.includes("listen")).every((question) => question.audioUrl && question.audioTranscript));
});

test("existing academy progression gates exam choice behind shared mastery and selects only one branch", () => {
  const core = germanB1Course.lessons.filter((lesson) => !lesson.examTrack);
  const progress = { ...emptyAcademyProgress, completedLessons: core.map((lesson) => lesson.slug) };
  assert.match(getAcademyResumeHref(progress, germanB1Course, "/b1"), /\/quiz$/);
  progress.passedQuizRevision = germanB1Course.quizRevision;
  assert.match(getAcademyResumeHref(progress, germanB1Course, "/b1"), /\/choose-exam$/);
  for (const track of ["goethe", "telc"]) {
    const selected = { ...progress, selectedExamTrack: track };
    const required = getAcademyRequiredLessons(germanB1Course, selected);
    assert.equal(required.length, track === "goethe" ? 25 : 26);
    assert.ok(required.every((lesson) => !lesson.examTrack || lesson.examTrack === track));
    assert.match(getAcademyResumeHref(selected, germanB1Course, "/b1"), new RegExp(`de-b1-${track}-01`));
  }
});
