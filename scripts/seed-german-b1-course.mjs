import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { validateAcademyCourse } from "../lib/academy-course-validation.ts";
import { germanB1Course } from "../lib/german-b1-course.ts";

const root = resolve(import.meta.dirname, "..");
for (const line of (existsSync(resolve(root, ".env.local")) ? readFileSync(resolve(root, ".env.local"), "utf8") : "").split(/\r?\n/)) {
  const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (match && !process.env[match[1]])
    process.env[match[1]] = match[2].replace(/^[ '\"]+|[ '\"]+$/g, "");
}
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) throw new Error("Supabase URL and service role key are required.");
const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
const apply = process.argv.includes("--apply");
const update = process.argv.includes("--update");
const expectedDraftHash = process.argv.find((arg) => arg.startsWith("--expect-draft-sha256="))?.split("=")[1];
const course = structuredClone(germanB1Course);
const validation = validateAcademyCourse(course);
if (!validation.valid) throw new Error(validation.errors.join("\n"));

const audioUrls = new Set([
  ...course.lessons.flatMap((lesson) => lesson.blocks
    .filter((block) => block.type === "audio" && block.url.startsWith("/audio/"))
    .map((block) => block.url)),
  ...course.quiz.filter((question) => question.audioUrl?.startsWith("/audio/"))
    .map((question) => question.audioUrl),
]);
for (const url of audioUrls) {
  const path = resolve(root, "public", url.slice(1));
  if (!existsSync(path) || readFileSync(path).length < 10_000)
    throw new Error(`Missing or empty B1 listening recording: ${url}`);
}
const { data: existing, error: loadError } = await supabase.from("academy_courses")
  .select("id,status,draft_revision,schema_version,published_version_id,draft_content")
  .eq("course_key", course.key).maybeSingle();
if (loadError) throw loadError;
console.log(JSON.stringify({
  action: apply ? update ? "update existing draft" : "create new draft" : "read-only preview",
  key: course.key, existing: Boolean(existing),
  existingStatus: existing?.status || null,
  existingDraftRevision: existing?.draft_revision || null,
  existingDraftSha256: existing?.draft_content
    ? createHash("sha256").update(JSON.stringify(existing.draft_content)).digest("hex") : null,
  coreChapters: course.lessons.filter((lesson) => !lesson.examTrack).length,
  goetheLessons: course.lessons.filter((lesson) => lesson.examTrack === "goethe").length,
  telcLessons: course.lessons.filter((lesson) => lesson.examTrack === "telc").length,
  assessmentQuestions: course.quiz.length,
  audioFiles: audioUrls.size,
  contentSha256: createHash("sha256").update(JSON.stringify(course)).digest("hex"),
}, null, 2));
if (!apply) process.exit(0);
if (existing && !update) throw new Error("B1 course already exists. Use --update with a fresh draft hash after reviewing the preview.");
if (update && !existing) throw new Error("B1 course does not exist yet; omit --update to create it.");
if (update && existing.published_version_id) throw new Error("Refusing to overwrite a published course with the seed script.");
if (update && createHash("sha256").update(JSON.stringify(existing.draft_content)).digest("hex") !== expectedDraftHash)
  throw new Error("Draft changed since the preview. Re-run the read-only preview.");

const mapped = new Map();
for (const url of audioUrls) {
  const path = resolve(root, "public", url.slice(1));
  const bytes = readFileSync(path);
  const digest = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  const storagePath = `courses/${course.key}/audio/${digest}/${basename(path)}`;
  const { data: asset, error: assetError } = await supabase.from("academy_assets")
    .select("public_url").eq("storage_path", storagePath).maybeSingle();
  if (assetError) throw assetError;
  if (asset) {
    mapped.set(url, asset.public_url);
    continue;
  }
  const { error: uploadError } = await supabase.storage.from("academy-media")
    .upload(storagePath, bytes, { contentType: "audio/mp4", upsert: false });
  if (uploadError && String(uploadError.statusCode) !== "409") throw uploadError;
  const publicUrl = supabase.storage.from("academy-media").getPublicUrl(storagePath).data.publicUrl;
  const { error: registerError } = await supabase.from("academy_assets").upsert({
    storage_path: storagePath, public_url: publicUrl, media_type: "audio",
    mime_type: "audio/mp4", original_name: basename(path), byte_size: bytes.length,
  }, { onConflict: "storage_path" });
  if (registerError) throw registerError;
  mapped.set(url, publicUrl);
}
for (const lesson of course.lessons)
  for (const item of lesson.blocks)
    if (item.type === "audio") item.url = mapped.get(item.url) || item.url;
for (const question of course.quiz)
  if (question.audioUrl) question.audioUrl = mapped.get(question.audioUrl) || question.audioUrl;
const resolved = validateAcademyCourse(course);
if (!resolved.valid) throw new Error(resolved.errors.join("\n"));

const now = new Date().toISOString();
const values = {
  course_key: course.key, title: course.title, status: "draft",
  audience_roles: course.audienceRoles, draft_content: course,
  quiz_revision: course.quizRevision, schema_version: course.schemaVersion,
  updated_at: now, autosaved_at: now,
};
if (update) {
  const { error: snapshotError } = await supabase.from("academy_course_snapshots").insert({
    course_id: existing.id, draft_revision: existing.draft_revision,
    schema_version: existing.schema_version, reason: "migration", content: existing.draft_content,
  });
  if (snapshotError) throw snapshotError;
}
const query = update
  ? supabase.from("academy_courses").update({ ...values, draft_revision: Number(existing.draft_revision) + 1 })
    .eq("id", existing.id).eq("draft_revision", existing.draft_revision)
  : supabase.from("academy_courses").insert(values);
const { data: inserted, error: insertError } = await query.select("id,course_key,status,draft_revision").single();
if (insertError) throw insertError;
console.log(JSON.stringify({ [update ? "updated" : "created"]: inserted, uploadedAudioFiles: mapped.size }, null, 2));
