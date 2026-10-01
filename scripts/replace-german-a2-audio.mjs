// Replace matching original audio in the latest draft; preserve published content and every other field.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { createClient } from "@supabase/supabase-js";
import { a2AudioRecordings, a2AudioUrl } from "../lib/german-a2-audio.ts";
import { validateAcademyCourse } from "../lib/academy-course-validation.ts";

const root = resolve(import.meta.dirname, "..");
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
for (const line of readFileSync(resolve(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^[ '\"]+|[ '\"]+$/g, "");
}
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {auth:{persistSession:false}});
const localChecks = new Map(JSON.parse(readFileSync(resolve(root,"docs/german-a2-audio-verification/local-checks.json"),"utf8")).map(check=>[check.id,check]));
const replacements = new Map(a2AudioRecordings.map(recording => {
  const path = resolve(root, "public", a2AudioUrl(recording.id).slice(1));
  const bytes = readFileSync(path), sha256 = digest(bytes);
  const metadata = JSON.parse(readFileSync(path + ".json", "utf8"));
  if (bytes.length < 10000 || bytes.length > 20 * 1024 * 1024 || metadata.sha256 !== sha256 || metadata.id !== recording.id || localChecks.get(recording.id)?.sha256 !== sha256)
    throw new Error(`Unverified recording: ${recording.id}`);
  const storagePath = `courses/german-a2-complete/audio/${sha256}/${basename(path)}`;
  return [recording.id, {bytes,sha256,storagePath,
    url:db.storage.from("academy-media").getPublicUrl(storagePath).data.publicUrl,
    transcript:recording.segments.map(segment => segment.text).join("\n\n")}];
}));
const {data:row,error} = await db.from("academy_courses")
  .select("id,draft_content,draft_revision,schema_version,published_version_id,status").eq("course_key","german-a2-complete").single();
if (error) throw error;
const hash = digest(JSON.stringify(row.draft_content)), candidate = structuredClone(row.draft_content);
const normalize = text => text.replace(/\s+/g," ").trim();
const used = new Set();
let changed = 0;
function replace(target, urlField, transcriptField) {
  const filename = basename(new URL(target[urlField], "http://localhost").pathname);
  const id = filename.replace(/(?:-natural-v1)?\.m4a$/, "");
  const recording = replacements.get(id);
  if (!recording) throw new Error(`Unknown A2 recording: ${filename}`);
  if (normalize(target[transcriptField] || "") !== normalize(recording.transcript))
    throw new Error(`Transcript changed for ${id}; refusing to replace author-edited audio.`);
  used.add(id);
  if (target[urlField] !== recording.url) { target[urlField] = recording.url; changed++; }
}
for (const lesson of candidate.lessons) for (const block of lesson.blocks)
  if (block.type === "audio") replace(block, "url", "transcript");
for (const question of candidate.quiz) if (question.audioUrl) replace(question, "audioUrl", "audioTranscript");
if (used.size !== replacements.size) throw new Error("The draft no longer uses all 32 expected recordings; review before replacement.");
const validation = validateAcademyCourse(candidate);
if (!validation.valid) throw new Error(validation.errors.join("\n"));
console.log(JSON.stringify({draftRevision:row.draft_revision,draftSha256:hash,recordings:used.size,changedReferences:changed,
  publishedVersionPreserved:row.published_version_id},null,2));
if (!process.argv.includes("--apply") || !changed) process.exit(0);
if (process.argv.find(arg => arg.startsWith("--expect-draft-sha256="))?.split("=")[1] !== hash)
  throw new Error("A fresh draft hash is required.");
for (const recording of replacements.values()) {
  const {error:uploadError} = await db.storage.from("academy-media").upload(recording.storagePath,recording.bytes,{contentType:"audio/mp4",upsert:false});
  if (uploadError && String(uploadError.statusCode) !== "409") throw uploadError;
  const playback = await fetch(recording.url);
  if (!playback.ok || digest(Buffer.from(await playback.arrayBuffer())) !== recording.sha256)
    throw new Error("Uploaded recording differs from verified local audio.");
  const {error:assetError} = await db.from("academy_assets").upsert({storage_path:recording.storagePath,public_url:recording.url,
    media_type:"audio",mime_type:"audio/mp4",original_name:basename(recording.storagePath),byte_size:recording.bytes.length},{onConflict:"storage_path"});
  if (assetError) throw assetError;
}
const {error:snapshotError} = await db.from("academy_course_snapshots").insert({course_id:row.id,draft_revision:row.draft_revision,
  schema_version:row.schema_version,reason:"migration",content:row.draft_content});
if (snapshotError) throw snapshotError;
const {data:saved,error:saveError} = await db.from("academy_courses").update({draft_content:candidate,
  draft_revision:row.draft_revision+1,updated_at:new Date().toISOString()}).eq("id",row.id).eq("draft_revision",row.draft_revision)
  .select("draft_revision,published_version_id,status").maybeSingle();
if (saveError) throw saveError;
if (!saved) throw new Error("Draft changed during update; no content overwritten.");
const {data:verify,error:verifyError} = await db.from("academy_courses").select("draft_content,published_version_id").eq("id",row.id).single();
if (verifyError) throw verifyError;
if (!isDeepStrictEqual(verify.draft_content,candidate) || verify.published_version_id !== row.published_version_id)
  throw new Error("Readback differs from the intended draft-only audio replacement.");
console.log(JSON.stringify({applied:true,verified:true,...saved}));
