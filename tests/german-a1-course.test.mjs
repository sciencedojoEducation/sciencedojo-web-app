import { test } from "node:test";
import assert from "node:assert/strict";
import {
  germanA1AudioManifest,
  germanA1ChapterSpecs,
  germanA1Course,
} from "../lib/german-a1-course.ts";
import { germanA1FunctionalScenarios } from "../lib/german-a1-functional-scenarios.ts";
import { germanA1SpeakerProfiles } from "../lib/german-a1-audio.ts";
import { validateAcademyCourse } from "../lib/academy-course-validation.ts";

test("builds the expanded German A1 draft curriculum", () => {
  assert.equal(germanA1Course.key, "deutsch-a1-komplett");
  assert.equal(germanA1Course.estimatedMinutes, 4470);
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
  const registrationAudio = chapter.blocks.find((block) => block.type === "audio");
  assert.equal(registrationAudio?.url, "/audio/german-a1/a1-kapitel-01-anmeldung-natural-v2.m4a");
  assert.match(registrationAudio.transcript, /Anna: Ja: W, E, B, E, R/);
  assert.ok(chapter.blocks.some((block) => block.type === "knowledge-check" &&
    block.question.prompt.includes("Nachnamen buchstabiert Anna")));
  assert.ok(chapter.blocks.some((block) => block.type === "knowledge-check" &&
    block.question.prompt.includes("Ende der Telefonnummer")));
});

test("develops chapter 2 as a complete five-hour introductions unit", () => {
  const chapter = germanA1Course.lessons.find((lesson) => lesson.id === "lesson-de-a1-02");
  assert.ok(chapter);
  assert.equal(chapter.durationMinutes, 300);
  assert.ok(chapter.blocks.length >= 50);
  const combinedText = JSON.stringify(chapter.blocks);
  for (const topic of [
    "Begrüßungen und Abschiede",
    "Sich vorstellen und Namen erfragen",
    "Persönliche Fragen und Satzbau",
    "Länder und Herkunft",
    "Wo wohnen Sie?",
    "Sprachen und Sprachkenntnisse",
    "Alter und sein",
    "du und Sie",
    "Erster Tag im Deutschkurs",
    "Das bin ich",
  ]) assert.match(combinedText, new RegExp(topic.replace(/[?]/g, "\\?"), "i"));
  assert.ok(chapter.blocks.filter((block) => block.type === "knowledge-check").length >= 15);
  assert.ok(chapter.blocks.some((block) => block.id?.endsWith("-schreiben") && block.type === "writing-practice"));
  assert.ok(chapter.blocks.some((block) => block.id?.endsWith("-sprechen") && block.type === "speaking-practice"));
});

test("develops chapter 3 as a complete five-hour family unit", () => {
  const chapter = germanA1Course.lessons.find((lesson) => lesson.id === "lesson-de-a1-03");
  assert.ok(chapter);
  assert.equal(chapter.durationMinutes, 300);
  assert.ok(chapter.blocks.length >= 55);
  const combinedText = JSON.stringify(chapter.blocks);
  for (const topic of [
    "Familie: Wer gehört dazu?",
    "Wer ist das? Personen vorstellen",
    "mein und meine",
    "dein und deine",
    "er und sie",
    "Alter und Familieninformationen",
    "Menschen beschreiben",
    "Familienstand und Beziehungen",
    "Geschwister, Kinder und Hören",
    "Mini-Projekt: Meine Familie",
  ]) assert.match(combinedText, new RegExp(topic.replace(/[?]/g, "\\?"), "i"));
  assert.ok(chapter.blocks.filter((block) => block.type === "knowledge-check").length >= 15);
  assert.ok(chapter.blocks.some((block) => block.id?.endsWith("-schreiben") && block.type === "writing-practice"));
  assert.ok(chapter.blocks.some((block) => block.id?.endsWith("-sprechen") && block.type === "speaking-practice"));
  const familyTree = chapter.blocks.find((block) => block.id?.endsWith("-familienbaum-bild"));
  assert.equal(familyTree?.type, "image");
  assert.equal(familyTree.src, "/images/academy/german-a1/family-tree-chapter-03.svg");
  const assessment = chapter.blocks.filter((block) => block.id?.includes("-abschluss-") && block.type === "knowledge-check");
  assert.equal(assessment.length, 5);
  assert.ok(assessment.every((block) => block.required && block.question.weight === 4));
  const cards = chapter.blocks.find((block) => block.type === "flashcards")?.items;
  assert.ok(cards);
  assert.ok(cards.every((card) => !card.src.includes("?")), "local picture-card URLs must not contain unconfigured query strings");
  assert.match(cards[22].src, /chapter-21-03\.jpg/); // sportlich: a runner
  assert.match(cards[23].src, /chapter-02-21\.jpg/); // verheiratet: wedding couple
  assert.match(cards[24].src, /chapter-02-20\.jpg/); // ledig: single-person symbol
  assert.ok(chapter.blocks.some((block) => block.id?.endsWith("-formell-kinder") && block.type === "quote"));
});

