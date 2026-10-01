import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { validateAcademyCourse } from "../lib/academy-course-validation.ts";
import { germanB2Course } from "../lib/german-b2-course.ts";

const root = resolve(import.meta.dirname, "..");
for (const line of readFileSync(process.env.B2_ENV_FILE || resolve(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^[ '\"]+|[ '\"]+$/g, "");
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase credentials are required.");
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const arg = (name) => process.argv.find((item) => item.startsWith(`--${name}=`))?.slice(name.length + 3);
const apply = process.argv.includes("--apply");
const expectedVersion = Number(arg("expect-version"));
const expectedRevision = Number(arg("expect-draft-revision"));
const assetOrigin = arg("asset-origin");
const check = (condition, message) => { if (!condition) throw new Error(message); };
const canonical = (value) => Array.isArray(value) ? value.map(canonical) : value && typeof value === "object"
  ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, nested]) => [key, canonical(nested)])) : value;
const same = (left, right) => JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
function fingerprint(course) {
  const question = (item) => ({ id: item.id, type: item.type || "single-choice", prompt: item.prompt,
    options: item.options.map((option) => ({ id: option.id, label: option.label })),
    correctOptionId: item.correctOptionId, correctOptionIds: item.correctOptionIds || [], weight: item.weight || 1 });
  return createHash("sha256").update(JSON.stringify({ passMark: course.passMark || 80,
    required: course.rules?.requireFinalAssessment ?? true, quiz: course.quiz.map(question),
    inline: course.lessons.flatMap((lesson) => lesson.blocks.filter((block) => block.type === "knowledge-check").map((block) => question(block.question))) })).digest("hex");
}
const { data: row, error: loadError } = await db.from("academy_courses")
  .select("id,course_key,status,draft_revision,draft_content,published_version_id,quiz_revision,assessment_fingerprint")
  .eq("course_key", germanB2Course.key).single();
if (loadError) throw loadError;
check(row.status === "published" && row.published_version_id, "The B2 course must already be published.");
const { data: published, error: versionError } = await db.from("academy_course_versions")
  .select("id,version_number,content,assessment_fingerprint").eq("id", row.published_version_id).single();
if (versionError) throw versionError;
check(same({ ...row.draft_content, schemaVersion: published.content.schemaVersion }, published.content),
  "The Academy draft has edits beyond the current published version.");
const current = published.content;
const source = germanB2Course;
check(same(current.lessons.map((lesson) => lesson.id), source.lessons.map((lesson) => lesson.id)), "Lesson IDs changed.");
check(same(current.quiz.map((question) => question.id), source.quiz.map((question) => question.id)), "Quiz IDs changed.");
const initialFingerprint = fingerprint(current);
check(initialFingerprint === fingerprint(source), "Scored assessments changed.");
check(initialFingerprint === published.assessment_fingerprint && initialFingerprint === row.assessment_fingerprint,
  "Stored assessment fingerprints do not match.");
const next = structuredClone(current);
const changes = [];
for (const [index, lesson] of next.lessons.entries()) {
  const sourceBlocks = new Map(source.lessons[index].blocks.map((block) => [block.id, block]));
  check(same(lesson.blocks.map((block) => block.id), source.lessons[index].blocks.map((block) => block.id)), `Block IDs changed: ${lesson.id}`);
  for (const block of lesson.blocks) {
    if (block.type !== "audio") continue;
    const replacement = sourceBlocks.get(block.id);
    check(replacement?.type === "audio" && replacement.url.startsWith("/audio/german-b2/natural-v1/"), `No new audio URL for ${block.id}`);
    if (block.url !== replacement.url) { changes.push({ id: block.id, from: block.url, to: replacement.url }); block.url = replacement.url; }
  }
}
for (const [index, question] of next.quiz.entries()) {
  const replacement = source.quiz[index];
  if (!replacement.audioUrl) continue;
  check(replacement.audioUrl.startsWith("/audio/german-b2/natural-v1/"), `No new audio URL for ${question.id}`);
  question.audioUrl = replacement.audioUrl;
}
const allAudio = [...new Set(next.lessons.flatMap((lesson) => lesson.blocks.filter((block) => block.type === "audio").map((block) => block.url)))];
check(allAudio.length === 42 && allAudio.every((url) => url.startsWith("/audio/german-b2/natural-v1/")),
  `Expected 42 new B2 audio clips, found ${allAudio.length}.`);
for (const url of allAudio) {
  const file = resolve(root, "public", url.slice(1));
  check(existsSync(file) && readFileSync(file).length > 3000, `Missing local clip: ${url}`);
}
check(changes.length === 64, `Expected 64 changed lesson audio placements, found ${changes.length}.`);
check(fingerprint(next) === initialFingerprint, "Assessment fingerprint changed.");
const validation = validateAcademyCourse(next);
check(validation.valid, validation.errors.join("\n"));
console.log(JSON.stringify({ courseKey: row.course_key, publishedVersion: published.version_number,
  draftRevision: row.draft_revision, nextVersion: published.version_number + 1,
  updatedAudioBlocks: changes.length, uniqueAudioFiles: allAudio.length,
  lessonIdsUnchanged: true, assessmentFingerprintUnchanged: true,
  sampleChanges: changes.slice(0, 3) }, null, 2));
if (!apply) process.exit(0);
check(Number.isInteger(expectedVersion) && expectedVersion === published.version_number, "Supply the current version with --expect-version.");
check(Number.isInteger(expectedRevision) && expectedRevision === row.draft_revision, "Supply the current draft revision with --expect-draft-revision.");
check(assetOrigin?.startsWith("https://"), "Supply --asset-origin=https://... after deployment.");
for (const path of allAudio) {
  const url = new URL(path, assetOrigin);
  const response = await fetch(url, { method: "HEAD" });
  check(response.ok && (response.headers.get("content-type") || "").startsWith("audio/"), `Asset unavailable: ${url} (${response.status}).`);
}
const now = new Date().toISOString();
const revision = Number(row.draft_revision) + 1;
const { data: saved, error: saveError } = await db.from("academy_courses")
  .update({ draft_content: next, draft_revision: revision, schema_version: next.schemaVersion, autosaved_at: now, updated_at: now })
  .eq("id", row.id).eq("draft_revision", row.draft_revision).eq("published_version_id", published.id)
  .select("id,draft_revision").maybeSingle();
if (saveError || !saved) throw saveError || new Error("Course changed before save.");
const { error: snapshotError } = await db.from("academy_course_snapshots").insert({ course_id: row.id,
  draft_revision: revision, schema_version: next.schemaVersion, reason: "publish", content: next });
if (snapshotError) throw snapshotError;
const { data: created, error: createError } = await db.from("academy_course_versions")
  .insert({ course_id: row.id, version_number: published.version_number + 1, quiz_revision: row.quiz_revision,
    schema_version: next.schemaVersion, assessment_fingerprint: initialFingerprint,
    content: { ...next, quizRevision: row.quiz_revision } }).select("id,version_number").single();
if (createError) throw createError;
const { data: activated, error: activateError } = await db.from("academy_courses")
  .update({ published_version_id: created.id, status: "published", published_at: new Date().toISOString(),
    updated_at: new Date().toISOString(), assessment_fingerprint: initialFingerprint })
  .eq("id", row.id).eq("draft_revision", revision).eq("published_version_id", published.id)
  .select("id,published_version_id").maybeSingle();
if (activateError || !activated) throw activateError || new Error("Course changed before activation.");
console.log(JSON.stringify({ publishedVersion: created.version_number, audioFiles: allAudio.length,
  assessmentFingerprint: initialFingerprint }, null, 2));
