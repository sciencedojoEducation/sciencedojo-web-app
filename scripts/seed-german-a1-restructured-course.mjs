import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

import { validateAcademyCourse } from "../lib/academy-course-validation.ts";
import { resolveDraftQuizRevision } from "../lib/academy-draft-quiz-revision.ts";
import { germanA1Course } from "../lib/german-a1-course.ts";
import { germanA1FunctionalScenarios } from "../lib/german-a1-functional-scenarios.ts";
import { germanA1RestructuredCourse } from "../lib/german-a1-restructured-course.ts";

const root = resolve(import.meta.dirname, "..");
for (const line of readFileSync(resolve(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (match && !process.env[match[1]])
    process.env[match[1]] = match[2].replace(/^[ '\"]+|[ '\"]+$/g, "");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Supabase URL and service role key are required.");
const supabase = createClient(url, key, { auth: { persistSession: false } });
const apply = process.argv.includes("--apply");
const recordBaseline = process.argv.includes("--record-baseline");
const expectedHash = process.argv.find((arg) => arg.startsWith("--expect-draft-sha256="))?.split("=")[1];
if ((apply || recordBaseline) && !expectedHash)
  throw new Error("Writes require --expect-draft-sha256=<hash> from a fresh read-only preview.");
if (apply && recordBaseline)
  throw new Error("Choose either --apply or --record-baseline.");

const candidate = structuredClone(germanA1RestructuredCourse);
const firstValidation = validateAcademyCourse(candidate);
if (!firstValidation.valid)
  throw new Error(`Candidate course is invalid:\n${firstValidation.errors.join("\n")}`);

const { data: row, error: loadError } = await supabase.from("academy_courses")
  .select("id, status, draft_content, draft_revision, schema_version, published_version_id")
  .eq("course_key", candidate.key).single();
if (loadError || !row) throw new Error(loadError?.message || "Existing course not found.");
const { data: publishedVersion, error: publishedVersionError } = row.published_version_id
  ? await supabase.from("academy_course_versions")
    .select("content")
    .eq("id", row.published_version_id)
    .single()
  : { data: null, error: null };
if (publishedVersionError) throw publishedVersionError;
const draftHash = createHash("sha256").update(JSON.stringify(row.draft_content)).digest("hex");
if ((apply || recordBaseline) && draftHash !== expectedHash)
  throw new Error("Draft changed since preview. Re-run without --apply before trying again.");
const { data: baseline, error: baselineError } = await supabase
  .from("academy_course_snapshots")
  .select("id, content, draft_revision")
  .eq("course_id", row.id)
  .eq("reason", "migration")
  .eq("draft_revision", row.draft_revision)
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();
if (baselineError) throw baselineError;
if (recordBaseline) {
  if (baseline) {
    console.log(`Draft revision ${row.draft_revision} already has a migration baseline; no changes made.`);
    process.exit(0);
  }
  const { error: insertError } = await supabase.from("academy_course_snapshots").insert({
    course_id: row.id,
    draft_revision: row.draft_revision,
    schema_version: row.schema_version,
    reason: "migration",
    content: row.draft_content,
  });
  if (insertError) throw insertError;
  console.log(`Recorded restore and merge baseline for draft revision ${row.draft_revision}; course content unchanged.`);
  process.exit(0);
}
const sourceBlockIds = new Set([
  ...germanA1Course.lessons.flatMap((lesson) => lesson.blocks.map((block) => block.id)),
  ...candidate.lessons.flatMap((lesson) => lesson.blocks.map((block) => block.id)),
]);
const baselineBlocksById = baseline
  ? new Map(baseline.content.lessons.flatMap((lesson) =>
      lesson.blocks.map((block) => [block.id, block])))
  : null;
// Explicit provenance for source blocks replaced by original everyday
// listening scenarios. They may disappear from the next seeded draft, but
// unknown builder-authored blocks must still stop the migration.
const retiredSourceBlockIds = new Set([
  "de-a1-01-alphabet-aussprache-und-buchstabieren-hoeren",
  "de-a1-01-alphabet-aussprache-und-buchstabieren-hoercheck",
  "de-a1-12-tagesablauf-hoeren",
  "de-a1-12-tagesablauf-hoercheck",
  ...Object.values(germanA1FunctionalScenarios).flatMap(({ sourceSlug }) => [
    `de-a1-${sourceSlug}-hoeren`,
    `de-a1-${sourceSlug}-hoercheck`,
  ]),
]);
const draftOnlyBlocks = row.draft_content.lessons.flatMap((lesson) => lesson.blocks)
  .filter((block) => block.id && !sourceBlockIds.has(block.id) &&
    !retiredSourceBlockIds.has(block.id) && !baselineBlocksById?.has(block.id));
const retiredDraftBlocks = row.draft_content.lessons.flatMap((lesson) => lesson.blocks)
  .filter((block) => block.id && retiredSourceBlockIds.has(block.id) &&
    !sourceBlockIds.has(block.id));
const sourceBlocksById = new Map([
  ...germanA1Course.lessons.flatMap((lesson) => lesson.blocks.map((block) => [block.id, block])),
  ...candidate.lessons.flatMap((lesson) => lesson.blocks.map((block) => [block.id, block])),
]);
const canonical = (value) => Array.isArray(value)
  ? value.map(canonical)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]))
    : value;
const changedDraftBlocks = row.draft_content.lessons.flatMap((lesson) => lesson.blocks)
  .filter((block) => {
    const sourceBlock = baselineBlocksById
      ? baselineBlocksById.get(block.id)
      : sourceBlocksById.get(block.id);
    if (!sourceBlock) return false;
    const draftCopy = structuredClone(block);
    const sourceCopy = structuredClone(sourceBlock);
    if (!baselineBlocksById && draftCopy.type === "audio" && sourceCopy.type === "audio") {
      draftCopy.url = sourceCopy.url;
    }
    return JSON.stringify(canonical(draftCopy)) !== JSON.stringify(canonical(sourceCopy));
  });
const removedEditedBlocks = changedDraftBlocks.filter((block) =>
  !candidate.lessons.some((lesson) => lesson.blocks.some((item) => item.id === block.id)));
const withoutBlocks = (document) => ({
  ...document,
  lessons: document.lessons.map((lesson) => ({ ...lesson, blocks: [] })),
});
const hasUnmergedStructureEdits = Boolean(baseline &&
  JSON.stringify(canonical(withoutBlocks(row.draft_content))) !==
    JSON.stringify(canonical(withoutBlocks(baseline.content))));
const blockLayout = (document) => document.lessons.map((lesson) => ({
  lessonId: lesson.id,
  blockIds: lesson.blocks.map((block) => block.id),
}));
const hasUnmergedBlockLayoutEdits = Boolean(baseline &&
  JSON.stringify(blockLayout(row.draft_content)) !==
    JSON.stringify(blockLayout(baseline.content)));
const changedBlocksById = new Map(changedDraftBlocks.map((block) => [block.id, block]));
for (const lesson of candidate.lessons)
  lesson.blocks = lesson.blocks.map((block) =>
    changedBlocksById.has(block.id)
      ? structuredClone(changedBlocksById.get(block.id))
      : block);
if (apply && draftOnlyBlocks.length)
  throw new Error(`Current draft contains ${draftOnlyBlocks.length} custom blocks absent from the version-controlled source. Review and merge them before applying.`);
if (apply && removedEditedBlocks.length)
  throw new Error(`Current draft has ${removedEditedBlocks.length} edited blocks that the source removes. Review and merge them before applying.`);
if (apply && hasUnmergedStructureEdits)
  throw new Error("The draft has course or lesson edits since its last seeded baseline. Review those edits before applying a new source version.");
if (apply && hasUnmergedBlockLayoutEdits)
  throw new Error("The draft has inserted, removed, or reordered blocks since its last seeded baseline. Review those edits before applying a new source version.");

const mappedAudio = new Map();
const draftBlocksById = new Map(row.draft_content.lessons.flatMap((lesson) =>
  lesson.blocks.map((block) => [block.id, block])));
const draftQuizById = new Map(row.draft_content.quiz.map((question) => [question.id, question]));
const lessonAudioMappingCandidates = candidate.lessons.flatMap((lesson) => lesson.blocks)
  .filter((block) => block.type === "audio" && block.url.startsWith("/audio/") &&
    draftBlocksById.get(block.id)?.type === "audio" &&
    draftBlocksById.get(block.id)?.url.startsWith("https://") &&
    block.transcript === draftBlocksById.get(block.id)?.transcript)
  .map((block) => ({ localUrl: block.url, currentUrl: draftBlocksById.get(block.id).url }));
const quizAudioMappingCandidates = candidate.quiz
  .filter((question) => question.audioUrl?.startsWith("/audio/") &&
    draftQuizById.get(question.id)?.audioUrl?.startsWith("https://") &&
    question.audioTranscript === draftQuizById.get(question.id)?.audioTranscript)
  .map((question) => ({ localUrl: question.audioUrl, currentUrl: draftQuizById.get(question.id).audioUrl }));
await Promise.all([...lessonAudioMappingCandidates, ...quizAudioMappingCandidates].map(async ({ localUrl, currentUrl }) => {
  const localPath = resolve(root, "public", localUrl.slice(1));
  if (!existsSync(localPath)) return;
  const localDigest = createHash("sha256").update(readFileSync(localPath)).digest("hex");
  if (currentUrl.includes(`/${localDigest.slice(0, 16)}/`)) {
    mappedAudio.set(localUrl, currentUrl);
    return;
  }
  // Older Academy assets predate digest-based storage. Compare their actual
  // bytes before reusing them so a revised recording never keeps stale audio.
  const response = await fetch(currentUrl).catch(() => null);
  if (!response?.ok) return;
  const remoteDigest = createHash("sha256").update(Buffer.from(await response.arrayBuffer())).digest("hex");
  if (remoteDigest === localDigest) mappedAudio.set(localUrl, currentUrl);
}));
const localAudio = new Set();
for (const lesson of candidate.lessons) {
  for (const block of lesson.blocks) {
    if (block.type !== "audio" || !block.url.startsWith("/audio/")) continue;
    if (!mappedAudio.has(block.url)) localAudio.add(block.url);
  }
}
for (const question of candidate.quiz) {
  if (question.audioUrl?.startsWith("/audio/") && !mappedAudio.has(question.audioUrl))
    localAudio.add(question.audioUrl);
}
for (const audioUrl of localAudio) {
  if (!existsSync(resolve(root, "public", audioUrl.slice(1))))
    throw new Error(`Missing local listening file: ${audioUrl}`);
}
const mergedValidation = validateAcademyCourse(candidate);
if (!mergedValidation.valid)
  throw new Error(`Candidate with preserved draft edits is invalid:\n${mergedValidation.errors.join("\n")}`);
const previewCandidate = structuredClone(candidate);
for (const lesson of previewCandidate.lessons)
  for (const block of lesson.blocks)
    if (block.type === "audio") block.url = mappedAudio.get(block.url) || block.url;
for (const question of previewCandidate.quiz)
  if (question.audioUrl) question.audioUrl = mappedAudio.get(question.audioUrl) || question.audioUrl;
// Compare resolved audio URLs, not local source paths, so an unchanged quiz
// does not acquire a new revision just because its files live in Academy.
const quizChanged = JSON.stringify(canonical(previewCandidate.quiz)) !==
  JSON.stringify(canonical(row.draft_content.quiz));
const resolvedQuizRevision = resolveDraftQuizRevision(
  candidate.quizRevision,
  Math.max(
    Number(row.draft_content.quizRevision || 1),
    Number(publishedVersion?.content?.quizRevision || 1),
  ),
  quizChanged,
);
candidate.quizRevision = resolvedQuizRevision;
previewCandidate.quizRevision = resolvedQuizRevision;
const alreadyCurrent = localAudio.size === 0 &&
  JSON.stringify(canonical(previewCandidate)) === JSON.stringify(canonical(row.draft_content));
const draftLessonsById = new Map(row.draft_content.lessons.map((lesson) => [lesson.id, lesson]));
const changedLessonIds = previewCandidate.lessons.filter((lesson) =>
  JSON.stringify(canonical(lesson)) !== JSON.stringify(canonical(draftLessonsById.get(lesson.id))))
  .map((lesson) => lesson.id);

console.log(JSON.stringify({
  courseKey: candidate.key,
  currentStatus: row.status,
  publishedVersionPreserved: row.published_version_id,
  draftRevision: row.draft_revision,
  draftSha256: draftHash,
  candidateLessons: candidate.lessons.length,
  coreChapters: candidate.lessons.filter((lesson) => !lesson.examTrack).length,
  examRoutes: Object.fromEntries(candidate.examTracks.map((track) =>
    [track.id, candidate.lessons.filter((lesson) => lesson.examTrack === track.id).length])),
  estimatedMinutesPerRoute: candidate.estimatedMinutes,
  currentDraftLessons: row.draft_content.lessons.length,
  draftOnlyBlocks: draftOnlyBlocks.length,
  retiredSourceBlocks: retiredDraftBlocks.map((block) => block.id),
  migrationBaselineAtCurrentRevision: Boolean(baseline),
  unmergedStructureEdits: hasUnmergedStructureEdits,
  unmergedBlockLayoutEdits: hasUnmergedBlockLayoutEdits,
  changedDraftBlocks: changedDraftBlocks.length,
  changedDraftBlockIds: changedDraftBlocks.slice(0, 12).map((block) => block.id),
  existingAudioMappings: mappedAudio.size,
  newAudioUploadsNeeded: localAudio.size,
  newAudioPaths: [...localAudio].sort(),
  changedLessonIds,
  quizChanged,
  candidateQuizRevision: candidate.quizRevision,
  publishedQuizRevision: publishedVersion?.content?.quizRevision ?? null,
  alreadyCurrent,
  action: apply ? "apply draft only" : "read-only preview",
}, null, 2));
if (!apply) process.exit(0);

for (const audioUrl of localAudio) {
  const localPath = resolve(root, "public", audioUrl.slice(1));
  const bytes = readFileSync(localPath);
  const digest = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  const storagePath = `courses/${candidate.key}/restructured/${digest}/${basename(localPath)}`;
  const { data: existingAsset, error: assetLoadError } = await supabase
    .from("academy_assets").select("public_url").eq("storage_path", storagePath).maybeSingle();
  if (assetLoadError) throw assetLoadError;
  if (!existingAsset) {
    const { error: uploadError } = await supabase.storage.from("academy-media")
      .upload(storagePath, bytes, { contentType: "audio/mp4", upsert: false });
    if (uploadError && String(uploadError.statusCode) !== "409") throw uploadError;
    const publicUrl = supabase.storage.from("academy-media").getPublicUrl(storagePath).data.publicUrl;
    const { error: insertError } = await supabase.from("academy_assets").upsert({
      storage_path: storagePath,
      public_url: publicUrl,
      media_type: "audio",
      mime_type: "audio/mp4",
      original_name: basename(localPath),
      byte_size: bytes.byteLength,
    }, { onConflict: "storage_path" });
    if (insertError) throw insertError;
    mappedAudio.set(audioUrl, publicUrl);
  } else {
    mappedAudio.set(audioUrl, existingAsset.public_url);
  }
}

for (const lesson of candidate.lessons)
  for (const block of lesson.blocks)
    if (block.type === "audio") block.url = mappedAudio.get(block.url) || block.url;
for (const question of candidate.quiz)
  if (question.audioUrl) question.audioUrl = mappedAudio.get(question.audioUrl) || question.audioUrl;

const validation = validateAcademyCourse(candidate);
if (!validation.valid) throw new Error(`Resolved draft is invalid:\n${validation.errors.join("\n")}`);
if (JSON.stringify(canonical(candidate)) === JSON.stringify(canonical(row.draft_content))) {
  console.log("Draft already matches the validated source; no changes were made.");
  process.exit(0);
}
const { error: snapshotError } = await supabase.from("academy_course_snapshots").insert({
  course_id: row.id,
  draft_revision: row.draft_revision,
  schema_version: row.schema_version,
  reason: "migration",
  content: row.draft_content,
});
if (snapshotError) throw snapshotError;

const now = new Date().toISOString();
const { data: saved, error: saveError } = await supabase.from("academy_courses").update({
  draft_content: candidate,
  draft_revision: Number(row.draft_revision) + 1,
  schema_version: candidate.schemaVersion,
  autosaved_at: now,
  updated_at: now,
}).eq("id", row.id).eq("draft_revision", row.draft_revision)
  .select("id, draft_revision, status, published_version_id").maybeSingle();
if (saveError || !saved) throw new Error(saveError?.message || "Draft revision changed during save.");
console.log(`Updated draft to revision ${saved.draft_revision}; status ${saved.status} and published version ${saved.published_version_id} were preserved.`);
const { error: baselineSaveError } = await supabase.from("academy_course_snapshots").insert({
  course_id: row.id,
  draft_revision: saved.draft_revision,
  schema_version: candidate.schemaVersion,
  reason: "migration",
  content: candidate,
});
if (baselineSaveError)
  console.error(`Draft saved, but its comparison baseline could not be recorded: ${baselineSaveError.message}`);
