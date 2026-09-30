import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { validateAcademyCourse } from "../lib/academy-course-validation.ts";
import { germanA1Course } from "../lib/german-a1-course.ts";
import { germanA1Curriculum, germanA1ExamTracks } from "../lib/german-a1-curriculum.ts";
import { germanA1RestructuredCourse } from "../lib/german-a1-restructured-course.ts";

const course = germanA1RestructuredCourse;
const sharedLessons = course.lessons.filter((lesson) => !lesson.examTrack);
const skillBlocks = {
  hoeren: (blocks) => blocks.some((block) => block.type === "audio" && block.transcript?.trim()),
  lesen: (blocks) => blocks.some((block) => block.type === "text" && block.heading === "Lesen"),
  schreiben: (blocks) => blocks.some((block) => block.type === "writing-practice"),
  sprechen: (blocks) => blocks.some((block) => block.type === "speaking-practice"),
};
const failures = [];
const validation = validateAcademyCourse(course);
if (!validation.valid) failures.push(...validation.errors);
if (sharedLessons.length !== germanA1Curriculum.length)
  failures.push(`Expected ${germanA1Curriculum.length} shared chapters; found ${sharedLessons.length}.`);

const sharedChapters = germanA1Curriculum.map((chapter, index) => {
  const lesson = sharedLessons[index];
  const expectedTitle = `${chapter.number}. ${chapter.title}`;
  if (!lesson || lesson.title !== expectedTitle)
    failures.push(`Chapter ${chapter.number} should be ${expectedTitle}; found ${lesson?.title || "none"}.`);
  const skills = Object.fromEntries(Object.entries(skillBlocks).map(([name, hasSkill]) =>
    [name, Boolean(lesson && hasSkill(lesson.blocks))]));
  for (const [name, present] of Object.entries(skills))
    if (!present) failures.push(`Chapter ${chapter.number} is missing ${name} practice.`);
  return {
    chapter: chapter.number,
    title: lesson?.title || null,
    sourceLessons: [
      ...chapter.legacyChapters.map((number) => `lesson-de-a1-${String(number).padStart(2, "0")}`),
      ...(chapter.legacyReviews || []).map((slug) => `lesson-de-a1-${slug}`),
    ],
    skills,
    minutes: lesson?.durationMinutes || 0,
    picturedCards: lesson?.blocks.filter((block) => block.type === "flashcards")
      .reduce((total, block) => total + block.items.length, 0) || 0,
  };
});

const examRoutes = Object.fromEntries(Object.keys(germanA1ExamTracks).map((trackId) => {
  const lessons = course.lessons.filter((lesson) => lesson.examTrack === trackId);
  if (lessons.length !== germanA1ExamTracks[trackId].stages.length)
    failures.push(`${trackId} route has ${lessons.length} stages; expected ${germanA1ExamTracks[trackId].stages.length}.`);
  return [trackId, { stages: lessons.length, minutes: lessons.reduce((total, lesson) => total + lesson.durationMinutes, 0) }];
}));

const cards = sharedLessons.flatMap((lesson) => lesson.blocks
  .filter((block) => block.type === "flashcards")
  .flatMap((block) => block.items));
const uniqueVocabulary = new Set(cards.map((card) => card.title)).size;
if (uniqueVocabulary < 620 || uniqueVocabulary > 800)
  failures.push(`Pictured vocabulary has ${uniqueVocabulary} unique entries; expected 620–800.`);

const missingLocalMedia = [];
let audioBlocks = 0;
for (const lesson of course.lessons) {
  for (const block of lesson.blocks) {
    if (block.type === "audio") {
      audioBlocks += 1;
      if (!block.transcript?.trim())
        failures.push(`${lesson.id}: audio block ${block.id} has no transcript.`);
      if (!block.url?.trim())
        failures.push(`${lesson.id}: audio block ${block.id} has no recording URL.`);
    }
    const urls = block.type === "flashcards"
      ? block.items.map((item) => item.src)
      : block.type === "image" ? [block.src]
        : block.type === "audio" ? [block.url] : [];
    for (const url of urls) {
      if (!url?.startsWith("/")) continue;
      if (url.includes("?")) failures.push(`${lesson.id}: local media URL has an unsupported query string: ${url}`);
      if (!existsSync(resolve(import.meta.dirname, "..", "public", url.slice(1).split("?")[0])))
        missingLocalMedia.push({ lessonId: lesson.id, url });
    }
  }
}
const finalListening = course.quiz.filter((question) => question.audioUrl);
for (const question of finalListening) {
  if (!question.audioTranscript?.trim())
    failures.push(`${question.id}: listening question has no transcript.`);
  if (question.audioUrl.startsWith("/") &&
    !existsSync(resolve(import.meta.dirname, "..", "public", question.audioUrl.slice(1))))
    missingLocalMedia.push({ questionId: question.id, url: question.audioUrl });
}
if (missingLocalMedia.length)
  failures.push(`${missingLocalMedia.length} local image or audio assets are missing.`);

const report = {
  courseKey: course.key,
  legacySourceLessons: germanA1Course.lessons.length,
  draftLessons: course.lessons.length,
  sharedChapters,
  examRoutes,
  uniquePicturedVocabulary: uniqueVocabulary,
  audioBlocks,
  finalListeningQuestions: finalListening.length,
  missingLocalMedia,
  academyValidation: validation.valid,
  failures,
};
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
