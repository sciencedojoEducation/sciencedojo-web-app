import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getPublishedAcademyCourse } from "@/lib/academy-courses";
import { getTutorAcademyProgress, requireTutorAcademyUser } from "@/lib/tutor-academy-progress";
import { getAcademyJourneyLessonState } from "@/lib/academy-journey";
import { isGermanAcademyCourse } from "@/lib/german-academy-course";
import { getAcademyRecordingFormat } from "@/lib/academy-recording";
import { generateAcademyLanguageFeedback } from "@/lib/academy-language-feedback";

export const runtime = "nodejs";
export const maxDuration = 60;
const attempts = new Map<string, number[]>();
const MAX_AUDIO = 10 * 1024 * 1024;
const reply = (message: string, status: number) => NextResponse.json({ message }, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return reply("Invalid request origin.", 403);
  const length = Number(request.headers.get("content-length"));
  if (length > MAX_AUDIO + 100_000) return reply("Recording is too large (maximum 10 MB).", 413);
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return reply("Please sign in to get feedback.", 401);
  let context;
  let form: FormData;
  try {
    // Bound multipart parsing even when content-length is missing or dishonest.
    const reader = request.body?.getReader();
    if (!reader) return reply("No answer supplied.", 400);
    const chunks: Buffer[] = [];
    let received = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > MAX_AUDIO + 100_000) { await reader.cancel(); return reply("Recording is too large (maximum 10 MB).", 413); }
      chunks.push(Buffer.from(value));
    }
    form = await new Response(Buffer.concat(chunks), { headers: { "Content-Type": request.headers.get("content-type") || "" } }).formData();
    const courseKey = String(form.get("courseKey") || "");
    if (!isGermanAcademyCourse(courseKey)) return reply("Feedback is available for German courses.", 400);
    context = await requireTutorAcademyUser(courseKey);
    const course = await getPublishedAcademyCourse(courseKey);
    const lesson = course?.lessons.find(item => item.id === form.get("lessonId"));
    const block = lesson?.blocks.find(item => item.id === form.get("blockId"));
    if (!course || !lesson || !block || (block.type !== "writing-practice" && block.type !== "speaking-practice")) return reply("Exercise not found.", 404);
    const progress = await getTutorAcademyProgress(courseKey);
    if (getAcademyJourneyLessonState(course, progress, course.lessons.indexOf(lesson))?.locked) return reply("Complete the previous lessons first.", 403);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return reply("Feedback is temporarily unavailable. You can still save your answer and use the model.", 503);
    let text: string | undefined;
    let audio: { mimeType: string; data: string } | undefined;
    if (block.type === "writing-practice") {
      text = String(form.get("text") || "").trim();
      if (!text || text.length > 5000) return reply("Enter an answer of up to 5,000 characters.", 400);
    } else {
      let file: Blob | null = form.get("audio") instanceof File ? form.get("audio") as File : null;
      if (!file && form.get("useSavedAudio") === "true") {
        const { data } = await context.supabase.from("academy_learner_submissions").select("audio_path").eq("user_id", user.id).eq("course_key", courseKey).eq("lesson_id", lesson.id).eq("block_id", block.id).maybeSingle();
        if (!data?.audio_path?.startsWith(`${user.id}/`)) return reply("No saved recording found.", 404);
        const download = await context.supabase.storage.from("academy-learner-audio").download(data.audio_path);
        file = download.data;
      }
      if (!file || !file.size || file.size > MAX_AUDIO) return reply("Choose a recording of up to 10 MB.", 400);
      const format = getAcademyRecordingFormat(file.type);
      if (!format) return reply("Use a WebM, MP4 or Ogg recording.", 400);
      audio = { mimeType: format.contentType, data: Buffer.from(await file.arrayBuffer()).toString("base64") };
    }
    // Per-instance cooldown limits repeated clicks; this is not a global billing quota.
    const now = Date.now();
    for (const [key, times] of attempts) if (!times.some(time => time > now - 3_600_000)) attempts.delete(key);
    const recent = (attempts.get(user.id) || []).filter(time => time > now - 3_600_000);
    if (recent.length >= 30 || recent.filter(time => time > now - 60_000).length >= 5) return reply("Please wait a little before requesting more feedback.", 429);
    attempts.set(user.id, [...recent, now]);
    try {
      const feedback = await generateAcademyLanguageFeedback({ apiKey, courseTitle: course.title, prompt: block.prompt, checklist: block.checklist, modelAnswer: block.modelAnswer, text, audio });
      return NextResponse.json({ feedback }, { headers: { "Cache-Control": "no-store" } });
    } catch {
      return reply("Feedback could not be generated. Please try again. Your saved work is unaffected.", 503);
    }
  } catch {
    return reply("Unable to access this exercise. Please sign in and reopen the lesson.", 403);
  }
}
