import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, test } from "node:test";

import { validateAcademyCourse } from "../lib/academy-course-validation.ts";
import { getAcademyJourneyLessonState } from "../lib/academy-journey.ts";
import { germanA1Curriculum, germanA1ExamTracks } from "../lib/german-a1-curriculum.ts";
import { germanA1FunctionalScenarios } from "../lib/german-a1-functional-scenarios.ts";
import { germanA1FinalListening } from "../lib/german-a1-final-listening.ts";
import { germanA1RestructuredCourse } from "../lib/german-a1-restructured-course.ts";
import { emptyAcademyProgress, getAcademyRequiredLessons, getAcademyResumeHref, getPublicQuizQuestions, isAcademyBlockRequiredForCompletion, isAcademyCourseComplete, scoreTutorAcademyQuiz } from "../lib/tutor-academy.ts";

const course = germanA1RestructuredCourse;
const core = course.lessons.filter((lesson) => !lesson.examTrack);

describe("restructured adult German A1 course", () => {
  test("has fifteen communicative chapters followed by seven stages per exam route", () => {
    assert.equal(core.length, 15);
    assert.deepEqual(core.map((lesson) => lesson.title),
      germanA1Curriculum.map((chapter) => `${chapter.number}. ${chapter.title}`));
    assert.deepEqual(course.examTracks.map((track) => track.id), ["goethe", "telc"]);
    for (const trackId of Object.keys(germanA1ExamTracks)) {
      const route = course.lessons.filter((lesson) => lesson.examTrack === trackId);
      assert.equal(route.length, 7);
      assert.deepEqual(route.map((lesson) => lesson.title.split(". ").slice(1).join(". ")),
        germanA1ExamTracks[trackId].stages);
    }
    assert.equal(course.lessons.length, 29);
    assert.equal(course.quiz.length, 40);
    assert.equal(course.passMark, 70);
  });

  test("each core chapter includes the four skills and a real-life outcome", () => {
    for (const lesson of core) {
      assert.ok(lesson.blocks.some((block) => block.type === "audio" && block.transcript?.trim()), lesson.title);
      assert.ok(lesson.blocks.some((block) => block.type === "text" && block.heading === "Lesen"), lesson.title);
      assert.ok(lesson.blocks.some((block) => block.type === "writing-practice"), lesson.title);
      assert.ok(lesson.blocks.some((block) => block.type === "speaking-practice"), lesson.title);
      assert.ok(lesson.blocks.some((block) => block.type === "callout" && block.heading === "Das können Sie am Ende"), lesson.title);
    }
  });

  test("inherited vocabulary banks remain accessible but optional after the core deck", () => {
    const expectedOptionalDecks = [0, 0, 3, 5, 3, 1, 0, 1, 1, 0, 0, 0, 0, 1, 1];
    for (const [index, lesson] of core.entries()) {
      const decks = lesson.blocks.filter((block) => block.type === "flashcards");
      assert.ok(decks.some((block) => !block.optional), lesson.title);
      const optionalDecks = decks.filter((block) => block.optional);
      assert.equal(optionalDecks.length, expectedOptionalDecks[index], lesson.title);
      for (const deck of optionalDecks) {
        assert.match(deck.heading, /Zusatzwortschatz/);
        assert.ok(!isAcademyBlockRequiredForCompletion(deck), deck.id);
      }
    }
  });

  test("productive model answers stay within the taught A1 sentence patterns", () => {
    for (const lesson of core) {
      for (const block of lesson.blocks.filter((item) =>
        item.type === "writing-practice" || item.type === "speaking-practice")) {
        assert.doesNotMatch(block.modelAnswer, /\b(weil|wenn|obwohl|dass|damit|bevor|nachdem)\b/i,
          `${lesson.title}: ${block.id}`);
      }
    }
  });

  test("writing model answers fit the word targets shown to learners", () => {
    for (const lesson of course.lessons) {
      for (const block of lesson.blocks.filter((item) => item.type === "writing-practice")) {
        const words = block.modelAnswer.trim().split(/\s+/).length;
        assert.ok(words >= block.minWords && words <= block.maxWords,
          `${lesson.title}: ${block.id} has ${words} words, target ${block.minWords}–${block.maxWords}`);
      }
    }
  });

  test("formative mini-checks in the first chapters do not block progression", () => {
    assert.deepEqual(core.slice(0, 3).map((lesson) =>
      lesson.blocks.filter(isAcademyBlockRequiredForCompletion).length), [6, 8, 12]);
    for (const lesson of core.slice(0, 3)) {
      assert.ok(lesson.blocks.some((block) => block.type === "knowledge-check" &&
        block.required === false && block.completion === "interact" &&
        !isAcademyBlockRequiredForCompletion(block)));
      assert.ok(lesson.blocks.some((block) => block.type === "knowledge-check" &&
        block.required === true && block.completion === "pass" &&
        isAcademyBlockRequiredForCompletion(block)));
      assert.ok(lesson.blocks.some((block) => block.type === "writing-practice" &&
        isAcademyBlockRequiredForCompletion(block)));
      assert.ok(lesson.blocks.some((block) => block.type === "speaking-practice" &&
        isAcademyBlockRequiredForCompletion(block)));
    }
  });

  test("early chapters finish with integrated practice and all later chapters recall earlier language", () => {
    for (const lesson of core.slice(0, 3)) {
      const examIndex = lesson.blocks.findIndex((block) => block.id?.endsWith("-pruefungsblick"));
      const practiceIndex = lesson.blocks.findIndex((block) => block.id?.endsWith("-pruefungsfrage"));
      assert.ok(examIndex >= 0 && practiceIndex > examIndex, lesson.title);
      assert.equal(lesson.blocks[practiceIndex].required, false, lesson.title);
      assert.equal(lesson.blocks.at(-1)?.heading, "Kapitel geschafft 🎉", lesson.title);
    }
    for (const [index, lesson] of core.slice(1, 14).entries()) {
      const recall = lesson.blocks.find((block) => block.id?.endsWith("-rueckblick-check"));
      assert.equal(recall?.type, "knowledge-check", lesson.title);
      assert.equal(recall.required, false, lesson.title);
      assert.equal(recall.completion, "interact", lesson.title);
      assert.equal(recall.question.options.length, 3, lesson.title);
      assert.ok(recall.question.options.some((option) => option.id === recall.question.correctOptionId), lesson.title);
      const recallIndex = lesson.blocks.indexOf(recall);
      const firstSourceIndex = lesson.blocks.findIndex((block) => block.id?.startsWith("de-a1-"));
      assert.ok(recallIndex >= 0 && recallIndex < firstSourceIndex, lesson.title);
      assert.equal(recall.question.correctOptionId, String((3 - index % 3) % 3));
    }
  });

  test("work, leisure, health, weather and messages teach the source situation before production", () => {
    const expected = [
      [10, "kursplan", "anmeldung-check"],
      [11, "einladung", "antwort-check"],
      [12, "beschwerden", "karte-check"],
      [13, "wochenendplan", "plan-check"],
      [14, "terminwechsel", "frist-check"],
    ];
    for (const [number, first, last] of expected) {
      const lesson = core[number - 1];
      const prefix = `a1-route-${String(number).padStart(2, "0")}`;
      const ids = lesson.blocks.map((block) => block.id);
      const firstIndex = ids.indexOf(`${prefix}-${first}`);
      const lastIndex = ids.indexOf(`${prefix}-${last}`);
      const writingIndex = lesson.blocks.findIndex((block) => block.type === "writing-practice");
      assert.ok(firstIndex > 0 && lastIndex > firstIndex && writingIndex > lastIndex, lesson.title);
      assert.ok(lesson.blocks.filter((block) => block.type === "knowledge-check" &&
        block.id?.startsWith(prefix) && isAcademyBlockRequiredForCompletion(block)).length >= 2,
        lesson.title);
    }
    const chapterFourteen = core[13];
    assert.ok(chapterFourteen.blocks.findIndex((block) => block.id === "a1-route-14-vertiefung") >
      chapterFourteen.blocks.findIndex((block) => block.id === "a1-route-14-alltagsaufgabe"));
    assert.ok(!chapterFourteen.blocks.some((block) => block.id === "de-a1-05-satzbau-grammatik"));
    assert.ok(core[12].blocks.some((block) => block.type === "worked-example" &&
      block.heading === "Grammatik im Gebrauch" && block.steps[2].body.includes("Morgen ist es warm")));
  });

  test("everyday topic material precedes supporting grammar chapters", () => {
    for (const [chapterNumber, topicalSourceNumber] of [[4, 12], [5, 16], [6, 14], [9, 19], [14, 24]]) {
      const lesson = core[chapterNumber - 1];
      const firstSourceBlock = lesson.blocks.find((block) => block.id.startsWith("de-a1-"));
      assert.ok(firstSourceBlock?.id.startsWith(`de-a1-${String(topicalSourceNumber).padStart(2, "0")}-`), lesson.title);
    }
  });

  test("daily routine has a real time-change listening task", () => {
    const dailyRoutine = core[3];
    const audio = dailyRoutine.blocks.find((block) => block.type === "audio" &&
      block.url === "/audio/german-a1/a1-kapitel-04-tagesablauf.m4a");
    assert.ok(audio?.transcript.includes("halb sieben"));
    assert.ok(dailyRoutine.blocks.some((block) => block.type === "knowledge-check" &&
      block.question.prompt.includes("Sams Deutschkurs") && block.question.correctOptionId === "b"));
  });

  test("daily routine teaches time and separable verbs through the situation before optional word banks", () => {
    const lesson = core[3];
    const ids = lesson.blocks.map((block) => block.id);
    const at = (id) => ids.indexOf(`a1-route-04-${id}`);
    assert.ok(at("uhrzeit-lernen") > ids.indexOf("de-a1-12-tagesablauf-lesen"));
    assert.ok(at("trennbar-check") > at("uhrzeit-check"));
    assert.ok(at("trennbar-check") < at("schreiben"));
    assert.ok(at("vertiefung") > at("alltagsaufgabe"));
    assert.ok(at("vertiefung") < at("abruf"));
    assert.equal(lesson.blocks.filter((block) =>
      ["a1-route-04-uhrzeit-check", "a1-route-04-trennbar-check"].includes(block.id) &&
      block.type === "knowledge-check" && block.required === true).length, 2);
    assert.equal(lesson.blocks.filter((block) =>
      ["a1-route-04-zeitwort-check", "a1-route-04-praesens-check"].includes(block.id) &&
      block.type === "knowledge-check" && block.required === false).length, 2);
    assert.ok(!ids.includes("de-a1-04-prasens-grammatik"));
    assert.ok(ids.includes("de-a1-04-prasens-wortschatz"));
  });

  test("housing applies es gibt, furniture, location and negation before production", () => {
    const lesson = core[4];
    const ids = lesson.blocks.map((block) => block.id);
    const at = (id) => ids.indexOf(`a1-route-05-${id}`);
    assert.ok(at("zimmer-lernen") > ids.indexOf("de-a1-16-wohnen-und-mobel-lesen"));
    assert.ok(at("negation-check") > at("es-gibt-check"));
    assert.ok(at("negation-check") < at("schreiben"));
    assert.ok(at("vertiefung") > at("alltagsaufgabe"));
    assert.ok(ids.includes("de-a1-17-ort-und-lage-wortschatz"));
    assert.ok(!ids.includes("de-a1-25-negation-mit-nicht-und-kein-grammatik"));
    for (const id of ["es-gibt-check", "negation-check"])
      assert.equal(lesson.blocks[at(id)].required, true);
  });

  test("café practice connects meals, polite ordering, articles and price to the dialogue", () => {
    const lesson = core[5];
    const ids = lesson.blocks.map((block) => block.id);
    const at = (id) => ids.indexOf(`a1-route-06-${id}`);
    assert.ok(at("mahlzeiten-lernen") > ids.indexOf("de-a1-14-essen-und-trinken-lesen"));
    assert.ok(at("bestellen-lernen") < at("bestellen-check"));
    assert.ok(at("akkusativ-check") < at("schreiben"));
    assert.ok(at("vertiefung") > at("alltagsaufgabe"));
    assert.ok(ids.includes("de-a1-07-nominativ-und-akkusativ-wortschatz"));
    assert.ok(!ids.includes("de-a1-07-nominativ-und-akkusativ-grammatik"));
    for (const id of ["bestellen-check", "akkusativ-check"])
      assert.equal(lesson.blocks[at(id)].required, true);
  });

  test("shopping practises choosing, asking and returning a jacket before writing and speaking", () => {
    const lesson = core[6];
    const ids = lesson.blocks.map((block) => block.id);
    const at = (id) => ids.indexOf(`a1-route-07-${id}`);
    assert.ok(at("auswahl") > ids.indexOf("de-a1-15-einkaufen-lesen"));
    assert.ok(at("groesse-check") < at("fragen"));
    assert.ok(at("umtausch-check") < at("schreiben"));
    for (const id of ["groesse-check", "umtausch-check"])
      assert.equal(lesson.blocks[at(id)].required, true);
  });

  test("town practice follows the heard directions and keeps extra cards after the real-life challenge", () => {
    const lesson = core[7];
    const ids = lesson.blocks.map((block) => block.id);
    const at = (id) => ids.indexOf(`a1-route-08-${id}`);
    assert.ok(at("weg-schritte") > ids.indexOf("de-a1-18-stadt-und-wegbeschreibung-lesen"));
    assert.ok(at("rueckfrage") < at("post-lesen"));
    assert.ok(at("schalter-check") < at("schreiben"));
    assert.ok(at("vertiefung") > at("alltagsaufgabe"));
    assert.ok(ids.includes("de-a1-27-imperativ-wortschatz"));
    assert.ok(!ids.includes("de-a1-27-imperativ-grammatik"));
  });

  test("travel practice uses the delayed train and direct journey without teaching weil", () => {
    const lesson = core[8];
    const ids = lesson.blocks.map((block) => block.id);
    const at = (id) => ids.indexOf(`a1-route-09-${id}`);
    assert.ok(at("abfahrt") > ids.indexOf("de-a1-19-verkehrsmittel-lesen"));
    assert.ok(at("umsteigen-check") < at("unterkunft-lesen"));
    assert.ok(at("vertiefung") > at("alltagsaufgabe"));
    assert.ok(ids.includes("de-a1-13-modalverben-wortschatz"));
    assert.ok(!ids.includes("de-a1-13-modalverben-grammatik"));
    const grammar = lesson.blocks.find((block) => block.id === "de-a1-19-verkehrsmittel-grammatik");
    assert.ok(grammar?.type === "worked-example");
    assert.ok(grammar.steps.every((step) => !/\bweil\b/i.test(step.body)));
  });

  test("chapters five to fourteen use original situation-backed listening and reading", () => {
    for (const scenario of Object.values(germanA1FunctionalScenarios)) {
      const lesson = core[scenario.routeChapter - 1];
      assert.ok(lesson.blocks.some((block) => block.type === "audio" &&
        block.transcript === scenario.transcript), lesson.title);
      assert.ok(lesson.blocks.some((block) => block.type === "text" &&
        block.heading === "Lesen" && block.paragraphs.includes(scenario.reading)), lesson.title);
      for (const question of scenario.listeningQuestions)
        assert.ok(lesson.blocks.some((block) => block.type === "knowledge-check" &&
          block.question.prompt === question.prompt && block.completion === "pass"), lesson.title);
    }
  });

  test("chapter fifteen transfers four skills across two distinct everyday situations", () => {
    const mastery = core[14];
    const audio = mastery.blocks.filter((block) => block.type === "audio");
    assert.equal(audio.length, 2);
    assert.equal(audio[0].url, "/audio/german-a1/a1-kapitel-15-alltagstraining.m4a");
    assert.equal(audio[1].url, "/audio/german-a1/a1-kapitel-15-wohnen-und-plaene.m4a");
    assert.match(audio[0].transcript, /Telefonnotiz:/);
    assert.match(audio[0].transcript, /Ansage eins:/);
    assert.match(audio[0].transcript, /Sam:/);
    assert.match(audio[1].transcript, /Anna:/);
    assert.match(audio[1].transcript, /Eddy:/);
    assert.equal(mastery.blocks.filter((block) => block.id.startsWith("a1-route-15-hoercheck-") && block.required).length, 3);
    assert.equal(mastery.blocks.filter((block) => block.id.startsWith("a1-route-15-lesecheck-") && block.required).length, 2);
    assert.ok(mastery.blocks.some((block) => block.type === "writing-practice" && block.prompt.includes("10:10")));
    assert.ok(mastery.blocks.some((block) => block.type === "speaking-practice" && block.prompt.includes("Zugverspätung")));
    assert.equal(mastery.blocks.filter((block) => block.id.startsWith("a1-route-15-transfer-hoercheck-") && block.required).length, 3);
    assert.equal(mastery.blocks.filter((block) => block.id.startsWith("a1-route-15-transfer-lesecheck-") && block.required).length, 2);
    assert.ok(mastery.blocks.some((block) => block.id === "a1-route-15-transfer-lesen" && block.type === "text" && block.paragraphs.some((paragraph) => paragraph.includes("Aufzug"))));
    assert.ok(mastery.blocks.some((block) => block.id === "a1-route-15-transfer-schreiben" && block.type === "writing-practice" && block.completion === "interact"));
    assert.ok(mastery.blocks.some((block) => block.id === "a1-route-15-transfer-sprechen" && block.type === "speaking-practice" && block.completion === "interact"));
    assert.equal(new Set(mastery.blocks.map((block) => block.id)).size, mastery.blocks.length);
    const optional = mastery.blocks.find((block) => block.id === "a1-route-15-gestern-wortschatz");
    assert.equal(optional?.type, "flashcards");
    assert.equal(optional.items.length, 13);
    assert.equal(optional.completion, undefined);
  });

  test("supplemental grammar stays optional and drops generic demonstration recordings", () => {
    for (const [index, chapter] of germanA1Curriculum.entries()) {
      const lesson = core[index];
      for (const sourceNumber of chapter.legacyChapters.slice(1)) {
        const prefix = `de-a1-${String(sourceNumber).padStart(2, "0")}-`;
        assert.ok(!lesson.blocks.some((block) =>
          block.id.startsWith(prefix) && ["audio", "knowledge-check"].includes(block.type)),
        `${lesson.title}: no generic supplemental recordings or orphaned checks`);
      }
    }
  });

  test("city and invitation chapters teach useful phrases without full grammar paradigms", () => {
    for (const [index, excludedSource] of [[7, 31], [10, 30]]) {
      const lesson = core[index];
      const prefix = `de-a1-${String(excludedSource).padStart(2, "0")}-`;
      assert.ok(!lesson.blocks.some((block) => block.id.startsWith(prefix)), lesson.title);
    }
    assert.ok(core[7].blocks.some((block) => block.id === "a1-route-08-weg-wendungen"));
    assert.ok(core[10].blocks.some((block) => block.id === "a1-route-11-einladung-verknuepfen"));
  });

  test("chapters four to fourteen end after integrated production and retrieval", () => {
    for (const lesson of core.slice(3, 14)) {
      const types = lesson.blocks.map((block) => block.type);
      const headings = lesson.blocks.map((block) => block.heading || "");
      assert.equal(types.filter((type) => type === "audio").length, 1, lesson.title);
      const firstAudio = types.indexOf("audio");
      const firstReading = headings.indexOf("Lesen");
      const firstVocabulary = types.indexOf("flashcards");
      const firstWriting = types.indexOf("writing-practice");
      const firstSpeaking = types.indexOf("speaking-practice");
      const challenge = headings.indexOf("Alltags-Challenge");
      const recall = headings.indexOf("Morgen wiederholen");
      const recap = headings.indexOf("Kapitel geschafft");
      assert.ok(firstAudio < firstReading && firstReading < firstVocabulary,
        `${lesson.title}: context and comprehension precede language focus`);
      assert.ok(firstVocabulary < firstWriting && firstWriting < firstSpeaking &&
        firstSpeaking < challenge && challenge < recall && recall < recap,
      `${lesson.title}: production and retrieval precede the recap`);
    }
  });

  test("retains a useful A1 vocabulary range with pictured cards", () => {
    const cards = core.flatMap((lesson) => lesson.blocks
      .filter((block) => block.type === "flashcards")
      .flatMap((block) => block.items));
    const uniqueTerms = new Set(cards.map((card) => card.title));
    assert.ok(uniqueTerms.size >= 620 && uniqueTerms.size <= 800, uniqueTerms.size);
    for (const label of ["der Verbstamm", "die Endung", "der Nominativ", "der Akkusativ", "Position zwei", "der Artikel", "das Nomen", "das Präfix", "die Präposition"])
      assert.ok(!uniqueTerms.has(label), `${label} is a grammar label, not picture vocabulary`);
    for (const lesson of core) {
      const lessonTerms = lesson.blocks.filter((block) => block.type === "flashcards")
        .flatMap((block) => block.items.map((item) => item.title));
      assert.equal(new Set(lessonTerms).size, lessonTerms.length,
        `${lesson.title} repeats a picture card within the chapter`);
    }
    assert.ok(cards.every((card) => card.src && card.alt));
    assert.ok(cards.every((card) =>
      !card.src.startsWith("/") ||
      existsSync(resolve("public", card.src.split("?")[0].slice(1)))));
  });

  test("contains usable transcript-backed media, unique IDs, and no unsupported URLs", () => {
    const blocks = course.lessons.flatMap((lesson) => lesson.blocks);
    assert.equal(new Set(course.lessons.map((lesson) => lesson.id)).size, course.lessons.length);
    assert.equal(new Set(blocks.map((block) => block.id)).size, blocks.length);
    for (const block of blocks.filter((item) => item.type === "audio")) {
      assert.ok(block.transcript?.trim(), block.id);
      if (block.url.startsWith("/audio/")) {
        const path = resolve("public", block.url.slice(1));
        assert.ok(existsSync(path), block.url);
        assert.ok(statSync(path).size > 10_000, `${block.url} looks empty`);
      }
    }
    const result = validateAcademyCourse(course);
    assert.deepEqual(result.errors, []);
  });

  test("keeps productive portfolio work outside the objective score", () => {
    assert.ok(course.quiz.every((question) => question.type !== "reflection"));
    assert.ok(course.quiz.every((question) => question.options.length >= 2));
    assert.ok(course.lessons.some((lesson) => lesson.examTrack === "goethe" &&
      lesson.blocks.some((block) => block.type === "speaking-practice")));
    assert.ok(course.lessons.some((lesson) => lesson.examTrack === "telc" &&
      lesson.blocks.some((block) => block.type === "writing-practice")));
  });

  test("final questions use everyday vocabulary and do not reveal answers by position", () => {
    const vocabulary = course.quiz.filter((question) => question.id.startsWith("final-k"));
    assert.equal(vocabulary.length, 10);
    assert.ok(vocabulary.every((question) => !question.prompt.includes("Kapitel")));
    const answerPositions = course.quiz.map((question) =>
      question.options.findIndex((option) => option.id === question.correctOptionId));
    for (const position of [0, 1, 2])
      assert.ok(answerPositions.filter((item) => item === position).length >= 10);
    const allCorrect = Object.fromEntries(course.quiz.map((question) =>
      [question.id, question.correctOptionId]));
    assert.equal(scoreTutorAcademyQuiz(allCorrect, course).score, 100);
  });

  test("final grammar questions ask for usable language, not case terminology", () => {
    for (const id of ["final-g2", "final-g9"]) {
      const question = course.quiz.find((item) => item.id === id);
      assert.ok(question);
      assert.doesNotMatch(question.prompt, /Akkusativ|Dativ|Kasus/i);
      assert.match(question.prompt, /Supermarkt|Arbeitsweg/);
    }
  });

  test("final listening uses ten fresh transcript-backed recordings across early and later chapters", () => {
    const listening = course.quiz.filter((question) => question.id.startsWith("final-h"));
    assert.equal(listening.length, 10);
    const lessonAudio = new Set(course.lessons.flatMap((lesson) => lesson.blocks
      .filter((block) => block.type === "audio").map((block) => block.url)));
    assert.deepEqual(listening.map((question) => question.audioUrl),
      germanA1FinalListening.map((item) => item.audioUrl));
    assert.ok(germanA1FinalListening.some((item) => item.chapter >= 11));
    assert.ok(listening.every((question) => question.audioTranscript?.trim() &&
      !lessonAudio.has(question.audioUrl)));
    assert.ok(listening.every((question) =>
      existsSync(resolve("public", question.audioUrl.slice(1))) &&
      statSync(resolve("public", question.audioUrl.slice(1))).size > 10_000));
    assert.deepEqual(getPublicQuizQuestions(course).filter((question) => question.id.startsWith("final-h"))
      .map((question) => question.audioTranscript),
      germanA1FinalListening.map((item) => item.transcript));
    assert.ok(listening.every((question) => !question.prompt.includes("Welche Aussage hören Sie")));
  });

  test("final reading includes weather as well as notices, transport and everyday services", () => {
    const weather = course.quiz.find((question) => question.id === "final-l8");
    assert.match(weather.prompt, /Sonntag regnet es/);
    assert.equal(weather.options.find((option) => option.id === weather.correctOptionId).label,
      "Am Sonntag ab 14 Uhr");
  });

  test("distinguishes short original drills from the full official mock and uses exam timing", () => {
    for (const trackId of ["goethe", "telc"]) {
      const route = course.lessons.filter((lesson) => lesson.examTrack === trackId);
      const orientation = route[0];
      assert.ok(orientation.blocks.some((block) =>
        block.type === "comparison-table" && block.heading === "Offizieller Zeitrahmen"));
      assert.ok(orientation.blocks.some((block) => block.id === `a1-${trackId}-01-gemeinsam` &&
        block.body.includes("gemeinsam entwickeltes Prüfungsformat")));
      const listeningGuidance = route[1].blocks.find((block) =>
        block.id === `a1-${trackId}-02-strategie`);
      assert.ok(listeningGuidance?.paragraphs.some((line) =>
        line.includes("einzigen Clip") && line.includes("Teil 2")));
      const speaking = route[4].blocks.filter((block) => block.type === "speaking-practice");
      assert.equal(speaking.length, 3);
      assert.ok(speaking.every((block) => block.preparationSeconds === 0));
      const mock = route[5];
      assert.ok(mock.blocks.some((block) => block.type === "text" &&
        block.paragraphs.some((line) => line.includes("keine vollständige"))));
      assert.ok(mock.blocks.some((block) => block.type === "resources" &&
        block.items.some((item) => item.url === germanA1ExamTracks[trackId].officialPracticeUrl)));
      const routine = mock.blocks.find((block) => block.id === `a1-${trackId}-06-antwortbogen-routine`);
      assert.equal(routine?.type, "process");
      assert.equal(routine.items.length, 3);
      assert.ok(routine.items.some((item) => item.body.includes("Antwortbogen")));
      assert.ok(routine.items.some((item) => item.body.includes("Lehrperson")));
      assert.ok(mock.blocks.filter((block) => block.type === "speaking-practice")
        .every((block) => block.preparationSeconds === 0));
    }
  });

  test("oral exam routes add partner turn-taking beyond solo recordings", () => {
    const cardSets = [];
    for (const trackId of ["goethe", "telc"]) {
      const speaking = course.lessons.find((lesson) =>
        lesson.examTrack === trackId && lesson.title.includes("Sprechen"));
      const guidance = speaking.blocks.find((block) => block.id === `a1-${trackId}-05-sprechen-hinweis`);
      const cards = speaking.blocks.find((block) => block.id === `a1-${trackId}-05-partnerkarten`);
      assert.match(guidance.body, /ersetzt aber kein Gespräch/);
      assert.equal(cards.type, "tabs");
      assert.equal(cards.items.length, 3);
      assert.ok(cards.items.every((item) => item.body.includes("Tauschen Sie danach die Rollen.")));
      cardSets.push(cards.items.map((item) => item.body));
    }
    assert.notDeepEqual(cardSets[0], cardSets[1]);
  });

  test("each exam route ends with an honest four-skill review and official next step", () => {
    for (const trackId of ["goethe", "telc"]) {
      const review = course.lessons.find((lesson) => lesson.slug === `a1-${trackId}-07`);
      const rubric = review.blocks.find((block) => block.id === `a1-${trackId}-07-fertigkeiten-rueckblick`);
      const readiness = review.blocks.find((block) => block.id === `a1-${trackId}-07-bereitschaft`);
      assert.equal(rubric.type, "comparison-table");
      assert.deepEqual(rubric.rows.map((row) => row[0]),
        ["Hören", "Lesen", "Schreiben", "Sprechen"]);
      assert.match(rubric.rows[2].join(" "), /Keine automatische Note/);
      assert.match(rubric.rows[3].join(" "), /Keine automatische Note/);
      assert.match(readiness.body, /keine verlässliche Prognose/);
      assert.ok(review.blocks.some((block) => block.type === "resources" &&
        block.items.some((item) => item.url === germanA1ExamTracks[trackId].officialPracticeUrl)));
    }
  });

  test("both exam routes rehearse the real A1 listening and reading task families", () => {
    for (const trackId of ["goethe", "telc"]) {
      const route = course.lessons.filter((lesson) => lesson.examTrack === trackId);
      const listening = route[1];
      const reading = route[2];
      const bySuffix = (lesson, suffix) => lesson.blocks.find((block) => block.id.endsWith(suffix));
      assert.equal(bySuffix(listening, "-h1")?.question.options.length, 3);
      assert.deepEqual(bySuffix(listening, "-h2")?.question.options.map((option) => option.label), ["Richtig", "Falsch"]);
      assert.equal(bySuffix(listening, "-h3")?.question.options.length, 3);
      assert.deepEqual(bySuffix(reading, "-lcheck1")?.question.options.map((option) => option.label), ["Richtig", "Falsch"]);
      assert.equal(bySuffix(reading, "-lcheck2")?.question.options.length, 2);
      assert.deepEqual(bySuffix(reading, "-lcheck3")?.question.options.map((option) => option.label), ["Richtig", "Falsch"]);
      assert.match(JSON.stringify(reading.blocks), /Anzeige A/);
      assert.match(JSON.stringify(reading.blocks), /Anzeige B/);
      assert.ok(route.filter((lesson) => lesson.blocks.some((block) => block.type === "audio"))
        .every((lesson) => lesson.blocks.find((block) => block.type === "audio").caption.includes("KI-generiert")));
    }
  });

  test("each route has an original timed mini-mock across all four skills", () => {
    for (const trackId of ["goethe", "telc"]) {
      const mock = course.lessons.find((lesson) => lesson.examTrack === trackId && lesson.title.includes("Modelltraining"));
      assert.ok(mock);
      assert.ok(mock.blocks.some((block) => block.id.endsWith("-mini-timer") && block.body.includes("Timer")));
      assert.equal(mock.blocks.filter((block) => block.id.includes("-mini-h") && block.type === "knowledge-check").length, 3);
      assert.equal(mock.blocks.filter((block) => block.id.includes("-mini-l") && block.type === "knowledge-check").length, 3);
      assert.equal(mock.blocks.filter((block) => block.id.includes("-mini-w") && block.type === "writing-practice").length, 2);
      assert.equal(mock.blocks.filter((block) => block.id.includes("-mini-s") && block.type === "speaking-practice").length, 3);
      assert.ok(mock.blocks.some((block) => block.type === "resources" &&
        block.items.some((item) => item.url === germanA1ExamTracks[trackId].officialPracticeUrl)));
      assert.ok(mock.blocks.filter((block) => block.type === "speaking-practice")
        .every((block) => block.preparationSeconds === 0));
    }
  });

  test("mini-mock listening uses fresh, route-specific material", () => {
    const mockUrls = new Set();
    for (const trackId of ["goethe", "telc"]) {
      const route = course.lessons.filter((lesson) => lesson.examTrack === trackId);
      const practiceAudio = route[1].blocks.find((block) => block.type === "audio");
      const mockAudio = route[5].blocks.find((block) => block.id === `a1-${trackId}-06-mini-audio`);
      assert.equal(mockAudio?.type, "audio");
      assert.notEqual(mockAudio.url, practiceAudio?.url);
      assert.notEqual(mockAudio.transcript, practiceAudio?.transcript);
      assert.match(mockAudio.transcript, /Ansage eins:.*Telefonnotiz:.*Gespräch:/s);
      mockUrls.add(mockAudio.url);
      for (const part of [1, 2, 3])
        assert.ok(route[5].blocks.some((block) => block.id === `a1-${trackId}-06-mini-h${part}` && block.required));
    }
    assert.equal(mockUrls.size, 2);
  });

  test("unlocks one exam route only after all core chapters and the final check", () => {
    const coreDone = {
      ...emptyAcademyProgress,
      completedLessonIds: core.map((lesson) => lesson.id),
    };
    assert.equal(getAcademyRequiredLessons(course, coreDone).length, 15);
    assert.ok(getAcademyResumeHref(coreDone, course).endsWith("/quiz"));
    const passed = { ...coreDone, passedQuizRevision: course.quizRevision };
    assert.ok(getAcademyResumeHref(passed, course).endsWith("/choose-exam"));
    assert.equal(isAcademyCourseComplete(passed, course), false);
    const selected = { ...passed, selectedExamTrack: "telc" };
    assert.equal(getAcademyRequiredLessons(course, selected).length, 22);
    assert.ok(getAcademyResumeHref(selected, course).endsWith("/lessons/a1-telc-01"));
    assert.equal(isAcademyCourseComplete(selected, course), false);
    const telcFirst = course.lessons.findIndex((lesson) => lesson.slug === "a1-telc-01");
    const telcSecond = course.lessons.findIndex((lesson) => lesson.slug === "a1-telc-02");
    const goetheFirst = course.lessons.findIndex((lesson) => lesson.slug === "a1-goethe-01");
    assert.equal(getAcademyJourneyLessonState(course, selected, telcFirst).locked, false);
    assert.equal(getAcademyJourneyLessonState(course, selected, telcSecond).locked, true);
    assert.equal(getAcademyJourneyLessonState(course, selected, goetheFirst).locked, true);
    const orientationDone = { ...selected, completedLessonIds: [...core.map((lesson) => lesson.id), course.lessons[telcFirst].id] };
    assert.equal(getAcademyJourneyLessonState(course, orientationDone, telcSecond).locked, false);
  });
});
