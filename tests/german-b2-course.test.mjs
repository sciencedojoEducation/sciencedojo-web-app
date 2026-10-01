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
import { germanB2GrammarPractice } from "../lib/german-b2-grammar-practice.ts";
import { germanB2WorkbookUnits } from "../lib/german-b2-workbook.ts";
import { germanB2ChartTasks } from "../lib/german-b2-chart-tasks.ts";

test("B2 course has complete shared and distinct Goethe/telc routes", () => {
  const result = validateAcademyCourse(germanB2Course);
  assert.deepEqual(result.errors, []);
  assert.equal(germanB2Chapters.length, 18);
  assert.equal(germanB2Lexicon.length, 18);
  assert.equal(germanB2AdvancedListening.length, 6);
  assert.equal(germanB2ExamGlimpses.length, 18);
  assert.equal(germanB2GrammarPractice.length, 18);
  assert.deepEqual(new Set(germanB2ExamGlimpses.map((item) => item.track)), new Set(["goethe", "telc"]));
  assert.ok(germanB2AdvancedListening.every((item) => item.segments.length >= 4 && item.segments.reduce((sum, segment) => sum + segment.text.split(/\s+/).length, 0) >= 175));
  assert.ok(germanB2Lexicon.every((set) => set.terms.length >= 5 && set.functionPhrase && set.discussionPhrase && set.wordFamily.length === 3 && set.register.length === 3));
  const core = germanB2Course.lessons.filter((lesson) => !lesson.examTrack);
  const goethe = germanB2Course.lessons.filter((lesson) => lesson.examTrack === "goethe");
  const telc = germanB2Course.lessons.filter((lesson) => lesson.examTrack === "telc");
  assert.equal(core.length, 18);
  assert.equal(goethe.length, 10);
  assert.equal(telc.length, 12);
  assert.match(goethe[3].title, /Forumbeitrag/);
  assert.match(goethe[7].title, /Zeittraining/);
  assert.match(goethe[8].title, /Modelltest/);
  assert.match(telc[2].title, /Sprachbausteine: Grammatik/);
  assert.match(telc[3].title, /Sprachbausteine: Lexik/);
  assert.match(telc[8].title, /gemeinsam planen/);
  assert.match(telc[9].title, /Zeittraining/);
  assert.match(telc[10].title, /Übungstest/);
  assert.ok([goethe[7], telc[9]].every((lesson) => lesson.blocks.some((block) => block.heading === "Zeittraining · Schreiben") && lesson.blocks.some((block) => block.heading === "Zeittraining · Sprechen")));
  assert.ok([goethe[8], telc[10]].every((lesson) => lesson.blocks.some((block) => block.heading === "Den offiziellen Übungstest durchführen" && block.items.length === 5)));
  assert.ok(core.every((lesson) => ["audio", "writing-practice", "speaking-practice", "knowledge-check", "process"].every((type) =>
    lesson.blocks.some((block) => block.type === type))));
  assert.ok(germanB2Course.lessons.every((lesson) => lesson.blocks.filter((block) =>
    block.type === "writing-practice" || block.type === "speaking-practice").every((block) => block.completion === "interact")));
  assert.ok(core.every((lesson) => lesson.blocks.some((block) => block.heading === "Themenwortschatz im Zusammenhang" && block.items.length >= 5)));
  assert.ok(core.every((lesson) => lesson.blocks.some((block) => block.id.endsWith("grammar-check") && block.completion === "pass" && block.curriculum.skills.includes("grammar"))));
  assert.equal(core.filter((lesson) => lesson.blocks.some((block) => block.id.endsWith("writing-scaffold"))).length, 13);
  assert.ok(core.every((lesson) => lesson.blocks.some((block) => block.id.endsWith("writing-steps") && block.items.length === 3)));
  assert.deepEqual(core.slice(0, 13).map((lesson) => lesson.blocks.find((block) => block.id.endsWith("writing-scaffold"))?.minWords),
    [30, 30, 30, 30, 55, 55, 55, 75, 75, 75, 95, 95, 95]);
  assert.ok(core[17].blocks.some((block) => block.id.endsWith("writing") && block.prompt.includes("35 Minuten") && block.minWords === 180));
  assert.ok(core.every((lesson) => lesson.blocks.some((block) => block.heading?.startsWith("Prüfungsblick ·") && block.type === "knowledge-check" && block.completion === "pass")));
  assert.ok(germanB2Course.lessons.every((lesson) => lesson.blocks.every((block) =>
    block.curriculum?.cefr === "B2" && block.curriculum.topic && block.curriculum.skills.length)));
  assert.ok(germanB2Chapters.every((chapter) => chapter.reading.trim().split(/\s+/).length >= 150));
  assert.ok(germanB2Chapters.every((chapter) => chapter.listening.trim().split(/\s+/).length >= 80));
  const technology = core[9];
  assert.equal(technology.blocks.find((block) => block.id === "de-b2-10-people")?.items.length, 4);
  assert.ok(technology.blocks.filter((block) => block.type === "knowledge-check" && block.heading?.startsWith("Lesen")).length >= 3);
  assert.ok(telc[2].blocks.some((block) => block.heading?.includes("Sprachbausteine · Grammatik")));
  assert.ok(telc[3].blocks.some((block) => block.heading?.includes("Sprachbausteine · Kollokation")));
});

