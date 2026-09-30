"use server";

import { getPublishedAcademyCourse } from "@/lib/academy-courses";
import { getAcademyJourneyLessonState } from "@/lib/academy-journey";
import { isAcademyBlockRequiredForCompletion, type LessonBlock } from "@/lib/tutor-academy";
import { getTutorAcademyProgress, requireTutorAcademyUser } from "@/lib/tutor-academy-progress";
import { recordAcademyBlockCompletion } from "@/app/dashboard/tutor/academy/actions";
import { getAcademyRecordingFormat } from "@/lib/academy-recording";

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
  return { course, lesson, block };
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
  const { course, lesson } = await requirePracticeBlock(courseKey, lessonId, blockId, "writing-practice");
  const progress = await getTutorAcademyProgress(courseKey);
  if (getAcademyJourneyLessonState(course, progress, course.lessons.indexOf(lesson))?.locked)
    return { ok: false, message: "Schließen Sie zuerst die vorherigen Lektionen ab und wählen Sie gegebenenfalls Ihren Prüfungsweg." };
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
  const completion = await recordAcademyBlockCompletion(courseKey, blockId);
  if (completion.error)
    return { ok: false, message: "Die Antwort wurde gespeichert, aber der Lernfortschritt nicht. Bitte speichern Sie erneut." };
  return { ok: true, message: "Antwort gespeichert.", updatedAt: now };
}

export async function saveAcademySpeakingSubmission(formData: FormData) {
  const courseKey = String(formData.get("courseKey") || "");
  const lessonId = String(formData.get("lessonId") || "");
  const blockId = String(formData.get("blockId") || "");
  const durationSeconds = Math.ceil(Number(formData.get("durationSeconds") || 0));
  const file = formData.get("audio");
  const { course, lesson } = await requirePracticeBlock(courseKey, lessonId, blockId, "speaking-practice");
  const progress = await getTutorAcademyProgress(courseKey);
  if (getAcademyJourneyLessonState(course, progress, course.lessons.indexOf(lesson))?.locked)
    return { ok: false, message: "Schließen Sie zuerst die vorherigen Lektionen ab und wählen Sie gegebenenfalls Ihren Prüfungsweg." };
  if (!(file instanceof File)) return { ok: false, message: "Keine Aufnahme ausgewählt." };
  const format = getAcademyRecordingFormat(file.type);
  if (!format || file.size > 10 * 1024 * 1024)
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
  const safeCourse = courseKey.replace(/[^a-z0-9-]/g, "");
  const path = `${user.id}/${safeCourse}/${lessonId}/${blockId}-${crypto.randomUUID()}.${format.extension}`;
  const { error: uploadError } = await supabase.storage
    .from("academy-learner-audio")
    .upload(path, file, { contentType: format.contentType, upsert: false });
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
  const completion = await recordAcademyBlockCompletion(courseKey, blockId);
  if (completion.error)
    return { ok: false, message: "Die Aufnahme wurde gespeichert, aber der Lernfortschritt nicht. Bitte speichern Sie erneut." };
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
  const { lesson, block } = await requirePracticeBlock(courseKey, lessonId, blockId, "speaking-practice");
  const { supabase, user } = await requireTutorAcademyUser(courseKey);
  const { data: progress, error: progressError } = await supabase
    .from("tutor_academy_progress")
    .select("completed_block_ids, completed_lesson_ids, completed_lessons")
    .eq("user_id", user.id)
    .eq("course_key", courseKey)
    .maybeSingle();
  if (progressError) return { ok: false, message: "Der Lernfortschritt konnte nicht geladen werden. Bitte erneut versuchen." };
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
  let storageRemovalFailed = false;
  if (data?.audio_path) {
    const bucket = supabase.storage.from("academy-learner-audio");
    const { error: firstError } = await bucket.remove([data.audio_path]);
    if (firstError) {
      const { error: retryError } = await bucket.remove([data.audio_path]);
      storageRemovalFailed = Boolean(retryError);
      if (retryError)
        console.error("[tutor-academy] Unable to remove deleted learner audio:", retryError.message);
    }
  }
  if (progress) {
    const required = isAcademyBlockRequiredForCompletion(block);
    const { error: updateError } = await supabase.from("tutor_academy_progress").update({
      completed_block_ids: (progress.completed_block_ids || []).filter((id: string) => id !== blockId),
      ...(required ? {
        completed_lesson_ids: (progress.completed_lesson_ids || []).filter((id: string) => id !== lessonId),
        completed_lessons: (progress.completed_lessons || []).filter((slug: string) => slug !== lesson.slug),
        current_lesson: lesson.slug,
        current_lesson_id: lessonId,
        completed_at: null,
      } : {}),
      updated_at: new Date().toISOString(),
    }).eq("user_id", user.id).eq("course_key", courseKey);
    if (updateError)
      return { ok: false, message: "Die Aufnahme wurde gelöscht, aber der Lernfortschritt konnte nicht aktualisiert werden. Bitte laden Sie die Seite neu." };
  }
  return {
    ok: true,
    message: storageRemovalFailed
      ? "Aufnahme gelöscht, aber die private Audiodatei konnte nicht entfernt werden. Bitte kontaktieren Sie den Support."
      : "Aufnahme gelöscht.",
  };
}
