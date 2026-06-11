import { isAttributionSchemaError } from "@/lib/mentor-attribution";
import { createAdminClient } from "@/utils/supabase/admin";

export type TutorMentorReach = {
  profileVisits: number;
  questions: number;
  trialLessons: number;
  learningChecks: number;
};

const emptyMentorReach: TutorMentorReach = {
  profileVisits: 0,
  questions: 0,
  trialLessons: 0,
  learningChecks: 0,
};

export async function getTutorMentorReach(tutorId: string): Promise<TutorMentorReach> {
  const adminClient = createAdminClient();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  try {
    const { data, error } = await adminClient
      .from("lead_sources")
      .select("id, assessment_id, booking_id")
      .eq("landing_tutor_id", tutorId)
      .gte("first_seen_at", startOfMonth.toISOString());

    if (error) {
      if (!isAttributionSchemaError(error)) {
        console.error("Mentor reach fetch failed:", error.message);
      }

      return emptyMentorReach;
    }

    const rows = data || [];

    return {
      profileVisits: rows.length,
      questions: 0,
      trialLessons: rows.filter((row: any) => Boolean(row.booking_id)).length,
      learningChecks: rows.filter((row: any) => Boolean(row.assessment_id)).length,
    };
  } catch (error) {
    console.error("Mentor reach fetch failed:", error);
    return emptyMentorReach;
  }
}
