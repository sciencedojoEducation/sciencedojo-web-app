import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { validateAcademyCourse } from "../lib/academy-course-validation.ts";
import { styleGermanB1Course } from "../lib/german-b1-visual-design.ts";

const root = resolve(import.meta.dirname, "..");
for (const line of readFileSync(resolve(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^[ '\"]+|[ '\"]+$/g, "");
}
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: row, error } = await db.from("academy_courses")
  .select("id,draft_content,draft_revision,schema_version,status,published_version_id")
  .eq("course_key", "german-b1-complete").single();
if (error) throw error;
const hash = createHash("sha256").update(JSON.stringify(row.draft_content)).digest("hex");
const candidate = styleGermanB1Course(row.draft_content);
const validation = validateAcademyCourse(candidate);
if (!validation.valid) throw new Error(validation.errors.join("\n"));
const paths = new Set([
  candidate.heroImage,
  ...candidate.lessons.flatMap((lesson) => lesson.blocks.filter((block) => block.type === "image").map((block) => block.src)),
].filter((path) => path?.startsWith("/images/academy/german-b1/")));
for (const path of paths) {
  const file = resolve(root, "public", path.slice(1));
  if (!existsSync(file) || readFileSync(file).length < 10_000) throw new Error(`Missing image: ${path}`);
}
const changeCount = candidate.lessons.reduce((sum, lesson, index) => sum + Number(JSON.stringify(lesson) !== JSON.stringify(row.draft_content.lessons[index])), 0);
console.log(JSON.stringify({ draftRevision: row.draft_revision, draftSha256: hash, status: row.status,
  changedLessons: changeCount, imageAssets: paths.size, coverStyle: candidate.theme.coverStyle,
  publishedVersionPreserved: row.published_version_id }, null, 2));
if (!process.argv.includes("--apply")) process.exit(0);
const expected = process.argv.find((arg) => arg.startsWith("--expect-draft-sha256="))?.split("=")[1];
if (expected !== hash) throw new Error("Draft changed or no fresh hash supplied. Re-run the preview.");

const mapped = new Map();
for (const path of paths) {
  const bytes = readFileSync(resolve(root, "public", path.slice(1)));
  const digest = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  const storagePath = `courses/german-b1-complete/images/${digest}/${basename(path)}`;
  const { data: existing, error: assetError } = await db.from("academy_assets").select("public_url").eq("storage_path", storagePath).maybeSingle();
  if (assetError) throw assetError;
  if (existing) { mapped.set(path, existing.public_url); continue; }
  const { error: uploadError } = await db.storage.from("academy-media").upload(storagePath, bytes, { contentType: "image/png", upsert: false });
  if (uploadError && String(uploadError.statusCode) !== "409") throw uploadError;
  const publicUrl = db.storage.from("academy-media").getPublicUrl(storagePath).data.publicUrl;
  const { error: registerError } = await db.from("academy_assets").upsert({ storage_path: storagePath, public_url: publicUrl,
    media_type: "image", mime_type: "image/png", original_name: basename(path), byte_size: bytes.length,
    alt_text: candidate.lessons.flatMap((lesson) => lesson.blocks).find((block) => block.type === "image" && block.src === path)?.alt || "Erwachsene Lernende im Gespräch auf einer Caféterrasse." }, { onConflict: "storage_path" });
  if (registerError) throw registerError;
  mapped.set(path, publicUrl);
}
candidate.heroImage = mapped.get(candidate.heroImage) || candidate.heroImage;
for (const lesson of candidate.lessons) for (const block of lesson.blocks) {
  if (block.type === "image") block.src = mapped.get(block.src) || block.src;
}
const resolved = validateAcademyCourse(candidate);
if (!resolved.valid) throw new Error(resolved.errors.join("\n"));
// Snapshot the exact current draft and use a revision guard to preserve intervening author edits.
const { error: snapshotError } = await db.from("academy_course_snapshots").insert({ course_id: row.id,
  draft_revision: row.draft_revision, schema_version: row.schema_version, reason: "migration", content: row.draft_content });
if (snapshotError) throw snapshotError;
const { data: updated, error: updateError } = await db.from("academy_courses").update({
  draft_content: candidate, draft_revision: row.draft_revision + 1, updated_at: new Date().toISOString(), autosaved_at: new Date().toISOString(),
}).eq("id", row.id).eq("draft_revision", row.draft_revision).select("draft_revision,published_version_id").maybeSingle();
if (updateError) throw updateError;
if (!updated) throw new Error("Draft changed during upload; no visual update applied. Re-run the preview.");
console.log(JSON.stringify({ applied: true, uploadedImages: mapped.size, ...updated }));
