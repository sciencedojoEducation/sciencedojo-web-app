import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { createClient } from "@supabase/supabase-js";
import { validateAcademyCourse } from "../lib/academy-course-validation.ts";
import { styleGermanA2Course } from "../lib/german-a2-visual-design.ts";
import { resolveGermanA2Images } from "./german-a2-image-assets.mjs";

for (const line of readFileSync(resolve(import.meta.dirname, "..", ".env.local"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^[ '\"]+|[ '\"]+$/g, "");
}
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: row, error } = await db.from("academy_courses")
  .select("id,draft_content,draft_revision,schema_version,published_version_id").eq("course_key", "german-a2-complete").single();
if (error) throw error;
const sha = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const hash = sha(row.draft_content);
const candidate = styleGermanA2Course(structuredClone(row.draft_content));
const validation = validateAcademyCourse(candidate);
if (!validation.valid) throw new Error(validation.errors.join("\n"));
// Visual migration must preserve every existing block and all course content.
for (let i = 0; i < row.draft_content.lessons.length; i++) {
  for (const original of row.draft_content.lessons[i].blocks) {
    const next = candidate.lessons[i].blocks.find((block) => block.id === original.id);
    const { appearance: oldAppearance, ...oldContent } = original;
    const { appearance: newAppearance, ...newContent } = next;
    if (!isDeepStrictEqual(oldContent, newContent)) throw new Error(`Content changed: ${original.id}`);
    if (oldAppearance?.background && !isDeepStrictEqual(oldAppearance, newAppearance)) throw new Error("Author background changed.");
  }
}
const changed = !isDeepStrictEqual(candidate, row.draft_content);
console.log(JSON.stringify({ draftRevision: row.draft_revision, draftSha256: hash, changed,
  images: candidate.lessons.flatMap((lesson) => lesson.blocks).filter((block) => block.type === "image").length,
  allExistingActivitiesPreserved: true, publishedVersionPreserved: row.published_version_id }, null, 2));
if (process.argv.includes("--verify-assets")) {
  const urls = new Set([row.draft_content.heroImage, ...row.draft_content.lessons.flatMap((lesson) =>
    lesson.blocks.filter((block) => block.type === "image").map((block) => block.src))]);
  for (const url of urls) {
    if (!url?.startsWith("https://")) throw new Error("Course image is not hosted.");
    const response = await fetch(url);
    if (!response.ok || !response.headers.get("content-type")?.startsWith("image/webp")) throw new Error(`Image inaccessible: ${url}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    const local = readFileSync(resolve(import.meta.dirname, "..", "public/images/academy/german-a2", new URL(url).pathname.split("/").pop()));
    if (!bytes.equals(local)) throw new Error("Hosted image differs from generated asset.");
  }
  console.log(JSON.stringify({ hostedImagesVerified: urls.size }));
}
if (!process.argv.includes("--apply") || !changed) process.exit(0);
const expected = process.argv.find((arg) => arg.startsWith("--expect-draft-sha256="))?.split("=")[1];
if (expected !== hash) throw new Error("Run read-only preview and supply its fresh draft hash.");
const imageAssets = await resolveGermanA2Images(db, candidate);
const resolved = validateAcademyCourse(candidate);
if (!resolved.valid) throw new Error(resolved.errors.join("\n"));
const { error: snapshotError } = await db.from("academy_course_snapshots").insert({
  course_id: row.id, draft_revision: row.draft_revision, schema_version: row.schema_version,
  reason: "migration", content: row.draft_content,
});
if (snapshotError) throw snapshotError;
const { data: updated, error: updateError } = await db.from("academy_courses").update({
  draft_content: candidate, draft_revision: row.draft_revision + 1, updated_at: new Date().toISOString(),
}).eq("id", row.id).eq("draft_revision", row.draft_revision).select("draft_revision,published_version_id").maybeSingle();
if (updateError) throw updateError;
if (!updated) throw new Error("Concurrent draft update detected; course was not overwritten.");
const { data: verify, error: verifyError } = await db.from("academy_courses").select("draft_content").eq("id", row.id).single();
if (verifyError) throw verifyError;
if (!isDeepStrictEqual(verify.draft_content, candidate)) throw new Error("Stored draft does not match visual update.");
console.log(JSON.stringify({ applied: true, imageAssets, verified: true, ...updated }));
