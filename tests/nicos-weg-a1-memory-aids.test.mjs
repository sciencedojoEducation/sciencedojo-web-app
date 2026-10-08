import assert from 'node:assert/strict';
import { test } from 'node:test';
import { nicosA1MemoryAids, nicosMemoryBlocks, withNicosMemoryAids } from '../lib/nicos-weg-a1-memory-aids.ts';
import { nicosWegA1Course } from '../lib/nicos-weg-a1-course.ts';
import { isAcademyBlockRequiredForCompletion } from '../lib/tutor-academy.ts';
import { academyVideoEmbedUrl } from '../lib/academy-video.ts';
import { academyLessonJourneySteps } from '../lib/academy-lesson-roadmap.ts';

test('all 19 grammar lessons have bilingual cues, two examples, limits and hidden, ungraded recall', () => {
  const lessons = nicosWegA1Course.lessons.filter(l => l.sectionId === 'grammar-library');
  assert.equal(lessons.length, 19);
  assert.deepEqual(Object.keys(nicosA1MemoryAids), lessons.map(l => l.id));
  for (const lesson of lessons) {
    const aid = nicosA1MemoryAids[lesson.id];
    assert.ok(aid.cue.trim());
    assert.equal(aid.examples.length, 2);
    for (const pair of [aid.method, aid.limits, ...aid.examples, aid.recall, aid.recall.explanation]) {
      assert.ok(pair.en.trim());
      assert.match(pair.si, /[\u0D80-\u0DFF]/u);
    }
    const extra = nicosMemoryBlocks(lesson.id);
    assert.ok(extra.every(b => !isAcademyBlockRequiredForCompletion(b) && !b.completion));
    assert.equal(extra.find(b => b.type === 'accordion').initiallyOpen, false);
    assert.ok(extra.find(b => b.type === 'text').content);
  }
});

test('render enrichment preserves teacher edits and completion identities, inserts in order and is idempotent', () => {
  for (const lesson of nicosWegA1Course.lessons.filter(l => l.sectionId === 'grammar-library')) {
    const original = structuredClone(lesson.blocks);
    original[1].paragraphs[0] = 'Teacher-edited explanation';
    const before = structuredClone(original);
    const enriched = withNicosMemoryAids(nicosWegA1Course.key, lesson.id, original);
    assert.deepEqual(original, before);
    assert.deepEqual(enriched.filter(b => !b.id.startsWith(`${lesson.id}-memory`)), original);
    const ids = enriched.map(b => b.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(ids.indexOf(`${lesson.id}-memory`), ids.indexOf(`${lesson.id}-patterns`) + 1);
    assert.ok(ids.indexOf(`${lesson.id}-memory-reveal`) < ids.indexOf(`${lesson.id}-film`));
    assert.deepEqual(enriched.filter(isAcademyBlockRequiredForCompletion).map(b => b.id), original.filter(isAcademyBlockRequiredForCompletion).map(b => b.id));
    assert.deepEqual(academyLessonJourneySteps(enriched, 'Intro').flatMap(s => s.requiredIds), academyLessonJourneySteps(original, 'Intro').flatMap(s => s.requiredIds));
    assert.strictEqual(withNicosMemoryAids(nicosWegA1Course.key, lesson.id, enriched), enriched);
    assert.deepEqual(withNicosMemoryAids(nicosWegA1Course.key, undefined, original), enriched, 'preview identities are inferred without enabling saving');
  }
});

test('other courses, non-grammar lessons, unknown IDs and removed/reordered anchor tables remain unchanged', () => {
  for (const lesson of nicosWegA1Course.lessons.filter(l => l.sectionId !== 'grammar-library')) assert.strictEqual(withNicosMemoryAids(nicosWegA1Course.key, lesson.id, lesson.blocks), lesson.blocks);
  const lesson = nicosWegA1Course.lessons.find(l => l.id === 'nico-a1-grammar-10');
  assert.strictEqual(withNicosMemoryAids('other-course', lesson.id, lesson.blocks), lesson.blocks);
  for (const id of ['constructor', '__proto__', 'nico-a1-grammar-19', 'nico-a1-grammar-1']) assert.deepEqual(nicosMemoryBlocks(id), []);
  const removed = lesson.blocks.filter(b => !b.id.endsWith('-patterns'));
  assert.strictEqual(withNicosMemoryAids(nicosWegA1Course.key, lesson.id, removed), removed);
  const reordered = [...lesson.blocks].reverse();
  assert.strictEqual(withNicosMemoryAids(nicosWegA1Course.key, lesson.id, reordered), reordered);
});

test('only selected songs are present, click-to-load, credited and scoped to verified segments', () => {
  const videos = Object.keys(nicosA1MemoryAids).flatMap(id => nicosMemoryBlocks(id).filter(b => b.type === 'video'));
  assert.equal(videos.length, 4);
  for (const video of videos) {
    assert.equal(video.clickToLoad, true);
    assert.match(video.caption, /Maggie's German Learning Songs|Herr Antrim/);
    assert.match(video.caption, /English:.*\nසිංහල:/);
    assert.ok(academyVideoEmbedUrl(video.url, video));
    assert.equal(new URL(academyVideoEmbedUrl(video.url, video)).searchParams.get('autoplay'), null);
  }
  const antrim = videos.filter(v => v.url.includes('23VZ4EpyENo'));
  const preferred = nicosMemoryBlocks('nico-a1-grammar-10').find(b => b.type === 'video');
  assert.equal(preferred.url, 'https://www.youtube.com/watch?v=XnRy9j6vm9c');
  assert.match(preferred.caption, /masculine\/neuter → dem/);
  assert.deepEqual(antrim.map(v => [v.startSeconds, v.endSeconds]), [[88, 136], [55, 88]]);
  assert.equal(academyVideoEmbedUrl('https://www.youtube.com/shorts/23VZ4EpyENo'), academyVideoEmbedUrl('https://www.youtube.com/watch?v=23VZ4EpyENo'));
});

test('Gesellschaft suffix practice has gender colours, bilingual limits, recall and the selected song', () => {
  const aid = nicosA1MemoryAids['nico-a1-grammar-03'];
  assert.deepEqual(aid.nounEndings.map(g => g.article), ['die', 'das', 'der']);
  for (const group of aid.nounEndings) {
    for (const pair of [group.rule, group.limits, ...group.examples]) {
      assert.ok(pair.en.trim());
      assert.match(pair.si, /[\u0D80-\u0DFF]/u);
    }
  }
  assert.match(aid.recall.answer, /die Zeitung.*das Mädchen.*der Frühling.*das Fenster/s);
  const blocks = nicosMemoryBlocks('nico-a1-grammar-03');
  const content = JSON.stringify(blocks.find(b => b.type === 'text').content);
  for (const color of ['#B91C1C', '#166534', '#1D4ED8']) assert.ok(content.includes(color));
  for (const exception of ['der Sprung', 'der Kuchen', 'die Erlaubnis', 'der Käfig', 'das Fenster']) assert.ok(content.includes(exception));
  const video = blocks.find(b => b.type === 'video');
  assert.equal(video.url, 'https://www.youtube.com/watch?v=cYcFR-vBykc');
  assert.equal(video.clickToLoad, true);
  assert.match(video.caption, /5:40/);
  assert.equal(video.completion, undefined);
  assert.ok(!nicosMemoryBlocks('nico-a1-grammar-04').some(b => JSON.stringify(b).includes('cYcFR-vBykc')));
});
