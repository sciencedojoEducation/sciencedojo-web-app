import assert from "node:assert/strict";
import { test } from "node:test";
import { existsSync } from "node:fs";
import { nicosWegA1Course } from "../lib/nicos-weg-a1-course.ts";
import { validateAcademyCourse } from "../lib/academy-course-validation.ts";
import { academyVideoEmbedUrl, academyVideoSceneError, isAcademyDwVideoUrl } from "../lib/academy-video.ts";

test("course preserves all 12 scenes, 36 exercises, 72 vocabulary entries and original Sinhala notes", () => {
  assert.deepEqual(validateAcademyCourse(nicosWegA1Course).errors, []);
  const scenes = nicosWegA1Course.lessons.slice(0, 12);
  assert.equal(nicosWegA1Course.lessons.length, 13);
  assert.equal(scenes.flatMap((lesson) => lesson.blocks.filter((block) => block.id.includes("-exercise-"))).length, 36);
  assert.equal(scenes.flatMap((lesson) => lesson.blocks.filter((block) => block.type === "flashcards").flatMap((block) => block.items)).length, 72);
  for (const lesson of scenes) {
    const video = lesson.blocks.find((block) => block.type === "video");
    assert.ok(isAcademyDwVideoUrl(video.url));
    assert.equal(video.startSeconds, undefined, "screenshot time is not a playback boundary");
    assert.match(video.transcript, /not a full transcript/);
    const note = lesson.blocks.find((block) => block.id.endsWith("-sinhala"));
    assert.equal(note.aspect, "natural", "Sinhala notes must not be cropped into scene proportions");
    assert.ok(existsSync(new URL(`../public${note.src}`, import.meta.url)));
    assert.ok(lesson.blocks.some((block) => block.type === "speaking-practice" && block.targetSeconds === 30));
  }
});

test("scene playback retains supplied timestamps and uses absolute end seconds", () => {
  const url = new URL(academyVideoEmbedUrl("https://youtu.be/4-eDoThe6qo?t=1m30s&end=150"));
  assert.equal(url.searchParams.get("start"), "90");
  assert.equal(url.searchParams.get("end"), "150");
  const override = new URL(academyVideoEmbedUrl("https://www.youtube.com/watch?v=4-eDoThe6qo&t=90", { startSeconds: 0, endSeconds: 60 }));
  assert.equal(override.searchParams.get("start"), "0");
  assert.equal(override.searchParams.get("end"), "60");
});

test("invalid boundaries and unapproved video providers cannot publish", () => {
  for (const scene of [{ startSeconds: -1 }, { startSeconds: 1.5 }, { endSeconds: NaN }, { startSeconds: 30, endSeconds: 30 }]) assert.ok(academyVideoSceneError(scene));
  assert.equal(academyVideoEmbedUrl("https://youtube.com.evil.test/watch?v=4-eDoThe6qo"), null);
  assert.equal(isAcademyDwVideoUrl("https://hlsvod.dw.com.evil.test/i/Events/mp4/nicosweg/a/master.m3u8"), false);
  assert.equal(academyVideoEmbedUrl("https://vimeo.com/123456", { endSeconds: 30 }), null);
  const course = structuredClone(nicosWegA1Course);
  course.lessons[0].blocks.find((block) => block.type === "video").endSeconds = -1;
  assert.equal(validateAcademyCourse(course).valid, false);
});
