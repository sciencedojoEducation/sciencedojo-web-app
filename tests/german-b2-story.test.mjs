import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { germanB2StoryCourse as course, germanB2StoryEpisodes as episodes } from "../lib/german-b2-story.ts";
import { validateAcademyCourse } from "../lib/academy-course-validation.ts";

test("B2 pilot is a valid independent course with three complete episodes", () => {
  assert.deepEqual(validateAcademyCourse(course).errors, []);
  assert.equal(course.lessons.length, 3);
  assert.equal(course.rules.requireFinalAssessment, false);
  assert.equal(course.estimatedMinutes, course.lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0));
  assert.equal(new Set(course.lessons.map(lesson => lesson.slug)).size, 3);
  for (const lesson of course.lessons) {
    assert.equal(lesson.blocks.filter(block => block.type === "knowledge-check").length, 4);
    assert.equal(lesson.blocks.find(block => block.type === "flashcards").items.length, 8);
    assert.ok(lesson.blocks.some(block => block.type === "writing-practice" && block.modelAnswer.split(/\s+/u).length >= block.minWords));
    assert.ok(lesson.blocks.some(block => block.type === "speaking-practice" && block.targetSeconds === 120));
    for (const block of lesson.blocks) {
      assert.equal(block.curriculum.cefr, "B2");
      if (block.type === "knowledge-check") {
        assert.ok(block.question.options.some(option => option.id === block.question.correctOptionId));
        assert.ok(block.question.explanation.length > 30);
      }
    }
  }
});

test("each playable audio asset and its transcript correspond to the original dialogue", () => {
  for (const [index, lesson] of course.lessons.entries()) {
    const audio = lesson.blocks.find(block => block.type === "audio");
    assert.match(audio.url, /\/german-b2-story\/gemini-v1\/episode-\d\.m4a$/);
    const file = new URL(`../public${audio.url}`, import.meta.url);
    assert.ok(statSync(file).size > 10000);
    assert.match(readFileSync(file).subarray(0, 32).toString("ascii"), /ftyp/);
    assert.equal(audio.transcript, episodes[index].dialogue.map(turn => `${turn.speaker}: ${turn.text}`).join("\n\n"));
    assert.deepEqual(new Set(episodes[index].dialogue.map(turn => turn.speaker)), new Set(["Mira", "Jonas", "Leyla"]));
  }
});

test("all course recordings are Gemini assets with matching source and verification hashes", () => {
  const digest = value => createHash("sha256").update(value).digest("hex");
  const checks = JSON.parse(readFileSync(new URL("../docs/german-b2-story-audio-verification/local-checks.json", import.meta.url), "utf8"));
  assert.equal(checks.length, 3);
  for (const [index, lesson] of course.lessons.entries()) {
    const audio = lesson.blocks.find(block => block.type === "audio");
    const file = new URL(`../public${audio.url}`, import.meta.url);
    const metadata = JSON.parse(readFileSync(`${file.pathname}.json`, "utf8"));
    const audit = JSON.parse(readFileSync(new URL(`../docs/german-b2-story-audio-verification/episode-${index + 1}.json`, import.meta.url), "utf8"));
    const actualHash = digest(readFileSync(file));
    assert.equal(metadata.provider, "Google Gemini");
    assert.equal(metadata.model, "gemini-3.8-flash-tts");
    assert.equal(metadata.episode, index + 1);
    assert.equal(metadata.transcriptSha256, digest(audio.transcript));
    assert.equal(metadata.sha256, actualHash);
    assert.equal(audit.sha256, actualHash);
    assert.ok(audit.wordErrorRate <= 0.1);
    const check = checks.find(item => item.episode === index + 1);
    assert.equal(check.sha256, actualHash);
    assert.ok(Math.abs(check.seconds - metadata.seconds) < 0.2);
    assert.equal(check.clippedSamples, 0);
    assert.ok(metadata.wpm >= 100 && metadata.wpm <= 190);
    assert.equal(new Set(Object.values(metadata.voices)).size, 3);
  }
});

test("story comprehension preserves the distinction between willingness and approval", () => {
  const lastEpisode = course.lessons[2];
  const check = lastEpisode.blocks.find(block => block.type === "knowledge-check");
  const answer = check.question.options.find(option => option.id === check.question.correctOptionId);
  assert.match(answer.label, /Bedingungen/);
  assert.match(lastEpisode.blocks.find(block => block.type === "writing-practice").modelAnswer, /endgültige Genehmigung liegt deshalb noch nicht vor/);
});

test("Gemini generation can be planned without credentials and scoped to one episode", () => {
  const script = new URL("../scripts/generate-german-b2-story-audio.mjs", import.meta.url);
  const result = spawnSync(process.execPath, ["--experimental-strip-types", script.pathname, "--dry-run", "--episode=2"], {
    encoding: "utf8", env: { PATH: process.env.PATH },
  });
  assert.equal(result.status, 0, result.stderr);
  const plan = JSON.parse(result.stdout.trim());
  assert.equal(plan.episode, 2);
  assert.equal(plan.provider, "Google Gemini");
  assert.equal(plan.model, "gemini-3.8-flash-tts");
  assert.equal(plan.turns, episodes[1].dialogue.length);
  assert.equal(new Set(Object.values(plan.voices)).size, 3);
  assert.ok(plan.requests > 1, "Three speakers require multiple two-voice requests.");
});
