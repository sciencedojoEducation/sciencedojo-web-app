import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { a2AudioRecordings, a2AudioUrl, a2SpeechInstructions } from "../lib/german-a2-audio.ts";
import { germanA2Course } from "../lib/german-a2-course.ts";

test("natural replacement covers every original recording with exactly the same transcript", () => {
  assert.equal(a2AudioRecordings.length,32);
  assert.equal(new Set(a2AudioRecordings.map(recording => recording.id)).size,32);
  const normalize = text => text.replace(/\s+/g," ").trim();
  const manifest = new Map(a2AudioRecordings.map(recording => [recording.id,normalize(recording.segments.map(segment => segment.text).join(" "))]));
  for (const block of germanA2Course.lessons.flatMap(lesson => lesson.blocks).filter(block => block.type === "audio")) {
    const id = block.url.split("/").at(-1).replace(/(?:-natural-v1)?\.m4a$/,"");
    assert.equal(normalize(block.transcript),manifest.get(id),block.id);
  }
  for (const question of germanA2Course.quiz.filter(question => question.audioUrl)) {
    const id = question.audioUrl.split("/").at(-1).replace(/(?:-natural-v1)?\.m4a$/,"");
    assert.equal(normalize(question.audioTranscript),manifest.get(id),question.id);
  }
});
test("replacement URLs are distinct and conversational recordings retain both speakers", () => {
  for (const recording of a2AudioRecordings) {
    assert.match(a2AudioUrl(recording.id),/-natural-v1\.m4a$/);
    if (recording.segments.length > 1) assert.equal(new Set(recording.segments.map(segment => segment.speaker)).size,2);
  }
  assert.match(a2SpeechInstructions,/native Standard German/);
  assert.match(a2SpeechInstructions,/Preserve all dates, times, prices, negatives/);
});

test("all replacement assets match their generation metadata and local decoding checks", () => {
  const root=resolve(import.meta.dirname,"..");
  const checks=new Map(JSON.parse(readFileSync(resolve(root,"docs/german-a2-audio-verification/local-checks.json"),"utf8")).map(check=>[check.id,check]));
  for(const recording of a2AudioRecordings) {
    const path=resolve(root,"public",a2AudioUrl(recording.id).slice(1));
    const bytes=readFileSync(path),metadata=JSON.parse(readFileSync(path+".json","utf8"));
    const hash=createHash("sha256").update(bytes).digest("hex");
    assert.equal(metadata.sha256,hash,recording.id);
    assert.equal(checks.get(recording.id)?.sha256,hash,recording.id);
    assert.match(metadata.model,/^gemini-.*tts/);
    assert.equal(bytes.toString("ascii",4,8),"ftyp");
    assert.ok(metadata.wordsPerMinute>=90 && metadata.wordsPerMinute<=165,recording.id);
    assert.equal(new Set(metadata.speakers).size,new Set(recording.segments.map(segment=>segment.speaker)).size);
  }
});