test("B2 final assessment contains the evidence needed to answer each question", () => {
  assert.equal(germanB2Course.quiz.length, 18);
  const correctPositions = germanB2Course.quiz.map((question) => question.correctOptionId);
  assert.deepEqual(new Set(correctPositions), new Set(["a", "b", "c"]));
  assert.ok(Math.max(...["a", "b", "c"].map((id) => correctPositions.filter((position) => position === id).length)) <= 9);
  for (const question of germanB2Course.quiz) {
    assert.ok(question.options.some((option) => option.id === question.correctOptionId));
    assert.equal(new Set(question.options.map((option) => option.label)).size, question.options.length);
    if (question.id.includes("final-read")) assert.ok(question.prompt.length > 300);
    if (question.id.includes("final-listen")) {
      assert.ok(question.audioTranscript?.length > 100);
      assert.ok(question.audioUrl);
    }
  }
});

test("all shared chapters provide original genre, listening, pronunciation, and self-check practice", () => {
  const core = germanB2Course.lessons.filter((lesson) => !lesson.examTrack);
  assert.equal(germanB2WorkbookUnits.length, 18);
  assert.equal(new Set(germanB2WorkbookUnits.map((unit) => unit.genre)).size, 18);
  for (const [index, unit] of germanB2WorkbookUnits.entries()) {
    assert.ok(unit.text.trim().split(/\s+/).length >= 70, `Chapter ${index + 1}: short genre text`);
    assert.ok(unit.answer !== unit.distractors[0] && unit.answer !== unit.distractors[1]);
    const blocks = core[index].blocks;
    const genre = blocks.find((block) => block.id.endsWith("genre-reading"));
    const solution = blocks.find((block) => block.id.endsWith("genre-solution"));
    const notes = blocks.find((block) => block.id.endsWith("listening-notes"));
    const model = blocks.find((block) => block.id.endsWith("pronunciation-audio"));
    const practice = blocks.find((block) => block.id.endsWith("pronunciation"));
    const selfCheck = blocks.find((block) => block.id.endsWith("can-do"));
    assert.ok(genre?.paragraphs.includes(unit.text));
    assert.ok(solution?.items[0].body.includes(unit.explanation));
    assert.ok(notes?.prompt.includes(unit.listeningTask));
    assert.equal(model?.transcript, unit.pronunciationLine);
    assert.ok(practice?.prompt.includes(unit.pronunciationLine));
    assert.ok(selfCheck?.prompt.includes(unit.canDo));
    assert.ok(selfCheck?.prompt.includes(unit.nextStep));
    assert.ok(!blocks.some((block) => block.id.endsWith("genre-check")), "Supplementary inference check should not reset assessment progress");
  }
});

test("fictional charts have accurate accessible descriptions and practice tasks", () => {
  assert.deepEqual(germanB2ChartTasks.map((chart) => chart.chapterIndex), [2, 7, 11]);
  for (const chart of germanB2ChartTasks) {
    assert.equal(chart.labels.reduce((sum, [, value]) => sum + value, 0), 100);
    for (const [label, value] of chart.labels) {
      assert.ok(chart.alt.toLocaleLowerCase("de").includes(label.toLocaleLowerCase("de")));
      assert.ok(chart.alt.includes(String(value)));
    }
    const path = resolve(import.meta.dirname, "../public", chart.src.slice(1));
    assert.ok(existsSync(path), `Missing chart ${chart.src}`);
    const lesson = germanB2Course.lessons[chart.chapterIndex];
    assert.equal(lesson.blocks.find((block) => block.id.endsWith("-chart"))?.src, chart.src);
    assert.ok(lesson.blocks.find((block) => block.id.endsWith("chart-response"))?.prompt.includes("fiktiv"));
  }
});

test("both exam routes end each unit with task-specific reflection and official practice", () => {
  const examLessons = germanB2Course.lessons.filter((lesson) => lesson.examTrack);
  assert.equal(examLessons.length, 22);
  for (const lesson of examLessons) {
    const reflection = lesson.blocks.find((block) => block.id.endsWith("exam-progress"));
    const official = lesson.blocks.find((block) => block.id.endsWith("official"));
    assert.equal(reflection?.type, "survey");
    assert.ok(reflection?.prompt.includes(lesson.title));
    assert.ok(reflection?.prompt.includes("Strategie"));
    assert.equal(official?.type, "resources");
    assert.ok(official?.items[0].url.startsWith("https://"));
  }
});

test("every referenced B2 listening recording is present and nonempty", () => {
  const urls = new Set([
    ...germanB2Course.lessons.flatMap((lesson) => lesson.blocks.filter((block) => block.type === "audio").map((block) => block.url)),
    ...germanB2Course.quiz.flatMap((question) => question.audioUrl ? [question.audioUrl] : []),
  ]);
  assert.equal(urls.size, 42);
  for (const url of urls) {
    const path = resolve(import.meta.dirname, "../public", url.slice(1));
    assert.ok(existsSync(path), `${url} is missing`);
    assert.ok(statSync(path).size > 10_000, `${url} is empty`);
  }
});
