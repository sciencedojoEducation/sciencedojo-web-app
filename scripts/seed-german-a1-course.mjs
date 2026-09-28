import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { germanA1AudioManifest, germanA1Course } from "../lib/german-a1-course.ts";
import { validateAcademyCourse } from "../lib/academy-course-validation.ts";

const root = resolve(import.meta.dirname, "..");
for (const line of readFileSync(resolve(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
const supabase = createClient(url, key, { auth: { persistSession: false } });
const replace = process.argv.includes("--replace");
const mergeVocabularyCards = process.argv.includes("--merge-vocabulary-cards");
const mergeAudio = process.argv.includes("--merge-audio");
const mergeLessonArgument = process.argv.find((argument) => argument.startsWith("--merge-lesson="));
const mergeLessonId = mergeLessonArgument?.split("=")[1];
const audioStartArgument = process.argv.find((argument) => argument.startsWith("--audio-start="));
const audioCountArgument = process.argv.find((argument) => argument.startsWith("--audio-count="));
const audioStart = audioStartArgument ? Number(audioStartArgument.split("=")[1]) : 0;
const audioCount = audioCountArgument
  ? Number(audioCountArgument.split("=")[1])
  : germanA1AudioManifest.length - audioStart;
if (!Number.isInteger(audioStart) || audioStart < 0 || !Number.isInteger(audioCount) || audioCount < 1)
  throw new Error("Audio range must use non-negative --audio-start and positive --audio-count integers.");
const useLocalAudio = process.argv.includes("--local-audio");
const course = structuredClone(germanA1Course);

const { data: existing, error: loadError } = await supabase
  .from("academy_courses")
  .select("id, status, draft_content")
  .eq("course_key", course.key)
  .maybeSingle();
if (loadError) throw loadError;
if (existing && !replace && !mergeVocabularyCards && !mergeAudio && !mergeLessonId) {
  console.log(`Course ${course.key} already exists (${existing.status}); no changes made. Use --replace explicitly to overwrite its draft.`);
  process.exit(0);
}
if (mergeLessonId) {
  if (!existing?.draft_content) throw new Error(`Course ${course.key} does not have an existing draft to update.`);
  const sourceLesson = course.lessons.find((lesson) => lesson.id === mergeLessonId);
  if (!sourceLesson) throw new Error(`Source lesson ${mergeLessonId} does not exist.`);
  const draft = structuredClone(existing.draft_content);
  const lessonIndex = draft.lessons?.findIndex((lesson) => lesson.id === mergeLessonId) ?? -1;
  if (lessonIndex < 0) throw new Error(`Draft lesson ${mergeLessonId} does not exist.`);
  const currentLesson = draft.lessons[lessonIndex];
  const currentBlocks = new Map(currentLesson.blocks.map((block) => [block.id, block]));
  const mergedBlocks = structuredClone(sourceLesson.blocks).map((block) => {
    const currentBlock = currentBlocks.get(block.id);
    if (block.type === "audio" && currentBlock?.type === "audio")
      return { ...block, url: currentBlock.url };
    return block;
  });
  draft.lessons[lessonIndex] = {
    ...currentLesson,
    ...structuredClone(sourceLesson),
    blocks: mergedBlocks,
  };
  draft.estimatedMinutes = course.estimatedMinutes;
  const validation = validateAcademyCourse(draft);
  if (!validation.valid)
    throw new Error(`Merged course validation failed:\n${validation.errors.join("\n")}`);
  const { error: mergeError } = await supabase
    .from("academy_courses")
    .update({
      draft_content: draft,
      updated_at: new Date().toISOString(),
      autosaved_at: new Date().toISOString(),
    })
    .eq("id", existing.id);
  if (mergeError) throw mergeError;
  console.log(`Expanded ${mergeLessonId} to ${sourceLesson.blocks.length} blocks in ${course.key}; all other lessons and the mapped audio URL were preserved.`);
  process.exit(0);
}
if (mergeAudio) {
  if (!existing?.draft_content) throw new Error(`Course ${course.key} does not have an existing draft to update.`);
  const draft = structuredClone(existing.draft_content);
  const selectedAudioItems = germanA1AudioManifest.slice(audioStart, audioStart + audioCount);
  const selectedLessonIds = new Set(selectedAudioItems.map((item) => item.lessonId));
  if (selectedAudioItems.length !== audioCount)
    throw new Error(`Requested ${audioCount} audio tracks from index ${audioStart}, but only ${selectedAudioItems.length} exist.`);
  const resolvedAudioUrls = new Map();
  let updatedAudioBlocks = 0;
  for (const sourceLesson of course.lessons) {
    if (!selectedLessonIds.has(sourceLesson.id)) continue;
    const sourceBlock = sourceLesson.blocks.find((block) => block.type === "audio");
    if (!sourceBlock || sourceBlock.type !== "audio" || !sourceBlock.url.startsWith("/audio/")) continue;
    const draftLesson = draft.lessons?.find((lesson) => lesson.id === sourceLesson.id);
    const draftBlock = draftLesson?.blocks?.find((block) => block.id === sourceBlock.id);
    if (!draftBlock || draftBlock.type !== "audio") continue;
    const localPath = resolve(root, "public", sourceBlock.url.replace(/^\/audio\//, "audio/"));
    if (!existsSync(localPath)) throw new Error(`Missing generated audio: ${localPath}`);
    const fileName = basename(localPath);
    const storagePath = `courses/${course.key}/expressive-voices-v3/${fileName}`;
    const bytes = readFileSync(localPath);
    const { error: uploadError } = await supabase.storage
      .from("academy-media")
      .upload(storagePath, bytes, { contentType: "audio/mp4", upsert: true });
    if (uploadError) throw uploadError;
    const publicUrl = supabase.storage.from("academy-media").getPublicUrl(storagePath).data.publicUrl;
    resolvedAudioUrls.set(sourceBlock.url, publicUrl);
    draftBlock.url = publicUrl;
    draftBlock.transcript = sourceBlock.transcript;
    draftBlock.caption = sourceBlock.caption;
    updatedAudioBlocks += 1;
    const { error: assetError } = await supabase.from("academy_assets").upsert({
      storage_path: storagePath,
      public_url: publicUrl,
      media_type: "audio",
      mime_type: "audio/mp4",
      original_name: fileName,
      byte_size: bytes.byteLength,
    }, { onConflict: "storage_path" });
    if (assetError) throw assetError;
  }
  if (updatedAudioBlocks !== audioCount)
    throw new Error(`Expected to update ${audioCount} listening tracks, but matched ${updatedAudioBlocks}. Draft was not changed.`);
  draft.quiz = draft.quiz.map((question) => ({
    ...question,
    audioUrl: question.audioUrl
      ? resolvedAudioUrls.get(question.audioUrl) || question.audioUrl
      : question.audioUrl,
  }));
  const validation = validateAcademyCourse(draft);
  if (!validation.valid)
    throw new Error(`Merged course validation failed:\n${validation.errors.join("\n")}`);
  const { error: mergeError } = await supabase
    .from("academy_courses")
    .update({
      draft_content: draft,
      updated_at: new Date().toISOString(),
      autosaved_at: new Date().toISOString(),
    })
    .eq("id", existing.id);
  if (mergeError) throw mergeError;
  console.log(`Updated ${updatedAudioBlocks} expressive multi-voice listening tracks from index ${audioStart} in ${course.key}; all other draft content was preserved.`);
  process.exit(0);
}
if (mergeVocabularyCards) {
  if (!existing?.draft_content) throw new Error(`Course ${course.key} does not have an existing draft to update.`);
  const draft = structuredClone(existing.draft_content);
  let updatedCards = 0;
  for (const sourceLesson of course.lessons) {
    const sourceBlock = sourceLesson.blocks.find((block) => block.type === "flashcards");
    if (!sourceBlock || sourceBlock.type !== "flashcards") continue;
    const draftLesson = draft.lessons?.find((lesson) => lesson.id === sourceLesson.id);
    const draftBlock = draftLesson?.blocks?.find((block) => block.id === sourceBlock.id);
    if (!draftBlock || draftBlock.type !== "flashcards") continue;
    draftBlock.heading = sourceBlock.heading;
    draftBlock.appearance = sourceBlock.appearance;
    const sourceItems = new Map(sourceBlock.items.map((item) => [item.id, item]));
    draftBlock.items = draftBlock.items.map((item) => {
      const sourceItem = sourceItems.get(item.id);
      if (!sourceItem) return item;
      updatedCards += 1;
      return {
        ...item,
        eyebrow: sourceItem.eyebrow,
        src: sourceItem.src,
        alt: sourceItem.alt,
        sprite: sourceItem.sprite,
        body: sourceItem.body,
      };
    });
  }
  if (updatedCards !== 800)
    throw new Error(`Expected to update 800 vocabulary cards, but matched ${updatedCards}. No changes were saved.`);
  const validation = validateAcademyCourse(draft);
  if (!validation.valid)
    throw new Error(`Merged course validation failed:\n${validation.errors.join("\n")}`);
  const { error: mergeError } = await supabase
    .from("academy_courses")
    .update({
      draft_content: draft,
      updated_at: new Date().toISOString(),
      autosaved_at: new Date().toISOString(),
    })
    .eq("id", existing.id);
  if (mergeError) throw mergeError;
  console.log(`Updated ${updatedCards} vocabulary cards in ${course.key}; all other draft content was preserved.`);
  process.exit(0);
}

for (const lesson of course.lessons) {
  const audio = lesson.blocks.find((block) => block.type === "audio");
  if (!audio || audio.type !== "audio" || !audio.url.startsWith("/audio/")) continue;
  const localPath = resolve(root, "public", audio.url.replace(/^\/audio\//, "audio/"));
  if (!existsSync(localPath)) throw new Error(`Missing generated audio: ${localPath}`);
  if (useLocalAudio) continue;
  const fileName = basename(localPath);
  const storagePath = `courses/${course.key}/${fileName}`;
  const bytes = readFileSync(localPath);
  const { error: uploadError } = await supabase.storage
    .from("academy-media")
    .upload(storagePath, bytes, { contentType: "audio/mp4", upsert: true });
  if (uploadError) throw uploadError;
  const publicUrl = supabase.storage.from("academy-media").getPublicUrl(storagePath).data.publicUrl;
  audio.url = publicUrl;
  await supabase.from("academy_assets").upsert({
    storage_path: storagePath,
    public_url: publicUrl,
    media_type: "audio",
    mime_type: "audio/mp4",
    original_name: fileName,
    byte_size: bytes.byteLength,
  }, { onConflict: "storage_path" });
}

const validation = validateAcademyCourse(course);
if (!validation.valid) throw new Error(`Course validation failed:\n${validation.errors.join("\n")}`);
const values = {
  course_key: course.key,
  title: course.title,
  status: "draft",
  audience_roles: course.audienceRoles,
  draft_content: course,
  quiz_revision: course.quizRevision,
  schema_version: course.schemaVersion,
  updated_at: new Date().toISOString(),
  autosaved_at: new Date().toISOString(),
};
const query = existing
  ? supabase.from("academy_courses").update(values).eq("id", existing.id)
  : supabase.from("academy_courses").insert(values);
const { error } = await query;
if (error) throw error;
console.log(`Seeded ${course.title} as an unpublished draft with ${course.lessons.length} lessons.`);
