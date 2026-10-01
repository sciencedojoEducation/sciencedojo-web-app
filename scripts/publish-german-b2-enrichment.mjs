import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { validateAcademyCourse } from "../lib/academy-course-validation.ts";
import { germanB2Course } from "../lib/german-b2-course.ts";

const root = resolve(import.meta.dirname, "..");
for (const line of readFileSync(resolve(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^[ '\"]+|[ '\"]+$/g, "");
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)
  throw new Error("Supabase URL and service role key are required.");
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const apply = process.argv.includes("--apply");
const arg = (name) => process.argv.find((item) => item.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
const expectedVersion = Number(arg("expect-version"));
const expectedRevision = Number(arg("expect-draft-revision"));
const assetOrigin = arg("asset-origin");

function fingerprint(course) {
  const question = (item) => ({
    id: item.id, type: item.type || "single-choice", prompt: item.prompt,
    options: item.options.map((option) => ({ id: option.id, label: option.label })),
    correctOptionId: item.correctOptionId, correctOptionIds: item.correctOptionIds || [], weight: item.weight || 1,
  });
  const inline = course.lessons.flatMap((lesson) => lesson.blocks
    .filter((block) => block.type === "knowledge-check").map((block) => question(block.question)));
  return createHash("sha256").update(JSON.stringify({
    passMark: course.passMark || 80, required: course.rules?.requireFinalAssessment ?? true,
    quiz: course.quiz.map(question), inline,
  })).digest("hex");
}
const canonical = (value) => Array.isArray(value) ? value.map(canonical)
  : value && typeof value === "object" ? Object.fromEntries(Object.entries(value)
    .sort(([a], [b]) => a.localeCompare(b)).map(([key, nested]) => [key, canonical(nested)])) : value;
const same = (left, right) => JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
const check = (result, message) => { if (!result) throw new Error(message); };

const { data: row, error: rowError } = await db.from("academy_courses")
  .select("id,course_key,status,draft_revision,draft_content,published_version_id,quiz_revision,assessment_fingerprint")
  .eq("course_key", germanB2Course.key).single();
if (rowError) throw rowError;
check(row.status === "published" && row.published_version_id, "B2 course must already be published.");
const { data: published, error: versionError } = await db.from("academy_course_versions")
  .select("id,version_number,content,assessment_fingerprint")
  .eq("id", row.published_version_id).single();
if (versionError) throw versionError;
check(same({ ...row.draft_content, schemaVersion: published.content.schemaVersion }, published.content),
  "The Academy draft has edits beyond the current published version.");
const current = published.content;
check(same(current.lessons.map((lesson) => lesson.id), germanB2Course.lessons.map((lesson) => lesson.id)),
  "Lesson IDs changed.");
const sourceQuizWithPublishedAudio = germanB2Course.quiz.map((question, index) => ({
  ...question, audioUrl: current.quiz[index].audioUrl || question.audioUrl,
}));
check(same(current.quiz, sourceQuizWithPublishedAudio), "Final assessment changed beyond published audio URLs.");
const currentFingerprint = fingerprint(current);
check(currentFingerprint === fingerprint(germanB2Course), "Scored assessments changed.");
check(row.assessment_fingerprint === currentFingerprint && published.assessment_fingerprint === currentFingerprint,
  "Stored assessment fingerprints do not match the published content.");

const next = structuredClone(current);
const inserted = [];
for (const [index, sourceLesson] of germanB2Course.lessons.entries()) {
  const lesson = next.lessons[index];
  const existing = new Map(lesson.blocks.map((block) => [block.id, block]));
  const sourceIds = new Set(sourceLesson.blocks.map((block) => block.id));
  check(lesson.blocks.every((block) => sourceIds.has(block.id)), `Published block is absent from source: ${lesson.id}`);
  const oldOrder = lesson.blocks.map((block) => block.id);
  const resultingOrder = sourceLesson.blocks.filter((block) => existing.has(block.id)).map((block) => block.id);
  check(same(oldOrder, resultingOrder), `Existing block order changed: ${lesson.id}`);
  lesson.blocks = sourceLesson.blocks.map((block) => {
    if (existing.has(block.id)) return existing.get(block.id);
    inserted.push({ lessonId: lesson.id, id: block.id, type: block.type });
    return structuredClone(block);
  });
  lesson.durationMinutes = sourceLesson.durationMinutes;
}
check(inserted.length === 136, `Expected 136 new blocks, found ${inserted.length}.`);
next.estimatedMinutes = germanB2Course.estimatedMinutes;
check(same(next.lessons.map((lesson) => lesson.id), current.lessons.map((lesson) => lesson.id)), "Lesson IDs changed after merge.");
check(same(next.quiz, current.quiz), "Final assessment changed after merge.");
check(fingerprint(next) === currentFingerprint, "Assessment fingerprint changed after merge.");
const validation = validateAcademyCourse(next);
check(validation.valid, validation.errors.join("\n"));

const assets = new Set(inserted.flatMap(({ lessonId, id }) => {
  const lesson = next.lessons.find((item) => item.id === lessonId);
  const block = lesson.blocks.find((item) => item.id === id);
  return block.type === "image" ? [block.src] : block.type === "audio" ? [block.url] : [];
}));
check(assets.size === 21, `Expected 21 new assets, found ${assets.size}.`);
const preview = {
  courseKey: row.course_key, publishedVersion: published.version_number,
  draftRevision: row.draft_revision, nextVersion: published.version_number + 1,
  newBlocks: inserted.length, newAudio: [...assets].filter((url) => url.endsWith(".m4a")).length,
  newCharts: [...assets].filter((url) => url.endsWith(".svg")).length,
  lessonIdsUnchanged: true, assessmentsUnchanged: true,
  preservedPublishedAudioUrls: true,
  oldEstimatedMinutes: current.estimatedMinutes, newEstimatedMinutes: next.estimatedMinutes,
};
console.log(JSON.stringify(preview, null, 2));
if (!apply) process.exit(0);
check(Number.isInteger(expectedVersion) && expectedVersion === published.version_number,
  "Supply the current version with --expect-version after reviewing a fresh preview.");
check(Number.isInteger(expectedRevision) && expectedRevision === row.draft_revision,
  "Supply the current revision with --expect-draft-revision after reviewing a fresh preview.");
check(assetOrigin?.startsWith("https://"), "Supply the deployed site URL with --asset-origin=https://... .");
for (const path of assets) {
  const url = new URL(path, assetOrigin);
  const response = await fetch(url, { method: "HEAD" });
  check(response.ok, `New asset is not deployed: ${url} (${response.status}).`);
  const contentType = response.headers.get("content-type")?.toLowerCase() || "";
  const expectedMedia = path.endsWith(".svg") ? "image/svg+xml" : "audio/";
  check(contentType.startsWith(expectedMedia),
    `New asset returned ${contentType || "no content type"} instead of ${expectedMedia}: ${url}.`);
}

const now = new Date().toISOString();
const nextRevision = Number(row.draft_revision) + 1;
const { data: saved, error: saveError } = await db.from("academy_courses")
  .update({ draft_content: next, draft_revision: nextRevision, schema_version: next.schemaVersion,
    autosaved_at: now, updated_at: now })
  .eq("id", row.id).eq("draft_revision", row.draft_revision)
  .eq("published_version_id", published.id).select("id,draft_revision").maybeSingle();
if (saveError || !saved) throw saveError || new Error("Draft changed before save.");
const { error: snapshotError } = await db.from("academy_course_snapshots").insert({
  course_id: row.id, draft_revision: nextRevision, schema_version: next.schemaVersion,
  reason: "publish", content: next,
});
if (snapshotError) throw snapshotError;
const { data: created, error: createError } = await db.from("academy_course_versions")
  .insert({ course_id: row.id, version_number: published.version_number + 1,
    quiz_revision: row.quiz_revision, schema_version: next.schemaVersion,
    assessment_fingerprint: currentFingerprint, content: { ...next, quizRevision: row.quiz_revision } })
  .select("id,version_number").single();
if (createError) throw createError;
const { data: activated, error: activateError } = await db.from("academy_courses")
  .update({ published_version_id: created.id, status: "published", published_at: new Date().toISOString(),
    updated_at: new Date().toISOString(), assessment_fingerprint: currentFingerprint })
  .eq("id", row.id).eq("draft_revision", nextRevision)
  .eq("published_version_id", published.id).select("id,published_version_id").maybeSingle();
if (activateError || !activated) throw activateError || new Error("Course changed before activation. New version was not activated.");
console.log(JSON.stringify({ publishedVersion: created.version_number, versionId: created.id,
  newBlocks: inserted.length, assetsVerified: assets.size, assessmentFingerprint: currentFingerprint }, null, 2));
