import assert from 'node:assert/strict';
import { test } from 'node:test';
import { access } from 'node:fs/promises';
import { nicosLessonBanner } from '../lib/nicos-weg-a1-visuals.ts';
import { nicosWegA1Course } from '../lib/nicos-weg-a1-course.ts';
import { nicosWegA1Episodes } from '../lib/nicos-weg-a1-episodes.ts';

test('all 108 Nicos lessons resolve to matching, locally available episode scenes', async () => {
  for (const lesson of nicosWegA1Course.lessons) {
    const banner = nicosLessonBanner(nicosWegA1Course.key, lesson);
    assert.ok(banner, lesson.id);
    await access(new URL(`../public${banner.src}`, import.meta.url));
    if (lesson.sectionId === 'vocabulary-library') {
      const [, unit, part] = /-e(\d{2})-l([1-4])$/.exec(lesson.id);
      assert.equal(banner.episode, Number(unit) * 4 + Number(part));
    }
    if (lesson.sectionId === 'grammar-library') assert.equal(nicosWegA1Episodes[banner.episode - 1].unit, Number(lesson.id.slice(-2)));
  }
});

test('teacher-selected story images are preserved; other courses and unknown lessons are unaffected', () => {
  const lesson = structuredClone(nicosWegA1Course.lessons[0]);
  lesson.blocks.find(b => b.id === `${lesson.id}-image`).src = '/images/teacher-scene.jpg';
  assert.equal(nicosLessonBanner(nicosWegA1Course.key, lesson).src, '/images/teacher-scene.jpg');
  assert.equal(nicosLessonBanner(nicosWegA1Course.key, lesson).attribution, undefined);
  assert.equal(nicosLessonBanner('german-b2-complete', lesson), undefined);
  assert.equal(nicosLessonBanner(nicosWegA1Course.key, { id: 'teacher-added', blocks: [] }), undefined);
});
