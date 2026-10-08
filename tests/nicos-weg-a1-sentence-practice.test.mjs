import assert from 'node:assert/strict';
import { test } from 'node:test';
import { nicosSentencePractices, practiceSentence, sentencePracticeForBlock } from '../lib/nicos-weg-a1-sentence-practice.ts';
import { nicosA1LibraryLessons } from '../lib/nicos-weg-a1-library.ts';

test('each grammar method has a complete activity; unrelated course content is unaffected', () => {
  const grammar = nicosA1LibraryLessons.filter(lesson => lesson.sectionId === 'grammar-library');
  assert.equal(nicosSentencePractices.length, grammar.length);
  for (const lesson of grammar) {
    const method = lesson.blocks.find(block => block.id.endsWith('-method'));
    const activity = sentencePracticeForBlock('deutsch-nicos-weg-a1', method.id);
    assert.ok(activity);
    for (const index of [activity.verb, activity.subject, activity.detail]) {
      assert.ok(activity.tokens[index] && !/^[.?!]$/.test(activity.tokens[index]));
    }
    assert.ok(activity.replacements.length >= 2);
    assert.ok(activity.replacements.every(value => value !== activity.tokens[activity.detail]));
    assert.ok(activity.explanation);
  }
  assert.equal(sentencePracticeForBlock('another-course', 'nico-a1-grammar-00-method'), undefined);
  assert.equal(sentencePracticeForBlock('deutsch-nicos-weg-a1', 'nico-a1-grammar-00-check-1'), undefined);
  assert.equal(sentencePracticeForBlock('deutsch-nicos-weg-a1', 'nico-a1-grammar-99-method'), undefined);
});

test('finite verb recognition covers modal, perfect, separable and formal imperative patterns', () => {
  assert.equal(nicosSentencePractices[3].tokens[nicosSentencePractices[3].verb], 'möchte');
  assert.equal(nicosSentencePractices[7].tokens[nicosSentencePractices[7].verb], 'steht');
  assert.equal(nicosSentencePractices[13].tokens[nicosSentencePractices[13].verb], 'haben');
  assert.equal(nicosSentencePractices[0].kind, 'Instruction');
  assert.equal(nicosSentencePractices[8].kind, 'Question');
  assert.equal(nicosSentencePractices[14].tokens[nicosSentencePractices[14].subject], 'Die Jacke');
  assert.equal(practiceSentence(['Kannst', 'du', 'kommen', '?']), 'Kannst du kommen?');
});
