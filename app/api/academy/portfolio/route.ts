import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getPublishedAcademyCourse } from "@/lib/academy-courses";
import { requireTutorAcademyUser } from "@/lib/tutor-academy-progress";
import type { AcademyPortfolioSubmission } from "@/app/dashboard/academy/portfolio-actions";

const reply = (body: unknown, status = 200) => NextResponse.json(body, {
  status,
  headers: { "Cache-Control": "private, no-store" },
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const courseKey = searchParams.get("courseKey");
  const lessonId = searchParams.get("lessonId");
  if (!courseKey || !lessonId || courseKey.length > 200 || lessonId.length > 200)
    return reply({ error: "Invalid lesson." }, 400);

  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return reply({ error: "Please sign in." }, 401);
  // Keep the same course-access checks as submission reads and mutations.
  const { supabase } = await requireTutorAcademyUser(courseKey);
  const course = await getPublishedAcademyCourse(courseKey);
  const lesson = course?.lessons.find(item => item.id === lessonId);
  if (!lesson) return reply({ error: "Lesson not found." }, 404);
  const blockIds = lesson.blocks.flatMap(block => block.id &&
    (block.type === "writing-practice" || block.type === "speaking-practice") ? [block.id] : []);
  if (!blockIds.length) return reply({ submissions: {} });

  const { data, error } = await supabase.from("academy_learner_submissions")
    .select("block_id, submission_type, text_response, audio_path, audio_duration_seconds, updated_at")
    .eq("user_id", user.id).eq("course_key", courseKey).eq("lesson_id", lessonId).in("block_id", blockIds);
  if (error) return reply({ error: "Saved answers could not be loaded." }, 500);
  const paths = [...new Set((data || []).flatMap(row =>
    row.audio_path?.startsWith(`${user.id}/`) ? [row.audio_path as string] : []))];
  const signed = paths.length
    ? await supabase.storage.from("academy-learner-audio").createSignedUrls(paths, 3600)
    : null;
  if (signed?.error) return reply({ error: "Saved recordings could not be loaded." }, 500);
  const urls = new Map(signed?.data?.map(item => [item.path, item.signedUrl]));
  const submissions: Record<string, AcademyPortfolioSubmission> = {};
  for (const row of data || []) {
    submissions[row.block_id] = {
      type: row.submission_type,
      text: row.text_response,
      audioUrl: row.audio_path ? urls.get(row.audio_path) || null : null,
      durationSeconds: row.audio_duration_seconds,
      updatedAt: row.updated_at,
    };
  }
  return reply({ submissions });
}
