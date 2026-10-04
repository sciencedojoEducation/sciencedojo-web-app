import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { nicosWegA1Course } from "../lib/nicos-weg-a1-course.ts";
import { colorNicosWegA1Document } from "../lib/nicos-weg-a1-colors.ts";
import { validateAcademyCourse } from "../lib/academy-course-validation.ts";

const root = resolve(import.meta.dirname, "..");
for (const line of readFileSync(resolve(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^[ '\"]+|[ '\"]+$/g, "");
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase credentials are required.");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: row, error } = await supabase.from("academy_courses").select("id,status,draft_revision,schema_version,draft_content").eq("course_key", nicosWegA1Course.key).single();
if (error) throw error;
if (!["draft", "published"].includes(row.status)) throw new Error("Colour updates require an editable course draft.");
const hash = createHash("sha256").update(JSON.stringify(row.draft_content)).digest("hex");
const candidate = structuredClone(row.draft_content);
let changed = 0;
for (const lesson of candidate.lessons) {
  if (!lesson.id.startsWith("nico-a1-") || lesson.id === "nico-a1-review") continue;
  for (const block of lesson.blocks) {
    if (block.type !== "text" || !block.content || !/(?:-grammar|-models)$/.test(block.id)) continue;
    const colored = colorNicosWegA1Document(block.content, block.id.endsWith("-models"));
    if (JSON.stringify(colored) === JSON.stringify(block.content)) continue;
    block.content = colored;
    changed++;
  }
}
const validation = validateAcademyCourse(candidate);
if (!validation.valid) throw new Error(validation.errors.join("\n"));
console.log(JSON.stringify({ courseKey: nicosWegA1Course.key, draftRevision: row.draft_revision, draftSha256: hash, coloredBlocks: changed, valid: true, apply: process.argv.includes("--apply") }));
if (!process.argv.includes("--apply") || !changed) process.exit(0);
const expected = process.argv.find((arg) => arg.startsWith("--expect-draft-sha256="))?.split("=")[1];
if (expected !== hash) throw new Error("Provide the current draft hash from the read-only preview.");
const snapshot = await supabase.from("academy_course_snapshots").insert({ course_id: row.id, draft_revision: row.draft_revision, schema_version: row.schema_version, reason: "migration", content: row.draft_content });
if (snapshot.error) throw snapshot.error;
const update = await supabase.from("academy_courses").update({ draft_content: candidate, draft_revision: row.draft_revision + 1, updated_at: new Date().toISOString(), autosaved_at: new Date().toISOString() }).eq("id", row.id).eq("draft_revision", row.draft_revision).eq("status", row.status).select("id,draft_revision").single();
if (update.error) throw update.error;
console.log(JSON.stringify({ updated: update.data, coloredBlocks: changed }));
