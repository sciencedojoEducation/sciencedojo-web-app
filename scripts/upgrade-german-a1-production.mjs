import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { germanA1RestructuredCourse } from "../lib/german-a1-restructured-course.ts";
import { validateAcademyCourse } from "../lib/academy-course-validation.ts";

// Load credentials with node --env-file=.env.local; never log their values.
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const apply = process.argv.includes("--apply");
const expected = process.argv.find(arg => arg.startsWith("--expect-draft-sha256="))?.split("=")[1];
if (apply && !expected) throw new Error("Writes require a fresh --expect-draft-sha256=<hash> preview.");
const { data: row, error } = await client.from("academy_courses")
  .select("id,status,draft_revision,draft_content,published_version_id,schema_version")
  .eq("course_key", germanA1RestructuredCourse.key).single();
if (error) throw error;
const hash = createHash("sha256").update(JSON.stringify(row.draft_content)).digest("hex");
if (apply && hash !== expected) throw new Error("Draft changed; preview again.");
const candidate = structuredClone(row.draft_content);
const changedLessons = [];
for (const source of germanA1RestructuredCourse.lessons.filter(lesson => !lesson.examTrack)) {
  const draft = candidate.lessons.find(lesson => lesson.id === source.id);
  if (!draft) throw new Error(`Draft lesson missing: ${source.id}`);
  const existingIds = new Set(draft.blocks.map(block => block.id));
  const additions = source.blocks.filter(block => block.id.includes("-production-") && !existingIds.has(block.id));
  if (!additions.length) continue;
  for (const addition of additions) {
    const sourceIndex = source.blocks.indexOf(addition);
    const nextExisting = source.blocks.slice(sourceIndex + 1).find(block => existingIds.has(block.id));
    if (!nextExisting) draft.blocks.push(structuredClone(addition));
    else {
      const index = draft.blocks.findIndex(block => block.id === nextExisting.id);
      draft.blocks.splice(index, 0, structuredClone(addition));
    }
  }
  // Estimate additional practice only once; never replace builder-authored durations.
  draft.durationMinutes += 15 + (additions.some(block => block.id.endsWith("-spaced-review")) ? 5 : 0);
  changedLessons.push(draft.id);
}
candidate.estimatedMinutes += changedLessons.reduce((total, id) => {
  const old = row.draft_content.lessons.find(lesson => lesson.id === id);
  const next = candidate.lessons.find(lesson => lesson.id === id);
  return total + next.durationMinutes - old.durationMinutes;
}, 0);
const validation = validateAcademyCourse(candidate);
if (!validation.valid) throw new Error(validation.errors.join("\n"));
// Prove the update is additive: every pre-existing block is byte-for-byte preserved.
for (const original of row.draft_content.lessons) {
  const next = candidate.lessons.find(lesson => lesson.id === original.id);
  const oldIds = new Set(original.blocks.map(block => block.id));
  if (JSON.stringify(next.blocks.filter(block => oldIds.has(block.id))) !== JSON.stringify(original.blocks))
    throw new Error(`Existing draft content or order changed: ${original.id}`);
}
console.log(JSON.stringify({ draftRevision: row.draft_revision, draftSha256: hash,
  changedLessons, addedBlocks: candidate.lessons.reduce((sum, lesson) => sum + lesson.blocks.length, 0) - row.draft_content.lessons.reduce((sum, lesson) => sum + lesson.blocks.length, 0),
  publishedVersionPreserved: row.published_version_id, action: apply ? "save draft only" : "read-only preview" }, null, 2));
if (!apply || !changedLessons.length) process.exit(0);
const { error: snapshotError } = await client.from("academy_course_snapshots").insert({
  course_id: row.id, draft_revision: row.draft_revision, schema_version: row.schema_version,
  reason: "migration", content: row.draft_content,
});
if (snapshotError) throw snapshotError;
const { data: saved, error: saveError } = await client.from("academy_courses").update({
  draft_content: candidate, draft_revision: row.draft_revision + 1, autosaved_at: new Date().toISOString(), updated_at: new Date().toISOString(),
}).eq("id", row.id).eq("draft_revision", row.draft_revision)
  .select("draft_revision,status,published_version_id").maybeSingle();
if (saveError || !saved) throw new Error(saveError?.message || "Draft changed during save.");
if (saved.status !== row.status || saved.published_version_id !== row.published_version_id)
  throw new Error("Publication state unexpectedly changed.");
console.log(`Saved draft revision ${saved.draft_revision}; publication unchanged.`);
