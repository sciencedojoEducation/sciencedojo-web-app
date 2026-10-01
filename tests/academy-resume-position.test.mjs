import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { academyActivityProgress, academyBookmarkedResumeHref, resolveAcademyResumePosition } from "../lib/academy-resume-position.ts";
import { emptyAcademyProgress } from "../lib/tutor-academy.ts";
import { germanA1RestructuredCourse as course } from "../lib/german-a1-restructured-course.ts";

const lesson = course.lessons[0];
const position = { lessonId: lesson.id, blockId: lesson.blocks.find((block) => block.id).id, updatedAt: "2026-10-01T00:00:00Z" };

test("resume positions resolve only to an existing unlocked lesson and block", () => {
  assert.ok(resolveAcademyResumePosition(course, emptyAcademyProgress, position));
  assert.equal(resolveAcademyResumePosition(course, emptyAcademyProgress, { ...position, blockId: "removed" }), null);
  assert.equal(resolveAcademyResumePosition(course, emptyAcademyProgress, { ...position, lessonId: "removed" }), null);
  const locked = course.lessons[1];
  assert.equal(resolveAcademyResumePosition(course, emptyAcademyProgress, { ...position, lessonId: locked.id, blockId: locked.blocks.find((block) => block.id).id }), null);
});

test("continue returns to the exact bookmarked activity without altering completion", () => {
  const before = JSON.stringify(emptyAcademyProgress);
  const href = academyBookmarkedResumeHref(course, emptyAcademyProgress, position, "/course", "/fallback");
  assert.equal(href, `/course/lessons/${lesson.slug}#academy-block-${encodeURIComponent(position.blockId)}`);
  assert.equal(JSON.stringify(emptyAcademyProgress), before);
  assert.equal(academyBookmarkedResumeHref(course, { ...emptyAcademyProgress, completedLessonIds: [lesson.id] }, position, "/course", "/fallback"), "/fallback");
  assert.equal(academyBookmarkedResumeHref(course, emptyAcademyProgress, null, "/course", "/fallback"), "/fallback");
});

test("progress counts unique saved required activities, not visited activities", () => {
  assert.deepEqual(academyActivityProgress(["a", "a", "b"], ["a", "visited"]), { completed: 1, total: 2, percent: 50 });
  assert.deepEqual(academyActivityProgress([], ["visited"]), { completed: 0, total: 0, percent: 0 });
});

test("resume saves validate ownership and locks, without writing completion or publishing", async () => {
  const actions = await readFile(new URL("../app/dashboard/tutor/academy/actions.ts", import.meta.url), "utf8");
  const action = actions.slice(actions.indexOf("export async function saveAcademyResumePosition"), actions.indexOf("export type QuizActionState"));
  assert.match(action, /requireTutorAcademyUser\(courseKey\)/);
  assert.match(action, /resolveAcademyResumePosition/);
  assert.match(action, /user_id: user.id/);
  assert.doesNotMatch(action, /completed_block_ids|completed_lesson_ids|status: "published"/);
  const sql = await readFile(new URL("../sql/066_academy_learner_positions.sql", import.meta.url), "utf8");
  assert.match(sql, /ENABLE ROW LEVEL SECURITY/);
  assert.match(sql, /USING \(auth.uid\(\) = user_id\) WITH CHECK \(auth.uid\(\) = user_id\)/);
  assert.match(sql, /PRIMARY KEY \(user_id, course_key\)/);
});

test("preview cannot save bookmarks, and an explicit activity link wins over a bookmark", async () => {
  const tracker = await readFile(new URL("../components/tutor-academy/AcademyActivityTracker.tsx", import.meta.url), "utf8");
  assert.match(tracker, /const canSave = !!courseKey && !!lessonId/);
  assert.match(tracker, /if \(!canSave \|\| !id/);
  assert.match(tracker, /queue.current = queue.current.then/);
  const journey = await readFile(new URL("../components/tutor-academy/AcademyLessonJourney.tsx", import.meta.url), "utf8");
  assert.match(journey, /decodeURIComponent\(window.location.hash.slice\(1\)\) \|\| resumeAnchor/);
});
