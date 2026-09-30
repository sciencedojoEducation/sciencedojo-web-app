import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { validateAcademyCourse } from "../lib/academy-course-validation.ts";
import { migrateAcademyCourse } from "../lib/academy-schema.ts";
import { germanA2Course } from "../lib/german-a2-course.ts";
import { germanA2Chapters } from "../lib/german-a2-curriculum.ts";
import { a2ExamSets, a2ExamRecordings } from "../lib/german-a2-exam-practice.ts";
import { a2MasteryMissions } from "../lib/german-a2-mastery.ts";
import { emptyAcademyProgress, getAcademyRequiredLessons, getAcademyResumeHref } from "../lib/tutor-academy.ts";

const core = germanA2Course.lessons.filter((lesson) => !lesson.examTrack);
const track = (id) => germanA2Course.lessons.filter((lesson) => lesson.examTrack === id);

test("A2 validates, has 15 chapters plus mastery and two ten-lesson branches, with stable identities", () => {
  assert.deepEqual(validateAcademyCourse(germanA2Course).errors, []);
  assert.equal(core.length, 16);
  assert.equal(track("goethe").length, 10);
  assert.equal(track("telc").length, 10);
  const blocks = germanA2Course.lessons.flatMap((lesson) => lesson.blocks);
  assert.equal(new Set(blocks.map((block) => block.id)).size, blocks.length);
  assert.equal(new Set(germanA2Course.lessons.map((lesson) => lesson.slug)).size, 36);
  assert.ok(blocks.every((block) => block.curriculum.cefr === "A2" && block.curriculum.topic && block.curriculum.functions.length && block.curriculum.skills.length));
  assert.deepEqual(migrateAcademyCourse(germanA2Course), germanA2Course);
  for (const id of ["goethe", "telc"]) assert.ok(track(id).every((lesson) => lesson.blocks.every((block) => block.curriculum.examTrack === id)));
});

test("core follows all fourteen phases and provides original four-skill learning and four speaking modes", () => {
  for (const [i, lesson] of core.entries()) {
    const chapter = germanA2Chapters[i];
    assert.ok(chapter.reading.split(/\s+/).length >= 70, chapter.title);
    assert.ok(chapter.listening.split(/\s+/).length >= 50, chapter.title);
    assert.equal(chapter.vocabulary.length, 8);
    for (const n of Array.from({ length: 14 }, (_, i) => i + 1)) assert.ok(lesson.blocks.some((block) => block.heading?.startsWith(`${n} ·`)), `${chapter.title}: phase ${n}`);
    const skills = new Set(lesson.blocks.flatMap((block) => block.curriculum.skills));
    for (const skill of ["reading", "listening", "writing", "speaking", "interaction", "grammar", "vocabulary", "mediation"]) assert.ok(skills.has(skill));
    assert.equal(lesson.blocks.filter((block) => block.id.includes(`${lesson.slug}-speak-`)).length, 4);
    assert.ok(lesson.blocks.some((block) => block.id.endsWith("phrasebook") && block.completion === "interact"));
    const mastery = lesson.blocks.find((block) => block.id.endsWith("mastery-check"));
    assert.equal(mastery.completion, "pass");
    assert.notEqual(mastery.question.prompt, chapter.grammarCheck.prompt);
  }
  const diagnosis = core[0].blocks.filter((block) => block.id.includes("diagnostic-") && block.type === "knowledge-check");
  assert.equal(diagnosis.length, 7);
  assert.ok(diagnosis.every((block) => block.completion === "view"));
});

test("writing models meet word bounds and all production tasks require saved interaction", () => {
  for (const lesson of germanA2Course.lessons) for (const block of lesson.blocks) {
    if (block.type === "writing-practice") {
      const words = block.modelAnswer.trim().split(/\s+/).length;
      assert.ok(words >= block.minWords && words <= block.maxWords, `${block.id}: ${words} words`);
      assert.equal(block.completion, "interact");
      assert.ok(block.checklist.length >= 2);
    }
    if (block.type === "speaking-practice") assert.equal(block.completion, "interact");
  }
});

