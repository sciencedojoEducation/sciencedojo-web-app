import assert from "node:assert/strict";
import { test } from "node:test";
import { germanA2Course } from "../lib/german-a2-course.ts";
import { enrichGermanA2Course, a2CalendarTasks, a2TopicCards } from "../lib/german-a2-resource-enrichment.ts";
import { validateAcademyCourse } from "../lib/academy-course-validation.ts";

test("resource enrichment is valid and repeat runs preserve duration and author changes", () => {
  const edited = structuredClone(germanA2Course);
  const audio = edited.lessons[0].blocks.find(block => block.type === "audio");
  audio.url = "https://example.com/author-audio.m4a";
  edited.lessons[0].blocks.find(block => block.type === "text").paragraphs = ["Author's personal introduction."];
  assert.deepEqual(enrichGermanA2Course(edited), edited);
  assert.deepEqual(validateAcademyCourse(edited).errors, []);
});

test("all core topics have four keyword cues, spontaneous followups and delayed recall", () => {
  assert.equal(a2TopicCards.length, 16);
  for (let i = 0; i < 16; i++) {
    const card = a2TopicCards[i]; const lesson = germanA2Course.lessons[i];
    assert.equal(card.points.length, 4);
    const speaking = lesson.blocks.find(block => block.id === `${lesson.slug}-resource-monologue`);
    assert.ok(speaking.prompt.includes(card.followup));
    assert.ok(speaking.modelAnswer.includes(card.reply));
    assert.equal(speaking.completion, "interact");
    assert.ok(lesson.blocks.some(block => block.id === `${lesson.slug}-resource-recall`));
  }
});

test("calendar solutions provide enough time inside both windows and reject false starts", () => {
  for (const task of a2CalendarTasks) {
    const fits = (windows,start) => windows.some(([from,to]) => start >= from && start + task.duration <= to);
    assert.ok(fits(task.a,task.start) && fits(task.b,task.start), task.id);
    for (const start of [task.a[0][0],task.b[0][0]]) assert.ok(!(fits(task.a,start) && fits(task.b,start)), task.id);
    const lesson = germanA2Course.lessons.find(lesson => lesson.slug === task.lessonSlug);
    const cards = lesson.blocks.find(block => block.id === `a2-resource-calendar-${task.id}-cards`);
    assert.equal(cards.items.length, 2);
    const speaking = lesson.blocks.find(block => block.id === `a2-resource-calendar-${task.id}-speak`);
    if (lesson.examTrack) assert.equal(speaking.preparationSeconds, 0);
  }
  assert.notDeepEqual(a2CalendarTasks[3].a,a2CalendarTasks[4].a);
  assert.notEqual(a2CalendarTasks[3].purpose,a2CalendarTasks[4].purpose);
});

test("added Goethe writing meets the three points and word limits without leaking into telc", () => {
  const lesson = germanA2Course.lessons.find(lesson => lesson.slug === "de-a2-goethe-06");
  for (const id of ["a2-resource-writing-sms","a2-resource-writing-email"]) {
    const block = lesson.blocks.find(block => block.id === id);
    const words = block.modelAnswer.split(/\s+/).length;
    assert.ok(words >= block.minWords && words <= block.maxWords);
    assert.equal(block.curriculum.examTrack, "goethe");
  }
  assert.ok(germanA2Course.lessons.filter(lesson => lesson.examTrack === "telc")
    .every(lesson => lesson.blocks.every(block => !block.id.startsWith("a2-resource-writing-"))));
});
