"use server";

import { getPublishedAcademyCourse } from "@/lib/academy-courses";
import type { LessonBlock } from "@/lib/tutor-academy";
import { requireTutorAcademyUser } from "@/lib/tutor-academy-progress";
import { recordAcademyBlockCompletion } from "@/app/dashboard/tutor/academy/actions";

export type AcademyPortfolioSubmission = {
  type: "writing" | "speaking";
  text: string | null;
  audioUrl: string | null;
  durationSeconds: number | null;
  updatedAt: string;
};

type PracticeBlock = Extract<
  LessonBlock,
  { type: "writing-practice" | "speaking-practice" }
>;

async function requirePracticeBlock(
  courseKey: string,
  lessonId: string,
  blockId: string,
  expectedType?: PracticeBlock["type"],
) {
  const course = await getPublishedAcademyCourse(courseKey);
  const lesson = course?.lessons.find((item) => item.id === lessonId);
  const block = lesson?.blocks.find((item) => item.id === blockId);
  if (
    !course ||
    !lesson ||
    !block ||
    (block.type !== "writing-practice" && block.type !== "speaking-practice") ||
    (expectedType && block.type !== expectedType)
  )
    throw new Error("Die Portfolio-Aufgabe wurde nicht gefunden.");
  return block;
}

export async function getAcademyPortfolioSubmission(
  courseKey: string,
  lessonId: string,
  blockId: string,
): Promise<AcademyPortfolioSubmission | null> {
  await requirePracticeBlock(courseKey, lessonId, blockId);
  const { supabase, user } = await requireTutorAcademyUser(courseKey);
  const { data, error } = await supabase
    .from("academy_learner_submissions")
    .select("submission_type, text_response, audio_path, audio_duration_seconds, updated_at")
    .eq("user_id", user.id)
    .eq("course_key", courseKey)
    .eq("lesson_id", lessonId)
    .eq("block_id", blockId)
    .maybeSingle();
  if (error) throw new Error("Die gespeicherte Antwort konnte nicht geladen werden.");
  if (!data) return null;
  let audioUrl: string | null = null;
  if (data.audio_path) {
    const { data: signed } = await supabase.storage
      .from("academy-learner-audio")
      .createSignedUrl(data.audio_path, 3600);
    audioUrl = signed?.signedUrl || null;
  }
  return {
    type: data.submission_type,
    text: data.text_response,
    audioUrl,
    durationSeconds: data.audio_duration_seconds,
    updatedAt: data.updated_at,
  };
}

export async function saveAcademyWritingSubmission(
  courseKey: string,
  lessonId: string,
  blockId: string,
  text: string,
) {
  await requirePracticeBlock(courseKey, lessonId, blockId, "writing-practice");
  const response = text.trim();
  if (!response || response.length > 5000)
    return { ok: false, message: "Schreiben Sie eine Antwort mit höchstens 5.000 Zeichen." };
  const { supabase, user } = await requireTutorAcademyUser(courseKey);
  const now = new Date().toISOString();
  const { error } = await supabase.from("academy_learner_submissions").upsert(
    {
      user_id: user.id,
      course_key: courseKey,
      lesson_id: lessonId,
      block_id: blockId,
      submission_type: "writing",
      text_response: response,
      audio_path: null,
      audio_duration_seconds: null,
      updated_at: now,
    },
    { onConflict: "user_id,course_key,lesson_id,block_id" },
  );
  if (error) return { ok: false, message: "Die Antwort konnte nicht gespeichert werden." };
  await recordAcademyBlockCompletion(courseKey, blockId);
  return { ok: true, message: "Antwort gespeichert.", updatedAt: now };
}

export async function saveAcademySpeakingSubmission(formData: FormData) {
  const courseKey = String(formData.get("courseKey") || "");
  const lessonId = String(formData.get("lessonId") || "");
  const blockId = String(formData.get("blockId") || "");
  const durationSeconds = Math.ceil(Number(formData.get("durationSeconds") || 0));
  const file = formData.get("audio");
  await requirePracticeBlock(courseKey, lessonId, blockId, "speaking-practice");
  if (!(file instanceof File)) return { ok: false, message: "Keine Aufnahme ausgewählt." };
  const allowed = new Set(["audio/webm", "audio/mp4", "audio/ogg"]);
  if (!allowed.has(file.type) || file.size > 10 * 1024 * 1024)
    return { ok: false, message: "Die Aufnahme muss WebM, MP4 oder Ogg und höchstens 10 MB groß sein." };
  if (!Number.isFinite(durationSeconds) || durationSeconds < 1 || durationSeconds > 180)
    return { ok: false, message: "Die Aufnahme muss zwischen 1 und 180 Sekunden lang sein." };

  const { supabase, user } = await requireTutorAcademyUser(courseKey);
  const { data: existing } = await supabase
    .from("academy_learner_submissions")
    .select("audio_path")
    .eq("user_id", user.id)
    .eq("course_key", courseKey)
    .eq("lesson_id", lessonId)
    .eq("block_id", blockId)
    .maybeSingle();
  const extension = file.type === "audio/mp4" ? "m4a" : file.type.split("/")[1];
  const safeCourse = courseKey.replace(/[^a-z0-9-]/g, "");
  const path = `${user.id}/${safeCourse}/${lessonId}/${blockId}-${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("academy-learner-audio")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return { ok: false, message: "Die Aufnahme konnte nicht hochgeladen werden." };
  const now = new Date().toISOString();
  const { error } = await supabase.from("academy_learner_submissions").upsert(
    {
      user_id: user.id,
      course_key: courseKey,
      lesson_id: lessonId,
      block_id: blockId,
      submission_type: "speaking",
      text_response: null,
      audio_path: path,
      audio_duration_seconds: durationSeconds,
      updated_at: now,
    },
    { onConflict: "user_id,course_key,lesson_id,block_id" },
  );
  if (error) {
    await supabase.storage.from("academy-learner-audio").remove([path]);
    return { ok: false, message: "Die Aufnahme konnte nicht gespeichert werden." };
  }
  if (existing?.audio_path && existing.audio_path !== path)
    await supabase.storage.from("academy-learner-audio").remove([existing.audio_path]);
  const { data: signed } = await supabase.storage
    .from("academy-learner-audio")
    .createSignedUrl(path, 3600);
  await recordAcademyBlockCompletion(courseKey, blockId);
  return {
    ok: true,
    message: "Aufnahme gespeichert.",
    updatedAt: now,
    audioUrl: signed?.signedUrl || null,
  };
}

export async function deleteAcademySpeakingSubmission(
  courseKey: string,
  lessonId: string,
  blockId: string,
) {
  await requirePracticeBlock(courseKey, lessonId, blockId, "speaking-practice");
  const { supabase, user } = await requireTutorAcademyUser(courseKey);
  const { data } = await supabase
    .from("academy_learner_submissions")
    .select("audio_path")
    .eq("user_id", user.id)
    .eq("course_key", courseKey)
    .eq("lesson_id", lessonId)
    .eq("block_id", blockId)
    .maybeSingle();
  const { error } = await supabase
    .from("academy_learner_submissions")
    .delete()
    .eq("user_id", user.id)
    .eq("course_key", courseKey)
    .eq("lesson_id", lessonId)
    .eq("block_id", blockId);
  if (error) return { ok: false, message: "Die Aufnahme konnte nicht gelöscht werden." };
  if (data?.audio_path)
    await supabase.storage.from("academy-learner-audio").remove([data.audio_path]);
  return { ok: true, message: "Aufnahme gelöscht." };
}
