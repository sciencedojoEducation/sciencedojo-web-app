import { test } from "node:test";
import assert from "node:assert/strict";
import {
  germanA1Curriculum,
  germanA1DeferredGrammar,
  germanA1ExamTracks,
} from "../lib/german-a1-curriculum.ts";

test("maps the adult A1 core into 15 communicative chapters", () => {
  assert.deepEqual(germanA1Curriculum.map((chapter) => chapter.number),
    Array.from({ length: 15 }, (_, index) => index + 1));
  const sourceNumbers = germanA1Curriculum.flatMap((chapter) => chapter.legacyChapters);
  const deferredNumbers = germanA1DeferredGrammar.map((item) => item.legacyChapter);
  assert.equal(new Set([...sourceNumbers, ...deferredNumbers]).size, 32);
  assert.deepEqual([...sourceNumbers, ...deferredNumbers].sort((a, b) => a - b),
    Array.from({ length: 32 }, (_, index) => index + 1));
  assert.equal(germanA1Curriculum[14].legacyReviews.length, 5);
  for (const chapter of germanA1Curriculum) {
    for (const field of ["outcome", "listeningSituation", "writingTask", "speakingTask", "realLifeChallenge"])
      assert.ok(chapter[field].length > 15, `Chapter ${chapter.number} needs ${field}`);
    assert.ok(chapter.readingText.length > 5, `Chapter ${chapter.number} needs readingText`);
    assert.ok(chapter.vocabulary.length >= 3, `Chapter ${chapter.number} needs vocabulary themes`);
    assert.ok(chapter.grammarInContext.length >= 1, `Chapter ${chapter.number} needs grammar in context`);
  }
});

test("both exam routes specify all four skill parts and official practice", () => {
  for (const track of Object.values(germanA1ExamTracks)) {
    assert.equal(new URL(track.officialPracticeUrl).protocol, "https:");
    assert.equal(track.stages.length, 7);
    assert.deepEqual(Object.keys(track.parts).sort(), ["hoeren", "lesen", "schreiben", "sprechen"]);
    assert.equal(track.parts.hoeren.length, 3);
    assert.equal(track.parts.lesen.length, 3);
    assert.equal(track.parts.schreiben.length, 2);
    assert.equal(track.parts.sprechen.length, 3);
  }
});
