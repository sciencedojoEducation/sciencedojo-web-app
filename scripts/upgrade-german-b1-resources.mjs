import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { upgradeGermanB1Resources } from "../lib/german-b1-resource-upgrade.ts";
import { styleGermanB1Course } from "../lib/german-b1-visual-design.ts";
import { validateAcademyCourse } from "../lib/academy-course-validation.ts";

const root = resolve(import.meta.dirname, "..");
for (const line of readFileSync(resolve(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^[ '\"]+|[ '\"]+$/g, "");
}
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: row, error } = await db.from("academy_courses").select("id,draft_content,draft_revision,schema_version,status,published_version_id").eq("course_key", "german-b1-complete").single();
if (error) throw error;
const hash = createHash("sha256").update(JSON.stringify(row.draft_content)).digest("hex");
const candidate = styleGermanB1Course(upgradeGermanB1Resources(row.draft_content));
const v = validateAcademyCourse(candidate);
if (!v.valid) throw new Error(v.errors.join("\n"));
const added = candidate.lessons.reduce((sum, lesson, i) => sum + lesson.blocks.length - row.draft_content.lessons[i].blocks.length, 0);
const paths = [...new Set(candidate.lessons.flatMap(lesson => lesson.blocks.filter(b => b.type === "audio" && b.url.startsWith("/audio/german-b1/b1-fresh-")).map(b => b.url)))];
for (const path of paths) if (!existsSync(resolve(root, "public", path.slice(1))) || readFileSync(resolve(root, "public", path.slice(1))).length < 10_000) throw new Error(`Missing fresh recording: ${path}`);
console.log(JSON.stringify({ status: row.status, draftRevision: row.draft_revision, draftSha256: hash, addedBlocks: added, freshRecordings: paths.length, publishedVersionPreserved: row.published_version_id }, null, 2));
if (!process.argv.includes("--apply")) process.exit(0);
const expected = process.argv.find(arg => arg.startsWith("--expect-draft-sha256="))?.split("=")[1];
if (expected !== hash) throw new Error("Run the preview again and supply its current draft hash.");
if (!added) { console.log("Resource upgrade already present; no draft write."); process.exit(0); }
const urls = new Map();
for (const path of paths) {
  const bytes = readFileSync(resolve(root, "public", path.slice(1)));
  const digest = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  const storagePath = `courses/german-b1-complete/audio/${digest}/${basename(path)}`;
  const { data: asset, error: loadError } = await db.from("academy_assets").select("public_url").eq("storage_path", storagePath).maybeSingle();
  if (loadError) throw loadError;
  if (asset) { urls.set(path, asset.public_url); continue; }
  const { error: uploadError } = await db.storage.from("academy-media").upload(storagePath, bytes, { contentType: "audio/mp4", upsert: false });
  if (uploadError && String(uploadError.statusCode) !== "409") throw uploadError;
  const url = db.storage.from("academy-media").getPublicUrl(storagePath).data.publicUrl;
  const { error: assetError } = await db.from("academy_assets").upsert({ storage_path: storagePath, public_url: url, media_type: "audio", mime_type: "audio/mp4", original_name: basename(path), byte_size: bytes.length }, { onConflict: "storage_path" });
  if (assetError) throw assetError;
  urls.set(path, url);
}
for (const lesson of candidate.lessons) for (const block of lesson.blocks) if (block.type === "audio") block.url = urls.get(block.url) || block.url;
const verified = validateAcademyCourse(candidate);
if (!verified.valid) throw new Error(verified.errors.join("\n"));
const { error: snapshotError } = await db.from("academy_course_snapshots").insert({ course_id: row.id, draft_revision: row.draft_revision, schema_version: row.schema_version, reason: "migration", content: row.draft_content });
if (snapshotError) throw snapshotError;
const now = new Date().toISOString();
const { data: updated, error: updateError } = await db.from("academy_courses").update({ draft_content: candidate, draft_revision: row.draft_revision + 1, updated_at: now, autosaved_at: now }).eq("id", row.id).eq("draft_revision", row.draft_revision).select("draft_revision,status,published_version_id").maybeSingle();
if (updateError) throw updateError;
if (!updated) throw new Error("An author changed the draft during upload. No course update was applied; run the preview again.");
console.log(JSON.stringify({ applied: true, addedBlocks: added, uploadedRecordings: urls.size, ...updated }));
