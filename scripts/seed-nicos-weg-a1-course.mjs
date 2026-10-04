import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve, basename } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { nicosWegA1Course } from "../lib/nicos-weg-a1-course.ts";
import { validateAcademyCourse } from "../lib/academy-course-validation.ts";

const root = resolve(import.meta.dirname, "..");
for (const line of (existsSync(resolve(root, ".env.local")) ? readFileSync(resolve(root, ".env.local"), "utf8") : "").split(/\r?\n/)) {
  const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^[ '\"]+|[ '\"]+$/g, "");
}
const course = structuredClone(nicosWegA1Course);
const check = validateAcademyCourse(course);
if (!check.valid) throw new Error(check.errors.join("\n"));
const images = new Set(course.lessons.flatMap((lesson) => lesson.blocks.filter((block) => block.type === "image").map((block) => block.src)));
const pdf = "/documents/nicos-weg-a1-visual-coursebook.pdf";
const assets = [...images, pdf];
for (const asset of assets) if (!existsSync(resolve(root, "public", asset.slice(1)))) throw new Error(`Missing asset: ${asset}`);
console.log(JSON.stringify({ key: course.key, title: course.title, lessons: course.lessons.length, sceneClips: 12, coursebookExercises: 36, assets: assets.length, valid: true, mode: process.argv.includes("--apply") ? "create draft" : "local validation" }));
if (!process.argv.includes("--apply")) process.exit(0);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Supabase URL and service key are required.");
const supabase = createClient(url, key, { auth: { persistSession: false } });
const { data: existing, error: readError } = await supabase.from("academy_courses").select("id,status").eq("course_key", course.key).maybeSingle();
if (readError) throw readError;
if (existing) throw new Error("This course already exists. Edit the existing draft in the academy builder; this script never overwrites it.");
const mapped = new Map();
for (const asset of assets) {
  const bytes = readFileSync(resolve(root, "public", asset.slice(1)));
  const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  const storagePath = `courses/${course.key}/${hash}/${basename(asset)}`;
  const mime = asset.endsWith(".pdf") ? "application/pdf" : asset.endsWith(".png") ? "image/png" : "image/jpeg";
  const { data: registered, error: findError } = await supabase.from("academy_assets").select("public_url").eq("storage_path", storagePath).maybeSingle();
  if (findError) throw findError;
  if (registered) { mapped.set(asset, registered.public_url); continue; }
  const { error: uploadError } = await supabase.storage.from("academy-media").upload(storagePath, bytes, { contentType: mime, upsert: false });
  if (uploadError && String(uploadError.statusCode) !== "409") throw uploadError;
  const publicUrl = supabase.storage.from("academy-media").getPublicUrl(storagePath).data.publicUrl;
  const { error: registerError } = await supabase.from("academy_assets").upsert({ storage_path: storagePath, public_url: publicUrl, media_type: mime === "application/pdf" ? "document" : "image", mime_type: mime, original_name: basename(asset), byte_size: bytes.length }, { onConflict: "storage_path" });
  if (registerError) throw registerError;
  mapped.set(asset, publicUrl);
}
course.heroImage = mapped.get(course.heroImage);
for (const lesson of course.lessons) for (const block of lesson.blocks) {
  if (block.type === "image") block.src = mapped.get(block.src) || block.src;
  if (block.type === "resources") for (const item of block.items) if (item.url.endsWith(pdf)) item.url = mapped.get(pdf);
}
const resolvedCheck = validateAcademyCourse(course);
if (!resolvedCheck.valid) throw new Error(resolvedCheck.errors.join("\n"));
const { data, error } = await supabase.from("academy_courses").insert({ course_key: course.key, title: course.title, status: "draft", audience_roles: course.audienceRoles, draft_content: course, quiz_revision: 1, schema_version: course.schemaVersion, draft_revision: 1, autosaved_at: new Date().toISOString() }).select("id,course_key,status").single();
if (error) throw error;
console.log(JSON.stringify({ created: data, uploadedAssets: mapped.size, preview: `https://www.sciencedojo.co.uk/dashboard/admin/academy/${course.key}/preview` }));
