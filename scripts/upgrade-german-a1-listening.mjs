import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { buildGermanA1ListeningUpgrade } from "../lib/german-a1-listening-upgrade.ts";
import { checkA1ListeningReadiness, germanA1ListeningUpgradeManifest } from "../lib/german-a1-listening-readiness.ts";
import { validateAcademyCourse } from "../lib/academy-course-validation.ts";

const root = resolve(import.meta.dirname, "..");
const localPath = url => resolve(root, "public", url.slice(1));
const readiness = checkA1ListeningReadiness(url => existsSync(localPath(url)) ? readFileSync(localPath(url)) : null);
console.log(JSON.stringify({ audioReadiness: readiness }, null, 2));
if (process.argv.includes("--check-audio")) process.exit(readiness.ready ? 0 : 1);
if (!readiness.ready) throw new Error("No draft or storage changes made. Generate all missing audio before continuing.");
for (const track of germanA1ListeningUpgradeManifest) {
  const probe = spawnSync("/usr/bin/afinfo", [localPath(track.outputPath)], { encoding: "utf8" });
  const seconds = Number(probe.stdout?.match(/estimated duration:\s*([\d.]+) sec/)?.[1]);
  if (probe.status !== 0 || !Number.isFinite(seconds) || seconds <= 0 || seconds > 180)
    throw new Error(`Invalid or excessive audio duration: ${track.outputPath}`);
}
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const apply = process.argv.includes("--apply");
const expected = process.argv.find(arg => arg.startsWith("--expect-draft-sha256="))?.split("=")[1];
if (apply && !expected) throw new Error("Writes require the hash from a fresh read-only preview.");
const { data: row, error } = await client.from("academy_courses")
  .select("id,status,draft_revision,draft_content,published_version_id,schema_version")
  .eq("course_key", "deutsch-a1-komplett").single();
if (error) throw error;
const hash = createHash("sha256").update(JSON.stringify(row.draft_content)).digest("hex");
if (apply && expected !== hash) throw new Error("Draft changed; preview again.");
const candidate = buildGermanA1ListeningUpgrade(row.draft_content);
const added = candidate.lessons.reduce((sum, lesson, index) => sum + lesson.blocks.length - row.draft_content.lessons[index].blocks.length, 0);
for (const [index, original] of row.draft_content.lessons.entries()) {
  const ids = new Set(original.blocks.map(block => block.id));
  if (JSON.stringify(candidate.lessons[index].blocks.filter(block => ids.has(block.id))) !== JSON.stringify(original.blocks))
    throw new Error(`Existing block content or order changed: ${original.id}`);
}
const validation = validateAcademyCourse(candidate);
if (!validation.valid) throw new Error(validation.errors.join("\n"));
console.log(JSON.stringify({ draftRevision: row.draft_revision, draftSha256: hash, addedBlocks: added,
  publishedVersionPreserved: row.published_version_id, action: apply ? "save draft only" : "read-only preview" }, null, 2));
if (!apply || !added) process.exit(0);
const mapping = new Map();
for (const track of germanA1ListeningUpgradeManifest) {
  const bytes = readFileSync(localPath(track.outputPath));
  const digest = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  const path = `courses/deutsch-a1-komplett/listening-upgrade/${digest}/${basename(track.outputPath)}`;
  const { data: asset, error: assetError } = await client.from("academy_assets").select("public_url").eq("storage_path", path).maybeSingle();
  if (assetError) throw assetError;
  let url = asset?.public_url;
  if (!url) {
    const { error: uploadError } = await client.storage.from("academy-media").upload(path, bytes, { contentType: "audio/mp4", upsert: false });
    if (uploadError && String(uploadError.statusCode) !== "409") throw uploadError;
    url = client.storage.from("academy-media").getPublicUrl(path).data.publicUrl;
    const { error: registerError } = await client.from("academy_assets").upsert({ storage_path: path, public_url: url,
      media_type: "audio", mime_type: "audio/mp4", original_name: basename(track.outputPath), byte_size: bytes.length }, { onConflict: "storage_path" });
    if (registerError) throw registerError;
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Uploaded audio is not readable: ${track.outputPath}`);
  if (createHash("sha256").update(Buffer.from(await response.arrayBuffer())).digest("hex").slice(0,16) !== digest)
    throw new Error(`Uploaded audio digest mismatch: ${track.outputPath}`);
  mapping.set(track.outputPath, url);
}
for (const lesson of candidate.lessons) for (const block of lesson.blocks)
  if (block.type === "audio" && mapping.has(block.url)) block.url = mapping.get(block.url);
const { error: snapshotError } = await client.from("academy_course_snapshots").insert({ course_id: row.id,
  draft_revision: row.draft_revision, schema_version: row.schema_version, reason: "migration", content: row.draft_content });
if (snapshotError) throw snapshotError;
const { data: saved, error: saveError } = await client.from("academy_courses").update({ draft_content: candidate,
  draft_revision: row.draft_revision + 1, autosaved_at: new Date().toISOString(), updated_at: new Date().toISOString(),
}).eq("id", row.id).eq("draft_revision", row.draft_revision).select("draft_revision,status,published_version_id").maybeSingle();
if (saveError || !saved) throw new Error(saveError?.message || "Draft changed during save; uploaded assets can be reused on retry.");
if (saved.status !== row.status || saved.published_version_id !== row.published_version_id)
  throw new Error("Publication state unexpectedly changed.");
console.log(`Saved draft revision ${saved.draft_revision}; publication unchanged.`);
