import assert from "node:assert/strict";
import { test } from "node:test";
import { germanA1FullMockListening, germanA1FullMockReading, germanA1FullMockBlocks, germanA1FullMockAudioManifest } from "../lib/german-a1-full-mock.ts";
import { germanA1Pronunciation, germanA1PronunciationManifest } from "../lib/german-a1-pronunciation.ts";
import { germanA1SpeakerProfiles } from "../lib/german-a1-audio.ts";
import { isAcademyBlockRequiredForCompletion } from "../lib/tutor-academy.ts";
import { buildGermanA1ListeningUpgrade } from "../lib/german-a1-listening-upgrade.ts";
import { germanA1RestructuredCourse } from "../lib/german-a1-restructured-course.ts";
import { validateAcademyCourse } from "../lib/academy-course-validation.ts";
import { existsSync } from "node:fs";
import { checkA1ListeningReadiness, germanA1ListeningUpgradeManifest } from "../lib/german-a1-listening-readiness.ts";

test("full original mock has the adult Goethe-style listening and reading part sizes", () => {
  assert.equal(germanA1FullMockListening.length, 15);
  assert.deepEqual(germanA1FullMockListening.map(task => task.options.length), [3,3,3,3,3,3,2,2,2,2,3,3,3,3,3]);
  assert.equal(germanA1FullMockReading.length, 15);
  const blocks = germanA1FullMockBlocks();
  assert.equal(blocks.filter(block => block.type === "audio").length, 15);
  assert.equal(blocks.filter(block => block.type === "knowledge-check").length, 30);
  assert.equal(blocks.filter(block => block.type === "writing-practice").length, 2);
  assert.equal(blocks.filter(block => block.type === "speaking-practice").length, 3);
  assert.equal(new Set(blocks.map(block => block.id)).size, blocks.length);
  for (const family of ["hoeren", "lesen"]) for (const part of [1,2,3])
    assert.ok(blocks.some(block => block.id === `a1-goethe-full-${family}-teil-${part}`));
  assert.match(blocks.find(block => block.id === "a1-goethe-full-hoeren-teil-2").label, /einmal hören/);
  for (const block of blocks) assert.equal(isAcademyBlockRequiredForCompletion(block), false);
});
test("every objective answer is valid and productive models fit their word targets", () => {
  for (const task of [...germanA1FullMockListening, ...germanA1FullMockReading]) {
    assert.ok(task.correct >= 0 && task.correct < task.options.length);
    assert.ok(task.explanation.length > 15);
  }
  for (const block of germanA1FullMockBlocks().filter(block => block.type === "writing-practice")) {
    const words = block.modelAnswer.trim().split(/\s+/).length;
    assert.ok(words >= block.minWords && words <= block.maxWords, block.id);
  }
  assert.match(germanA1FullMockBlocks().at(-1).paragraphs.join(" "), /keine offizielle Goethe-Punktzahl/);
});
test("pronunciation revisits all chapters; manifests use unique paths and supported speakers", () => {
  assert.deepEqual(germanA1Pronunciation.map(item => item.chapter), Array.from({length:15}, (_,i) => i+1));
  const manifest = [...germanA1PronunciationManifest, ...germanA1FullMockAudioManifest];
  assert.equal(new Set(manifest.map(item => item.outputPath)).size, 30);
  for (const track of manifest) for (const line of track.transcript.split("\n")) {
    const speaker = line.split(":")[0];
    assert.ok(germanA1SpeakerProfiles[speaker], speaker);
    assert.ok(line.slice(speaker.length + 1).trim());
  }
});

test("prepared listening candidate validates and preserves original content and gates", () => {
  const candidate = buildGermanA1ListeningUpgrade(germanA1RestructuredCourse);
  const validation = validateAcademyCourse(candidate);
  assert.equal(validation.valid, true, validation.errors.join("\n"));
  assert.deepEqual(buildGermanA1ListeningUpgrade(candidate), candidate);
  for (const [index, original] of germanA1RestructuredCourse.lessons.entries()) {
    const updated = candidate.lessons[index];
    const ids = new Set(original.blocks.map(block => block.id));
    assert.deepEqual(updated.blocks.filter(block => ids.has(block.id)), original.blocks);
    assert.deepEqual(updated.blocks.filter(isAcademyBlockRequiredForCompletion), original.blocks.filter(isAcademyBlockRequiredForCompletion));
  }
  const gallery = candidate.lessons.find(lesson => lesson.slug === "a1-goethe-06").blocks.find(block => block.id === "a1-goethe-full-picture-cards");
  for (const item of gallery.items) assert.ok(existsSync(`public${item.src}`), item.src);
  assert.equal(germanA1RestructuredCourse.lessons.some(lesson => lesson.blocks.some(block => block.id === "a1-goethe-full-intro")), false, "Incomplete audio must not enter the default course source");
});

test("audio readiness rejects missing, empty, oversized and non-M4A files", () => {
  const valid = new Uint8Array(2048);
  valid.set(new TextEncoder().encode("ftypM4A "), 4);
  const missing = checkA1ListeningReadiness(() => null);
  assert.equal(missing.ready, false);
  assert.equal(missing.missing.length, 30);
  assert.equal(checkA1ListeningReadiness(() => valid).ready, true);
  for (const invalid of [new Uint8Array(), new Uint8Array(2048), new Uint8Array(10 * 1024 * 1024 + 1)]) {
    const result = checkA1ListeningReadiness(() => invalid);
    assert.equal(result.ready, false);
    assert.equal(result.invalid.length, 30);
  }
  const partial = checkA1ListeningReadiness(url => url === germanA1ListeningUpgradeManifest[0].outputPath ? valid : null);
  assert.equal(partial.available, 1);
  assert.equal(partial.missing.length, 29);
});

test("chapter mapping follows stable lesson IDs and refuses partial installations", () => {
  const reordered = structuredClone(germanA1RestructuredCourse);
  reordered.lessons.reverse();
  const enriched = buildGermanA1ListeningUpgrade(reordered);
  for (const lesson of enriched.lessons.filter(item => !item.examTrack)) {
    const number = Number(lesson.id.match(/(\d{2})$/)[1]);
    assert.ok(lesson.blocks.some(block => block.id === `a1-sounds-${String(number).padStart(2,"0")}-audio`));
  }
  const partial = structuredClone(germanA1RestructuredCourse);
  partial.lessons[0].blocks.push({ id: "a1-sounds-01-audio", type: "audio", url: "custom" });
  assert.throws(() => buildGermanA1ListeningUpgrade(partial), /Partial sound upgrade/);
  const partialMock = structuredClone(germanA1RestructuredCourse);
  partialMock.lessons.find(lesson => lesson.slug === "a1-goethe-06").blocks.push({ id: "a1-goethe-full-intro", type: "text" });
  assert.throws(() => buildGermanA1ListeningUpgrade(partialMock), /Partial full mock/);
});
