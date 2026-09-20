import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  emptyAcademyProgress,
  TUTOR_ACADEMY_COURSE_KEY,
  type AcademyProgress,
} from "@/lib/tutor-academy";

type ProgressRow = {
  completed_lessons?: string[] | null;
  current_lesson?: string | null;
  quiz_attempts?: number | null;
  best_score?: number | null;
  completed_at?: string | null;
};

export function normalizeAcademyProgress(row?: ProgressRow | null): AcademyProgress {
  return {
    completedLessons: Array.isArray(row?.completed_lessons) ? row.completed_lessons : [],
    currentLesson: row?.current_lesson || null,
    quizAttempts: Number(row?.quiz_attempts || 0),
    bestScore: Number(row?.best_score || 0),
    completedAt: row?.completed_at || null,
  };
}

export async function requireTutorAcademyUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/tutor/academy");

  const [{ data: profile }, { data: application }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    supabase.from("applications").select("user_id").eq("user_id", user.id).maybeSingle(),
  ]);

  const isTutor = profile?.role === "tutor" || user.user_metadata?.role === "tutor" || Boolean(application);
  if (!isTutor) redirect(`/dashboard/${profile?.role || user.user_metadata?.role || "user"}`);

  return { supabase, user };
}

export async function getTutorAcademyProgress(): Promise<AcademyProgress> {
  const { supabase, user } = await requireTutorAcademyUser();
  const { data, error } = await supabase
    .from("tutor_academy_progress")
    .select("completed_lessons, current_lesson, quiz_attempts, best_score, completed_at")
    .eq("user_id", user.id)
    .eq("course_key", TUTOR_ACADEMY_COURSE_KEY)
    .maybeSingle();

  if (error) {
    console.error("[tutor-academy] Unable to load progress:", error.message);
    return emptyAcademyProgress;
  }

  return normalizeAcademyProgress(data);
}
