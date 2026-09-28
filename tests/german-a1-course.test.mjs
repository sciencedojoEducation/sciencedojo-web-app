import { test } from "node:test";
import assert from "node:assert/strict";
import {
  germanA1AudioManifest,
  germanA1ChapterSpecs,
  germanA1Course,
} from "../lib/german-a1-course.ts";
import { germanA1SpeakerProfiles } from "../lib/german-a1-audio.ts";
import { validateAcademyCourse } from "../lib/academy-course-validation.ts";

test("builds the expanded German A1 draft curriculum", () => {
  assert.equal(germanA1Course.key, "deutsch-a1-komplett");
  assert.equal(germanA1Course.estimatedMinutes, 4050);
  assert.deepEqual(germanA1Course.audienceRoles, ["student"]);
  assert.equal(germanA1Course.lessons.length, 39);
  assert.equal(germanA1Course.quiz.length, 40);
  assert.equal(germanA1Course.passMark, 70);
  assert.equal(germanA1Course.rules?.navigation, "linear");
  assert.equal(germanA1Course.rules?.lessonCompletion, "required-blocks");
  for (const prefix of ["final-h", "final-l", "final-k", "final-g"])
    assert.equal(germanA1Course.quiz.filter((question) => question.id.startsWith(prefix)).length, 10);
  assert.ok(germanA1Course.quiz.filter((question) => question.id.startsWith("final-h")).every((question) => question.audioUrl?.endsWith(".m4a")));
});

test("develops chapter 1 as a complete five-hour beginner unit", () => {
  const chapter = germanA1Course.lessons.find((lesson) => lesson.id === "lesson-de-a1-01");
  assert.ok(chapter);
  assert.equal(chapter.durationMinutes, 300);
  assert.ok(chapter.blocks.length >= 45);
  const combinedText = JSON.stringify(chapter.blocks);
  for (const topic of [
    "Das deutsche Alphabet",
    "Ä, Ö, Ü und ß",
    "Buchstabieren",
    "Zentrale deutsche Laute",
    "Lange und kurze Vokale",
    "Wortakzent",
    "Zahlen von 0 bis 1000+",
    "Telefonnummern",
    "Anmeldung",
    "Abschlussprojekt",
  ]) assert.match(combinedText, new RegExp(topic.replace(/[+]/g, "\\+")));
  assert.ok(chapter.blocks.filter((block) => block.type === "knowledge-check").length >= 10);
  assert.ok(chapter.blocks.some((block) => block.id?.endsWith("-schreiben") && block.type === "writing-practice"));
  assert.ok(chapter.blocks.some((block) => block.id?.endsWith("-sprechen") && block.type === "speaking-practice"));
});

test("keeps all 32 syllabus chapters in order with every language skill", () => {
  const chapters = germanA1Course.lessons.filter((lesson) => /^\d+\. /.test(lesson.title));
  assert.equal(chapters.length, 32);
  chapters.forEach((lesson, index) => {
    assert.equal(lesson.title, `${index + 1}. ${germanA1ChapterSpecs[index].title}`);
    assert.ok(lesson.blocks.some((block) => block.type === "audio"), `${lesson.title} needs Hören`);
    assert.ok(lesson.blocks.some((block) => block.type === "text" && block.heading === "Lesen"), `${lesson.title} needs Lesen`);
    assert.ok(lesson.blocks.some((block) => block.type === "writing-practice"), `${lesson.title} needs Schreiben`);
    assert.ok(lesson.blocks.some((block) => block.type === "speaking-practice"), `${lesson.title} needs Sprechen`);
  });
});

