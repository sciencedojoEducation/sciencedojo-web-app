import assert from 'node:assert/strict';
import { test } from 'node:test';
import { nicosWegA1Course } from '../lib/nicos-weg-a1-course.ts';
import { nicosWegA1Episodes } from '../lib/nicos-weg-a1-episodes.ts';
import { nicosWegA1Grammar } from '../lib/nicos-weg-a1-grammar.ts';
import { appendNicosA1Libraries } from '../lib/nicos-weg-a1-library.ts';
import { validateAcademyCourse } from '../lib/academy-course-validation.ts';

test('all 76 episodes are covered in official order with independent bilingual decks and grammar references', () => {
  assert.deepEqual(validateAcademyCourse(nicosWegA1Course).errors, []);
  assert.equal(nicosWegA1Course.lessons.length, 108);
  const vocab = nicosWegA1Course.lessons.filter(l => l.sectionId === 'vocabulary-library');
  const grammar = nicosWegA1Course.lessons.filter(l => l.sectionId === 'grammar-library');
  assert.equal(vocab.length, 76);
  assert.equal(grammar.length, 19);
  assert.equal(nicosWegA1Grammar.length, 19);
  const ids = nicosWegA1Course.lessons.flatMap(l => [l.id, ...l.blocks.map(b => b.id)]);
  assert.equal(new Set(ids).size, ids.length);
  vocab.forEach((lesson, i) => {
    const episode = nicosWegA1Episodes[i];
    assert.equal(episode.episode, i + 1);
    assert.equal(episode.unit, Math.floor(i / 4));
    assert.equal(episode.part, i % 4 + 1);
    assert.match(episode.url, new RegExp(`^https://static.dw.com/downloads/\\d+/nicos-weg-a1-e${episode.unit}-l${episode.part}-manuskript-und-wortschatz-englisch.pdf$`));
    const cards = lesson.blocks.find(b => b.type === 'flashcards');
    assert.equal(cards.items.length, 8);
    assert.ok(cards.items.every(c => c.title.trim() && /English: .+\nසිංහල: .+/u.test(c.body)));
    assert.ok(episode.vocabulary.every(w => /[\u0D80-\u0DFF]/u.test(w.sinhala)));
    assert.ok(lesson.blocks.find(b => b.type === 'resources').items.some(r => r.url === episode.url));
  });
  grammar.forEach((lesson, i) => {
    const film = lesson.blocks.find(b => b.id.endsWith('-film'));
    assert.equal(film.rows.length, 4);
    film.rows.forEach((row, j) => assert.equal(row[1], nicosWegA1Episodes[i * 4 + j].quote));
    assert.equal(lesson.blocks.filter(b => b.type === 'knowledge-check').length, 2);
    assert.ok(lesson.blocks.filter(b => b.type === 'knowledge-check').every(b => b.question.explanation.includes('සිංහල:') && b.required === false));
    assert.equal(lesson.blocks.filter(b => b.id.includes('-rule-')).length, 3);
  });
});

test('append preserves teacher edits, stable original IDs, assessment and navigation; repeat runs are idempotent', () => {
  const original = structuredClone(nicosWegA1Course);
  original.lessons = original.lessons.slice(0, 13);
  original.sections = original.sections.filter(s => !s.id.endsWith('-library'));
  original.estimatedMinutes = 330;
  original.lessons[0].blocks[0].paragraphs[0] = 'Teacher-edited learning goal';
  original.lessons[0].blocks.find(b => b.type === 'image').src = 'https://example.org/teacher-image.jpg';
  const before = structuredClone(original);
  const result = appendNicosA1Libraries(original);
  assert.deepEqual(original, before, 'input is never mutated');
  assert.deepEqual(result.lessons.slice(0, 13), before.lessons);
  assert.deepEqual(result.quiz, before.quiz);
  assert.deepEqual(result.rules, before.rules);
  assert.equal(result.quizRevision, before.quizRevision);
  assert.equal(result.estimatedMinutes, 1413);
  assert.deepEqual(appendNicosA1Libraries(result), result);
  result.lessons[13].blocks[0].paragraphs[0] = 'Edited grammar introduction';
  assert.deepEqual(appendNicosA1Libraries(result), result, 'do not replace later teacher edits');
  assert.throws(() => appendNicosA1Libraries({...original, key: 'other-course'}), /only/);
  const collision = structuredClone(original);
  collision.lessons[0].slug = 'grammar-00';
  assert.throws(() => appendNicosA1Libraries(collision), /collision/);
});