test("Goethe and telc train distinct documented formats, writing lengths and speaking preparation", () => {
  const g = track("goethe"), t = track("telc");
  assert.equal(g[1].blocks.filter((block) => block.type === "knowledge-check").length, 8);
  assert.equal(t[1].blocks.filter((block) => block.type === "knowledge-check").length, 5);
  assert.equal(g[2].blocks.filter((block) => block.type === "audio").length, 4);
  assert.equal(t[2].blocks.filter((block) => block.type === "audio").length, 3);
  assert.ok(t[2].blocks.some((block) => block.id.endsWith("notes") && block.type === "writing-practice"));
  assert.deepEqual(g[3].blocks.filter((block) => block.type === "writing-practice").map((block) => [block.minWords, block.maxWords]), [[20, 30], [30, 40]]);
  assert.ok(t[3].blocks.some((block) => block.heading === "Teil 1 · Formular"));
  assert.ok(t[3].blocks.some((block) => block.heading === "Teil 2 · persönliche Nachricht"));
  assert.ok(t[4].blocks.filter((block) => block.type === "speaking-practice").every((block) => block.preparationSeconds === 0));
  assert.equal(t[4].blocks.filter((block) => block.type === "speaking-practice").length, 3);
  assert.match(t[0].blocks.find((block) => block.type === "comparison-table").rows[1][1], /50/);
  for (const lessons of [g, t]) {
    assert.ok(lessons[9].blocks.some((block) => block.type === "resources"));
    for (const i of [6, 8]) {
      assert.match(lessons[i].blocks.find((block) => block.id.endsWith("scope")).body, /weniger Aufgaben/);
      for (const type of ["audio", "knowledge-check", "writing-practice", "speaking-practice"]) assert.ok(lessons[i].blocks.some((block) => block.type === type));
    }
  }
});

test("mini-mocks use fresh original inputs and mastery includes all four integrated missions", () => {
  assert.equal(a2MasteryMissions.length, 4);
  for (const mission of a2MasteryMissions) for (const suffix of ["read", "audio", "check", "write", "speak"]) assert.ok(core[15].blocks.some((block) => block.id === `${mission.id}-${suffix}`));
  const texts = a2ExamSets.flatMap((set) => set.reading.map((task) => task.text));
  assert.equal(new Set(texts).size, 12);
  const transcripts = a2ExamRecordings.map((recording) => recording.segments.map((part) => part.text).join(" "));
  assert.equal(new Set(transcripts).size, 12);
  assert.ok(a2ExamRecordings.filter((recording) => recording.segments.length > 1).every((recording) => new Set(recording.segments.map((part) => part.speaker)).size === 2));
});

test("all 32 German recordings exist and every listening check has accessible source audio", () => {
  const blocks = germanA2Course.lessons.flatMap((lesson) => lesson.blocks).filter((block) => block.type === "audio");
  assert.ok(blocks.every((block) => block.transcript.length > 100));
  const urls = new Set([...blocks.map((block) => block.url), ...germanA2Course.quiz.flatMap((item) => item.audioUrl ? [item.audioUrl] : [])]);
  assert.equal(urls.size, 32);
  for (const url of urls) {
    const file = resolve(import.meta.dirname, "../public", url.slice(1));
    assert.ok(existsSync(file), `missing ${url}`);
    assert.ok(statSync(file).size > 10_000, `empty ${url}`);
    assert.ok(readFileSync(file).subarray(0, 8192).includes(Buffer.from("mp4a")), `non-AAC ${url}`);
  }
});

test("answer keys are valid and varied and final questions embed evidence", () => {
  const questions = [...germanA2Course.quiz, ...germanA2Course.lessons.flatMap((lesson) => lesson.blocks.filter((block) => block.type === "knowledge-check").map((block) => block.question))];
  for (const item of questions) {
    assert.ok(item.options.some((option) => option.id === item.correctOptionId));
    assert.equal(new Set(item.options.map((option) => option.label)).size, item.options.length);
    assert.ok(item.explanation.length > 15);
  }
  assert.equal(germanA2Course.quiz.length, 18);
  assert.deepEqual(new Set(germanA2Course.quiz.map((item) => item.correctOptionId)), new Set(["a", "b", "c"]));
  assert.ok(germanA2Course.quiz.filter((item) => item.id.includes("read")).every((item) => item.prompt.length > 300));
  assert.ok(germanA2Course.quiz.filter((item) => item.id.includes("listen")).every((item) => item.audioUrl && item.audioTranscript));
});

test("shared mastery and final assessment gate exam choice and require only the chosen branch", () => {
  const progress = { ...emptyAcademyProgress, completedLessons: core.map((lesson) => lesson.slug) };
  assert.equal(getAcademyRequiredLessons(germanA2Course, progress).length, 16);
  assert.match(getAcademyResumeHref(progress, germanA2Course, "/a2"), /\/quiz$/);
  progress.passedQuizRevision = germanA2Course.quizRevision;
  assert.match(getAcademyResumeHref(progress, germanA2Course, "/a2"), /\/choose-exam$/);
  for (const id of ["goethe", "telc"]) {
    const selected = { ...progress, selectedExamTrack: id };
    const required = getAcademyRequiredLessons(germanA2Course, selected);
    assert.equal(required.length, 26);
    assert.ok(required.every((lesson) => !lesson.examTrack || lesson.examTrack === id));
    assert.match(getAcademyResumeHref(selected, germanA2Course, "/a2"), new RegExp(`de-a2-${id}-01`));
  }
});
