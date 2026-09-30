import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { validateAcademyCourse } from "../lib/academy-course-validation.ts";
import { styleGermanA1Lesson } from "../lib/german-a1-visual-design.ts";

for (const line of readFileSync(resolve(import.meta.dirname, "..", ".env.local"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^[ '\"]+|[ '\"]+$/g, "");
}
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: row, error } = await db.from("academy_courses")
  .select("id, draft_content, draft_revision, schema_version, published_version_id")
  .eq("course_key", "deutsch-a1-komplett").single();
if (error) throw error;
const hash = createHash("sha256").update(JSON.stringify(row.draft_content)).digest("hex");
const candidate = { ...row.draft_content, lessons: row.draft_content.lessons.map(styleGermanA1Lesson) };
const validation = validateAcademyCourse(candidate);
if (!validation.valid) throw new Error(validation.errors.join("\n"));
const changed = candidate.lessons.flatMap((lesson, index) => lesson.blocks.filter((block, blockIndex) =>
  JSON.stringify(block) !== JSON.stringify(row.draft_content.lessons[index].blocks[blockIndex])));
console.log(JSON.stringify({ draftRevision: row.draft_revision, draftSha256: hash, styledBlocks: changed.length,
  sceneSections: changed.filter((block) => block.appearance?.background?.kind === "image").length,
  lessons: candidate.lessons.length, publishedVersionPreserved: row.published_version_id }, null, 2));
if (!process.argv.includes("--apply") || !changed.length) process.exit(0);
const expected = process.argv.find((arg) => arg.startsWith("--expect-draft-sha256="))?.split("=")[1];
if (expected !== hash) throw new Error("Draft changed or no fresh draft hash supplied. Run the read-only preview again.");
const { error: snapshotError } = await db.from("academy_course_snapshots").insert({
  course_id: row.id, draft_revision: row.draft_revision, schema_version: row.schema_version,
  reason: "migration", content: row.draft_content,
});
if (snapshotError) throw snapshotError;
const { data: updated, error: updateError } = await db.from("academy_courses").update({
  draft_content: candidate, draft_revision: row.draft_revision + 1, updated_at: new Date().toISOString(),
}).eq("id", row.id).eq("draft_revision", row.draft_revision).select("draft_revision, published_version_id").maybeSingle();
if (updateError) throw updateError;
if (!updated) throw new Error("Draft changed during styling; no course update was applied.");
console.log(JSON.stringify({ applied: true, ...updated }));