test("uses an original time-change dialogue and functional message for daily routine", () => {
  const lesson = germanA1Course.lessons.find((item) => item.id === "lesson-de-a1-12");
  assert.ok(lesson);
  const audio = lesson.blocks.find((block) => block.type === "audio");
  assert.equal(audio?.url, "/audio/german-a1/a1-kapitel-04-tagesablauf.m4a");
  assert.match(audio.transcript, /Anna: Guten Morgen, Sam/);
  assert.match(audio.transcript, /Sam: Normalerweise um sechs Uhr/);
  assert.match(audio.transcript, /Am Mittwoch rufe ich nach dem Kurs meine Mutter an/);
  const listeningChecks = lesson.blocks.filter((block) =>
    block.type === "knowledge-check" && block.id.includes("hoercheck"));
  assert.equal(listeningChecks.length, 2);
  assert.ok(listeningChecks.every((block) => block.required));
  assert.ok(lesson.blocks.some((block) => block.type === "text" && block.heading === "Lesen" &&
    block.paragraphs.some((line) => line.includes("18:30 Uhr statt um 18 Uhr"))));
});

test("replaces generic listening with functional adult scenarios in chapters 5–14", () => {
  assert.deepEqual(Object.keys(germanA1FunctionalScenarios).map(Number).sort((a, b) => a - b), [14, 15, 16, 18, 19, 20, 21, 22, 23, 24]);
  for (const [number, scenario] of Object.entries(germanA1FunctionalScenarios)) {
    const lesson = germanA1Course.lessons.find((item) => item.id === `lesson-de-a1-${number}`);
    assert.ok(lesson, `source chapter ${number}`);
    const audio = lesson.blocks.find((block) => block.type === "audio");
    assert.equal(audio?.transcript, scenario.transcript);
    assert.match(audio.url, new RegExp(`a1-kapitel-${String(scenario.routeChapter).padStart(2, "0")}-`));
    assert.ok(lesson.blocks.some((block) => block.type === "text" && block.heading === "Lesen" &&
      block.paragraphs.includes(scenario.reading)));
    for (const question of scenario.listeningQuestions)
      assert.ok(lesson.blocks.some((block) => block.type === "knowledge-check" && block.required &&
        block.question.prompt === question.prompt));
  }
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
  assert.ok(cards.every((card) => !card.src.includes("?")), "local picture-card URLs must be valid Next.js image sources");
  assert.ok(new Set(cards.map((card) => card.src)).size >= 775);
  assert.ok(cards.every((card) => card.body.includes("laut vor") && card.body.includes("eigenen einfachen Satz")));
});

test("assigns dialogue speakers distinct gender- and age-aware German voices", () => {
  assert.equal(germanA1SpeakerProfiles.Anna.gender, "female");
  assert.equal(germanA1SpeakerProfiles.Eddy.gender, "male");
  assert.equal(germanA1SpeakerProfiles.Sam.gender, "male");
  assert.equal(germanA1SpeakerProfiles["Ansage eins"].ageGroup, "older-adult");
  assert.notEqual(germanA1SpeakerProfiles.Anna.voice, germanA1SpeakerProfiles.Eddy.voice);
  assert.notEqual(germanA1SpeakerProfiles.Anna.voice, germanA1SpeakerProfiles.Sam.voice);
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
