// Changes one draft audio URL only. Never publishes or replaces the original recording.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { germanA1RestructuredCourse } from "../lib/german-a1-restructured-course.ts";
import { validateAcademyCourse } from "../lib/academy-course-validation.ts";

const root = resolve(import.meta.dirname, "..");
for (const line of readFileSync(resolve(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^[ '\"]+|[ '\"]+$/g, "");
}
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } });
const source = germanA1RestructuredCourse.lessons[0].blocks.find((block) => block.type === "audio");
if (!source?.url.endsWith("anmeldung-natural-v2.m4a")) throw new Error("Unexpected replacement source.");
const bytes = readFileSync(resolve(root, "public", source.url.slice(1)));
if (!bytes.length || bytes.length > 20 * 1024 * 1024) throw new Error("Invalid replacement size.");
const digest = createHash("sha256").update(bytes).digest("hex");
const storagePath = `courses/deutsch-a1-komplett/restructured/${digest.slice(0, 16)}/${basename(source.url)}`;
const publicUrl = db.storage.from("academy-media").getPublicUrl(storagePath).data.publicUrl;
const { data: row, error } = await db.from("academy_courses")
  .select("id, draft_content, draft_revision, schema_version, published_version_id")
  .eq("course_key", "deutsch-a1-komplett").single();
if (error) throw error;
const hash = createHash("sha256").update(JSON.stringify(row.draft_content)).digest("hex");
const candidate = structuredClone(row.draft_content);
const targets = candidate.lessons.flatMap((lesson) => lesson.blocks).filter((block) => block.id === source.id);
if (targets.length !== 1 || targets[0].type !== "audio" || targets[0].transcript !== source.transcript)
  throw new Error("Chapter 1 dialogue changed; review the current transcript before replacing audio.");
const previousUrl = targets[0].url;
targets[0].url = publicUrl;
const validation = validateAcademyCourse(candidate);
if (!validation.valid) throw new Error(validation.errors.join("\n"));
console.log(JSON.stringify({ draftRevision: row.draft_revision, draftSha256: hash,
  blockId: source.id, previousUrl, replacementUrl: publicUrl, bytes: bytes.length,
  publishedVersionPreserved: row.published_version_id, alreadyMapped: previousUrl === publicUrl }, null, 2));
if (!process.argv.includes("--apply") || previousUrl === publicUrl) process.exit(0);
const expected = process.argv.find((arg) => arg.startsWith("--expect-draft-sha256="))?.split("=")[1];
if (expected !== hash) throw new Error("Fresh draft hash required; draft may have changed.");
const { error: uploadError } = await db.storage.from("academy-media").upload(storagePath, bytes,
  { contentType: "audio/mp4", upsert: false });
if (uploadError && String(uploadError.statusCode) !== "409") throw uploadError;
const playback = await fetch(publicUrl);
if (!playback.ok || createHash("sha256").update(Buffer.from(await playback.arrayBuffer())).digest("hex") !== digest)
  throw new Error("Uploaded playback file does not match the generated recording.");
const { error: assetError } = await db.from("academy_assets").upsert({ storage_path: storagePath,
  public_url: publicUrl, media_type: "audio", mime_type: "audio/mp4",
  original_name: basename(source.url), byte_size: bytes.length }, { onConflict: "storage_path" });
if (assetError) throw assetError;
const { error: snapshotError } = await db.from("academy_course_snapshots").insert({
  course_id: row.id, draft_revision: row.draft_revision, schema_version: row.schema_version,
  reason: "migration", content: row.draft_content });
if (snapshotError) throw snapshotError;
const now = new Date().toISOString();
const { data: saved, error: saveError } = await db.from("academy_courses").update({
  draft_content: candidate, draft_revision: row.draft_revision + 1, autosaved_at: now, updated_at: now,
}).eq("id", row.id).eq("draft_revision", row.draft_revision)
  .select("draft_revision, published_version_id").maybeSingle();
if (saveError) throw saveError;
if (!saved) throw new Error("Draft changed during save; no course content was overwritten.");
console.log(JSON.stringify({ applied: true, ...saved }));
