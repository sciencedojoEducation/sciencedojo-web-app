import assert from "node:assert/strict";
import { test } from "node:test";
import { germanB1Course } from "../lib/german-b1-course.ts";
import { b1GrammarLabs } from "../lib/german-b1-grammar-labs.ts";
import { b1ResourceBlocks, upgradeGermanB1Resources } from "../lib/german-b1-resource-upgrade.ts";
import { b1FreshReading, b1FreshListening, b1FreshLanguage, b1FreshLetter } from "../lib/german-b1-fresh-exam.ts";
import { germanB1Chapters } from "../lib/german-b1-curriculum.ts";
import { b1ExamReading, b1ExamListening } from "../lib/german-b1-exam-practice.ts";

test("every chapter has decisions, meaningful feedback, repair, personal transfer and retrieval", () => {
  assert.equal(b1GrammarLabs.length, 16);
  assert.equal(b1GrammarLabs.flatMap(lab => lab.questions).length, 64);
  for (const [i, lesson] of germanB1Course.lessons.filter(l => !l.examTrack).entries()) {
    const additions = lesson.blocks.filter(b => b.id.startsWith(`${lesson.slug}-resource-`));
    assert.equal(additions.length, 7);
    assert.equal(additions.filter(b => b.type === "knowledge-check").length, 4);
    assert.ok(additions.every(b => b.curriculum.cefr === "B1" && b.curriculum.grammar.length));
    const table = additions.find(b => b.type === "comparison-table");
    assert.equal(table.rows.length, 3);
    const repair = additions.find(b => b.type === "writing-practice");
    assert.match(repair.prompt, /zwei bis vier eigene Sätze/);
    assert.equal(repair.modelAnswer, b1GrammarLabs[i].model);
    assert.ok(additions.some(b => b.type === "flashcards"));
  }
  const focus = b1GrammarLabs.flatMap(lab => lab.focus).join(" ");
  for (const topic of ["Negation", "n-Deklination", "Passiv Präsens/Präteritum", "Doppelkonnektoren", "Partizip I", "je … desto", "Adjektivdeklination"]) assert.ok(focus.includes(topic), topic);
});

test("fresh receptive evidence differs from core and old exam material; providers stay distinct", () => {
  const knownTexts = new Set([...germanB1Chapters.flatMap(c => [c.reading, c.listening]), ...Object.values(b1ExamReading), ...b1ExamListening.flatMap(r => r.segments.map(s => s.text))]);
  for (const text of [...Object.values(b1FreshReading), ...b1FreshListening.flatMap(r => r.segments.map(s => s.text))]) assert.ok(!knownTexts.has(text));
  const goethe = germanB1Course.lessons.find(l => l.slug === "de-b1-goethe-07");
  const telc = germanB1Course.lessons.find(l => l.slug === "de-b1-telc-08");
  for (const lesson of [goethe, telc]) {
    const fresh = lesson.blocks.filter(b => b.id.startsWith(`${lesson.slug}-resource-`));
    assert.equal(fresh.filter(b => b.type === "audio").length, 4);
    assert.equal(fresh.filter(b => b.type === "speaking-practice").length, 3);
    assert.match(fresh.find(b => b.id.endsWith("fresh-guide")).body, /verkürztes.*keine vollständige/s);
    assert.ok(fresh.every(b => b.curriculum.examTrack === lesson.examTrack));
  }
  assert.equal(goethe.blocks.filter(b => b.id.startsWith(`${goethe.slug}-resource-write-`)).length, 3);
  assert.equal(telc.blocks.filter(b => b.id.startsWith(`${telc.slug}-resource-write-`)).length, 1);
  assert.ok(!goethe.blocks.some(b => b.id.endsWith("resource-letter")));
  assert.equal(b1FreshLanguage.length, 6);
  assert.equal((b1FreshLetter.match(/\[\d\]/g) || []).length, 6);
  assert.ok(germanB1Course.lessons.find(l => l.slug === "de-b1-goethe-09").blocks.some(b => b.id.endsWith("resource-book-plan")));
  assert.ok(!germanB1Course.lessons.filter(l => l.examTrack === "telc").some(l => l.blocks.some(b => b.id.endsWith("resource-book-plan"))));
});

test("resource upgrade is additive, preserves draft edits and progress identities, and is idempotent", () => {
  const base = structuredClone(germanB1Course);
  for (const lesson of base.lessons) lesson.blocks = lesson.blocks.filter(b => !b.id.startsWith(`${lesson.slug}-resource-`));
  const custom = base.lessons[0].blocks.find(b => b.type === "text");
  custom.paragraphs.push("An authored draft addition.");
  const before = structuredClone(base);
  const result = upgradeGermanB1Resources(base);
  for (const [i, lesson] of result.lessons.entries()) {
    assert.equal(lesson.id, before.lessons[i].id);
    assert.equal(lesson.slug, before.lessons[i].slug);
    assert.deepEqual(lesson.blocks.filter(b => !b.id.startsWith(`${lesson.slug}-resource-`)), before.lessons[i].blocks);
    assert.equal(b1ResourceBlocks(lesson).length, lesson.blocks.filter(b => b.id.startsWith(`${lesson.slug}-resource-`)).length);
  }
  assert.deepEqual(result.quiz, before.quiz);
  assert.equal(result.quizRevision, before.quizRevision);
  assert.deepEqual(result.rules, before.rules);
  assert.equal(result.heroImage, before.heroImage);
  assert.deepEqual(upgradeGermanB1Resources(result), result);
  assert.deepEqual(base, before);
});