test("covers the vocabulary target and supplies complete original audio manifests", () => {
  const terms = germanA1ChapterSpecs.flatMap((chapter) => chapter.vocabulary);
  const uniqueTerms = new Set(terms.map((term) => term.toLocaleLowerCase("de-DE")));
  assert.equal(terms.length, 800);
  assert.ok(uniqueTerms.size >= 700 && uniqueTerms.size <= 1000);
  assert.equal(germanA1AudioManifest.length, 39);
  for (const item of germanA1AudioManifest) {
    assert.match(item.outputPath, /^\/audio\/german-a1\/.+\.m4a$/);
    assert.ok(item.transcript.length > 100);
  }
});

test("adds an accessible visual scenario to every lesson", () => {
  const images = germanA1Course.lessons.map((lesson) =>
    lesson.blocks.find((block) => block.type === "image"),
  );
  assert.equal(images.length, 39);
  assert.ok(images.every((block) => block?.type === "image" && block.src.startsWith("/images/academy/german-a1/") && block.alt.length > 20 && block.caption?.startsWith("Bildimpuls:")));
  assert.equal(new Set(images.map((block) => block?.type === "image" ? block.src : "")).size, 6);
});

test("adds an image and active speaking prompt to every vocabulary card", () => {
  const chapters = germanA1Course.lessons.filter((lesson) => /^\d+\. /.test(lesson.title));
  const cards = chapters.flatMap((lesson) => {
    const block = lesson.blocks.find((candidate) => candidate.type === "flashcards");
    assert.equal(block?.type, "flashcards");
    assert.equal(block.appearance?.variant, "picture-grid");
    return block.items;
  });
  assert.equal(cards.length, 800);
  assert.ok(cards.every((card) => card.src?.startsWith("/images/academy/german-a1/word-cards/chapter-")));
  assert.ok(cards.every((card) => card.alt?.includes(card.title)));
  assert.equal(new Set(cards.map((card) => card.src)).size, 800);
  assert.ok(cards.every((card) => card.body.includes("laut vor") && card.body.includes("eigenen einfachen Satz")));
});

test("assigns dialogue speakers distinct gender- and age-aware German voices", () => {
  assert.equal(germanA1SpeakerProfiles.Anna.gender, "female");
  assert.equal(germanA1SpeakerProfiles.Eddy.gender, "male");
  assert.equal(germanA1SpeakerProfiles["Ansage eins"].ageGroup, "older-adult");
  assert.notEqual(germanA1SpeakerProfiles.Anna.voice, germanA1SpeakerProfiles.Eddy.voice);
  assert.equal(new Set(Object.values(germanA1SpeakerProfiles).map((profile) => profile.voice)).size, 5);
  assert.ok(Object.values(germanA1SpeakerProfiles).every((profile) => profile.performance.length > 50));
});

test("discloses AI-generated speech on every listening block", () => {
  const audioBlocks = germanA1Course.lessons.flatMap((lesson) =>
    lesson.blocks.filter((block) => block.type === "audio"),
  );
  assert.equal(audioBlocks.length, 39);
  assert.ok(audioBlocks.every((block) => block.caption?.includes("KI-generiert")));
});

test("contains five reviews, two complete model trainings, stable IDs, and valid content", () => {
  assert.equal(germanA1Course.lessons.filter((lesson) => lesson.slug.startsWith("review-")).length, 5);
  const models = germanA1Course.lessons.filter((lesson) => lesson.slug.startsWith("modelltest-"));
  assert.equal(models.length, 2);
  for (const lesson of models) {
    const headings = lesson.blocks.map((block) => "heading" in block ? block.heading : "").join(" ");
    for (const skill of ["Hören", "Lesen", "Schreiben", "Sprechen"])
      assert.match(headings, new RegExp(skill));
  }
  const lessonIds = germanA1Course.lessons.map((lesson) => lesson.id);
  const blockIds = germanA1Course.lessons.flatMap((lesson) => lesson.blocks.map((block) => block.id));
  assert.equal(new Set(lessonIds).size, lessonIds.length);
  assert.equal(new Set(blockIds).size, blockIds.length);
  assert.deepEqual(validateAcademyCourse(germanA1Course), { valid: true, errors: [], issues: [] });
});
