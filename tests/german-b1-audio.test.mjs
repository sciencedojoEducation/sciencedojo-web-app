import assert from "node:assert/strict";
import { test } from "node:test";
import { b1AudioRecordings, b1AudioTranscript, b1AudioUrl } from "../lib/german-b1-audio.ts";
import { germanB1Course } from "../lib/german-b1-course.ts";

test("B1 voice manifest preserves all course and assessment listening evidence", () => {
  assert.equal(b1AudioRecordings.length, 24);
  const manifest = new Map(b1AudioRecordings.map(recording => [recording.id, b1AudioTranscript(recording)]));
  assert.equal(manifest.size, 24);
  const normalize = text => text.replace(/\s+/g, " ").trim();
  for (const target of [
    ...germanB1Course.lessons.flatMap(lesson => lesson.blocks).filter(block => block.type === "audio").map(block => ({url:block.url,transcript:block.transcript})),
    ...germanB1Course.quiz.filter(question => question.audioUrl).map(question => ({url:question.audioUrl,transcript:question.audioTranscript})),
  ]) {
    const id = target.url.split("/").at(-1).replace(/(?:-natural-v1)?\.m4a$/, "");
    assert.equal(normalize(target.transcript), normalize(manifest.get(id)), id);
    assert.notEqual(b1AudioUrl(id), `/audio/german-b1/${id}.m4a`);
  }
});
