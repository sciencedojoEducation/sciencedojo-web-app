import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { germanB1Course } from "../lib/german-b1-course.ts";
import { styleGermanB1Course, b1ChapterScenes } from "../lib/german-b1-visual-design.ts";

test("B1 cover and every lesson have instructional imagery, not generic placeholder assets", () => {
  assert.equal(germanB1Course.theme.coverStyle, "full-image");
  assert.match(germanB1Course.heroImage, /german-b1\/hero-v1\.png$/);
  assert.equal(b1ChapterScenes.length, 16);
  const sources = new Set([germanB1Course.heroImage]);
  for (const lesson of germanB1Course.lessons) {
    const image = lesson.blocks.find((block) => block.type === "image");
    assert.ok(image, lesson.title);
    assert.ok(image.alt.length > 35 && image.caption.includes("Bildimpuls"));
    assert.equal(image.decorative, undefined);
    assert.equal(image.curriculum.cefr, "B1");
    sources.add(image.src);
    if (lesson.examTrack) assert.match(image.caption, /kein offizielles Prüfungsbild/);
    else assert.ok(new Set(lesson.blocks.map((block) => block.appearance?.background?.color).filter(Boolean)).size >= 5);
  }
  assert.equal(sources.size, 17);
  for (const source of sources) {
    const path = resolve(import.meta.dirname, "../public", source.slice(1));
    assert.ok(existsSync(path), source);
    const bytes = readFileSync(path);
    assert.equal(bytes.toString("hex", 0, 8), "89504e470d0a1a0a");
    assert.ok(bytes.readUInt32BE(16) >= 1200);
    assert.ok(bytes.readUInt32BE(16) / bytes.readUInt32BE(20) >= 1.7);
  }
});

test("visual updates preserve authored teaching content, assessments, IDs and explicit appearance choices", () => {
  assert.deepEqual(styleGermanB1Course(germanB1Course), germanB1Course);
  const original = structuredClone(germanB1Course);
  original.lessons[0].blocks = original.lessons[0].blocks.filter((block) => block.type !== "image");
  original.lessons[0].blocks[0].appearance.background = { kind: "custom", color: "#123456" };
  const styled = styleGermanB1Course(original);
  assert.deepEqual(styled.quiz, original.quiz);
  assert.deepEqual(styled.rules, original.rules);
  assert.deepEqual(styled.examTracks, original.examTracks);
  assert.deepEqual(styled.lessons[0].blocks.slice(1), original.lessons[0].blocks);
  assert.equal(styled.lessons[0].blocks[1].appearance.background.color, "#123456");
  for (let index = 1; index < original.lessons.length; index++) assert.deepEqual(styled.lessons[index], original.lessons[index]);
});
