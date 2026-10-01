import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { createClient } from "@supabase/supabase-js";
import { enrichGermanA2Course } from "../lib/german-a2-resource-enrichment.ts";
import { styleGermanA2Lesson } from "../lib/german-a2-visual-design.ts";
import { migrateAcademyCourse } from "../lib/academy-schema.ts";
import { validateAcademyCourse } from "../lib/academy-course-validation.ts";

for (const line of readFileSync(resolve(import.meta.dirname,"..",".env.local"),"utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^[ '\"]+|[ '\"]+$/g,"");
}
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const {data:row,error} = await db.from("academy_courses")
  .select("id,status,draft_content,draft_revision,schema_version,published_version_id").eq("course_key","german-a2-complete").single();
if (error) throw error;
const hash = createHash("sha256").update(JSON.stringify(row.draft_content)).digest("hex");
const enriched = enrichGermanA2Course(row.draft_content);
const candidate = migrateAcademyCourse({...enriched,lessons:enriched.lessons.map(styleGermanA2Lesson)});
const validation = validateAcademyCourse(candidate);
if (!validation.valid) throw new Error(validation.errors.join("\n"));
let existingBlocks = 0, addedBlocks = 0;
for (const oldLesson of row.draft_content.lessons) {
  const newLesson = candidate.lessons.find(lesson => lesson.id === oldLesson.id);
  for (const oldBlock of oldLesson.blocks) {
    existingBlocks++;
    if (!isDeepStrictEqual(oldBlock,newLesson.blocks.find(block => block.id === oldBlock.id)))
      throw new Error(`Refusing to change existing block ${oldBlock.id}.`);
  }
  const {blocks:oldBlocks,durationMinutes:oldMinutes,...oldContent} = oldLesson;
  const {blocks:newBlocks,durationMinutes:newMinutes,...newContent} = newLesson;
  if (!isDeepStrictEqual(oldContent,newContent)) throw new Error("Existing lesson metadata changed.");
  addedBlocks += newBlocks.length - oldBlocks.length;
  if (newMinutes < oldMinutes) throw new Error("Lesson duration unexpectedly decreased.");
}
const {lessons:oldLessons,estimatedMinutes:oldEstimate,...oldCourse} = row.draft_content;
const {lessons:newLessons,estimatedMinutes:newEstimate,...newCourse} = candidate;
if (!isDeepStrictEqual(oldCourse,newCourse) || oldLessons.length !== newLessons.length || newEstimate < oldEstimate)
  throw new Error("Course theme, media, quiz, rules or structure changed.");
console.log(JSON.stringify({draftRevision:row.draft_revision,draftSha256:hash,existingBlocksPreserved:existingBlocks,
  addedBlocks,estimatedMinutes:candidate.estimatedMinutes,lessons:candidate.lessons.length,status:row.status},null,2));
if (!process.argv.includes("--apply") || !addedBlocks) process.exit(0);
const expected = process.argv.find(arg => arg.startsWith("--expect-draft-sha256="))?.split("=")[1];
if (expected !== hash) throw new Error("A fresh reviewed draft hash is required.");
const {error:snapshotError} = await db.from("academy_course_snapshots").insert({
  course_id:row.id,draft_revision:row.draft_revision,schema_version:row.schema_version,reason:"migration",content:row.draft_content,
});
if (snapshotError) throw snapshotError;
const {data:updated,error:updateError} = await db.from("academy_courses").update({
  draft_content:candidate,draft_revision:row.draft_revision+1,updated_at:new Date().toISOString(),
}).eq("id",row.id).eq("draft_revision",row.draft_revision).select("draft_revision,status,published_version_id").maybeSingle();
if (updateError) throw updateError;
if (!updated) throw new Error("Draft changed during update; no overwrite was applied.");
const {data:verify,error:verifyError} = await db.from("academy_courses").select("draft_content").eq("id",row.id).single();
if (verifyError) throw verifyError;
if (!isDeepStrictEqual(candidate,verify.draft_content)) throw new Error("Saved draft differs from reviewed additions.");
console.log(JSON.stringify({applied:true,verified:true,...updated}));
