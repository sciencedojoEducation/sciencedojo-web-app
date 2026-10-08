import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { nicosWegA2Course } from "../lib/nicos-weg-a2-course.ts";
import { nicosWegB1Course } from "../lib/nicos-weg-b1-course.ts";
import { validateAcademyCourse } from "../lib/academy-course-validation.ts";

const courses = structuredClone([nicosWegA2Course, nicosWegB1Course]);
for (const course of courses) {
  const validation = validateAcademyCourse(course);
  if (!validation.valid) throw new Error(validation.errors.join("\n"));
  console.log(JSON.stringify({ key: course.key, lessons: course.lessons.length, videos: course.lessons.flatMap(l => l.blocks).filter(b => b.type === "video").length, vocabulary: course.lessons.flatMap(l => l.blocks).filter(b => b.type === "flashcards").reduce((sum, b) => sum + b.items.length, 0), valid: true }));
}
if (!process.argv.includes("--apply") && !process.argv.includes("--inspect")) process.exit(0);
if (existsSync(".env.local")) for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^[ '\"]+|[ '\"]+$/g, "");
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase configuration is required.");
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const fingerprint = course => {
  const project = q => ({ id: q.id, type: q.type || "single-choice", prompt: q.prompt, options: q.options.map(({id,label}) => ({id,label})), correctOptionId: q.correctOptionId, correctOptionIds: q.correctOptionIds || [], weight: q.weight || 1 });
  return createHash("sha256").update(JSON.stringify({ passMark: course.passMark || 80, required: course.rules?.requireFinalAssessment ?? true, quiz: course.quiz.map(project), inline: course.lessons.flatMap(l => l.blocks.filter(b => b.type === "knowledge-check").map(b => project(b.question))) })).digest("hex");
};
for (const course of courses) {
  if (!process.argv.includes("--inspect")) {
    const assets = new Set([course.heroImage, ...course.lessons.flatMap(l => l.blocks.filter(b => b.type === "image").map(b => b.src))]);
    const mapped = new Map();
    for (const asset of assets) {
      const bytes = readFileSync(`public${asset}`);
      const hash = createHash("sha256").update(bytes).digest("hex").slice(0,16);
      const name = asset.split("/").pop();
      const path = `courses/${course.key}/${hash}/${name}`;
      const { error } = await db.storage.from("academy-media").upload(path, bytes, {contentType:"image/webp",upsert:false});
      if (error && String(error.statusCode) !== "409") throw error;
      const publicUrl = db.storage.from("academy-media").getPublicUrl(path).data.publicUrl;
      const { error: registrationError } = await db.from("academy_assets").upsert({storage_path:path,public_url:publicUrl,media_type:"image",mime_type:"image/webp",original_name:name,byte_size:bytes.length},{onConflict:"storage_path"});
      if (registrationError) throw registrationError;
      mapped.set(asset,publicUrl);
    }
    course.heroImage = mapped.get(course.heroImage);
    for (const lesson of course.lessons) for (const block of lesson.blocks) if (block.type === "image") block.src = mapped.get(block.src);
    const resolvedValidation = validateAcademyCourse(course);
    if (!resolvedValidation.valid) throw new Error(resolvedValidation.errors.join("\n"));
  }
  const {data: existing, error: readError} = await db.from("academy_courses").select("id,status,draft_content,published_version_id,draft_revision").eq("course_key",course.key).maybeSingle();
  if (readError) throw readError;
  if (process.argv.includes("--inspect")) {
    let published = null;
    if (existing?.published_version_id) {
      const {data: version,error} = await db.from("academy_course_versions").select("content").eq("id",existing.published_version_id).single();
      if (error) throw error;
      const check = validateAcademyCourse(version.content);
      if (!check.valid) throw new Error(check.errors.join("\n"));
      const images = version.content.lessons.flatMap(l => l.blocks.filter(b => b.type === "image"));
      if (images.some(b => !b.src.includes("/storage/v1/object/public/academy-media/courses/"))) throw new Error("Unresolved published image");
      published = {lessons:version.content.lessons.length,images:images.length,valid:true};
    }
    console.log(JSON.stringify({key:course.key,existing:existing ? {id:existing.id,status:existing.status,published} : null}));
    continue;
  }
  // Compare JSON semantically: Postgres JSONB does not preserve object-key order.
  const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => [k,canonical(v)])) : value;
  const same = (a,b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
  const serializedCourse = JSON.parse(JSON.stringify(course));
  if (existing && !same(existing.draft_content, serializedCourse)) throw new Error(`Refusing to overwrite an existing or edited course: ${course.key}`);
  let row = existing;
  if (!row) {
    const {data, error} = await db.from("academy_courses").insert({ course_key: course.key, title: course.title, status: "draft", audience_roles: course.audienceRoles, draft_content: course, quiz_revision: 1, schema_version: course.schemaVersion, draft_revision: 1, autosaved_at: new Date().toISOString() }).select("id,status,published_version_id,draft_revision").single();
    if (error) throw error;
    row = data;
  }
  if (!process.argv.includes("--publish") || row.published_version_id) { console.log(JSON.stringify({key:course.key, status:row.status, id:row.id})); continue; }
  const hash = fingerprint(course);
  const { data: savedVersions, error: versionsError } = await db.from("academy_course_versions").select("id,content").eq("course_id",row.id);
  if (versionsError) throw versionsError;
  if (savedVersions.some(v => !same(v.content, serializedCourse))) throw new Error("Existing version differs; review in the builder.");
  let version = savedVersions[0];
  if (!version) {
    const {error: snapshotError} = await db.from("academy_course_snapshots").insert({course_id:row.id,draft_revision:row.draft_revision,schema_version:course.schemaVersion,reason:"publish",content:course});
    if (snapshotError) throw snapshotError;
    const {data,error} = await db.from("academy_course_versions").insert({course_id:row.id,version_number:1,quiz_revision:1,schema_version:course.schemaVersion,assessment_fingerprint:hash,content:course}).select("id").single();
    if (error) throw error;
    version=data;
  }
  const now=new Date().toISOString();
  const {data: activated,error: activationError} = await db.from("academy_courses").update({status:"published",published_version_id:version.id,published_at:now,updated_at:now,assessment_fingerprint:hash}).eq("id",row.id).eq("status","draft").eq("draft_revision",row.draft_revision).is("published_version_id",null).select("id,status,published_version_id").single();
  if (activationError) throw activationError;
  console.log(JSON.stringify({key:course.key,...activated,url:`https://www.sciencedojo.co.uk/dashboard/academy/${course.key}`}));
}
