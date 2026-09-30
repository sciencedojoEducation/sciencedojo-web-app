import assert from "node:assert/strict";
import { test } from "node:test";

import { germanA1CoverageAreas, germanA1CoverageMatrix } from "../lib/german-a1-coverage.ts";
import { germanA1RestructuredCourse } from "../lib/german-a1-restructured-course.ts";

test("A1 coverage matrix maps every official topic area to a taught core chapter", () => {
  assert.equal(germanA1CoverageMatrix.length, 15);
  const taughtBeforeReview = new Set(germanA1CoverageMatrix.slice(0, 14)
    .flatMap((chapter) => chapter.officialAreas));
  assert.deepEqual([...taughtBeforeReview].sort(), [...germanA1CoverageAreas].sort());
  assert.deepEqual(germanA1CoverageMatrix.map((chapter) => chapter.chapterNumber),
    Array.from({ length: 15 }, (_, index) => index + 1));
});

test("each matrix row has the four skills and an evidenced learner task", () => {
  const coreLessons = germanA1RestructuredCourse.lessons.filter((lesson) => !lesson.examTrack);
  for (const [index, chapter] of germanA1CoverageMatrix.entries()) {
    const lesson = coreLessons[index];
    assert.ok(lesson.title.includes(chapter.chapterTitle));
    assert.deepEqual(chapter.skills, ["hoeren", "lesen", "schreiben", "sprechen"]);
    assert.ok(chapter.grammarInContext.length > 0);
    assert.ok(chapter.readingText.length > 5, `${lesson.title}: readingText`);
    for (const key of ["listeningSituation", "writingTask", "speakingTask", "examTransfer"])
      assert.ok(chapter[key].length > 12, `${lesson.title}: ${key}`);
    assert.ok(lesson.blocks.some((block) => block.type === "audio" && block.transcript));
    assert.ok(lesson.blocks.some((block) => block.type === "writing-practice"));
    assert.ok(lesson.blocks.some((block) => block.type === "speaking-practice"));
  }
});

test("promised secondary topic areas are taught in actual lesson activities", () => {
  const core = germanA1RestructuredCourse.lessons.filter((lesson) => !lesson.examTrack);
  for (const [number, tableSuffix, checkSuffix, terms] of [
    [9, "-unterkunft-sprache", "-unterkunft-check", ["Unterkunft", "Gepäck", "Rezeption"]],
    [11, "-medien-sprache", "-medien-check", ["Internet", "Fernsehen", "Nachricht"]],
    [13, "-jahreszeiten", "-natur-check", ["Frühling", "Sommer", "Herbst", "Winter"]],
  ]) {
    const lesson = core[number - 1];
    const table = lesson.blocks.find((block) => block.id.endsWith(tableSuffix));
    const check = lesson.blocks.find((block) => block.id.endsWith(checkSuffix));
    assert.equal(table?.type, "comparison-table", lesson.title);
    assert.equal(check?.type, "knowledge-check", lesson.title);
    assert.equal(check.required, true);
    for (const term of terms)
      assert.match(JSON.stringify(table.rows), new RegExp(term, "i"), `${lesson.title}: ${term}`);
  }
});

test("town services include an actionable post notice and service phrases", () => {
  const town = germanA1RestructuredCourse.lessons.find((lesson) => lesson.id === "lesson-de-a1-route-08");
  const table = town?.blocks.find((block) => block.id === "a1-route-08-dienste-sprache");
  const notice = town?.blocks.find((block) => block.id === "a1-route-08-post-lesen");
  const check = town?.blocks.find((block) => block.id === "a1-route-08-post-check");
  assert.equal(table?.type, "comparison-table");
  assert.match(JSON.stringify(table.rows), /Post.*Bank.*Polizei/);
  assert.equal(notice?.type, "text");
  assert.match(notice.paragraphs.join(" "), /Ausweis und die Abholkarte/);
  assert.equal(check?.type, "knowledge-check");
  assert.equal(check.required, true);
});

test("messages and forms chapter practises reading and filling an actual form", () => {
  const lesson = germanA1RestructuredCourse.lessons.find((item) => item.id === "lesson-de-a1-route-14");
  const notice = lesson?.blocks.find((block) => block.id === "a1-route-14-formular-lesen");
  const check = lesson?.blocks.find((block) => block.id === "a1-route-14-formular-check");
  const writing = lesson?.blocks.find((block) => block.id === "a1-route-14-formular-schreiben");
  assert.equal(notice?.type, "text");
  assert.match(notice.paragraphs.join(" "), /Vorname, Nachname, Geburtsdatum, Adresse und Telefonnummer/);
  assert.equal(check?.type, "knowledge-check");
  assert.equal(check.required, true);
  assert.equal(writing?.type, "writing-practice");
  assert.equal(writing.completion, "interact");
  assert.match(writing.prompt, /erfundene persönliche Daten/);
});

test("people and health chapters turn promised secondary topics into practice", () => {
  const core = germanA1RestructuredCourse.lessons.filter((lesson) => !lesson.examTrack);
  for (const [number, prefix, terms] of [
    [3, "berufe", ["Lehrerin", "Ärztin", "Koch"]],
    [12, "apotheke", ["Kopfschmerzen", "helfen", "soll"]],
  ]) {
    const lesson = core[number - 1];
    const table = lesson.blocks.find((block) => block.id === `a1-route-${String(number).padStart(2, "0")}-${prefix}-sprache`);
    const reading = lesson.blocks.find((block) => block.id === `a1-route-${String(number).padStart(2, "0")}-${prefix}-lesen`);
    const check = lesson.blocks.find((block) => block.id === `a1-route-${String(number).padStart(2, "0")}-${prefix}-check`);
    assert.equal(table?.type, "comparison-table", lesson.title);
    assert.equal(reading?.type, "text", lesson.title);
    assert.equal(check?.type, "knowledge-check", lesson.title);
    assert.equal(check.required, true);
    for (const term of terms) assert.match(JSON.stringify(table.rows), new RegExp(term, "i"));
  }
});
