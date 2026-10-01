import "server-only";
import { requireTutorAcademyUser } from "@/lib/tutor-academy-progress";
import type { AcademyResumePosition } from "@/lib/academy-resume-position";

export async function getAcademyLearnerPosition(courseKey: string): Promise<AcademyResumePosition | null> {
  const { supabase, user } = await requireTutorAcademyUser(courseKey);
  const { data, error } = await supabase.from("academy_learner_positions")
    .select("lesson_id, block_id, updated_at").eq("user_id", user.id).eq("course_key", courseKey).maybeSingle();
  // A not-yet-applied migration must not prevent anyone from learning.
  if (error || !data) return null;
  return { lessonId: data.lesson_id, blockId: data.block_id, updatedAt: data.updated_at };
}
