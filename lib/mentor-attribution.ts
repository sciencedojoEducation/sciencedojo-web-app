import { cookies } from "next/headers";
import { createAdminClient } from "@/utils/supabase/admin";

export const MENTOR_ATTRIBUTION_COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

export const mentorAttributionCookies = {
  sessionId: "sd_lead_session_id",
  leadSourceId: "sd_lead_source_id",
  referrerTutorId: "sd_referrer_tutor_id",
  landingTutorId: "sd_landing_tutor_id",
  acquisitionSource: "sd_acquisition_source",
} as const;

export type MentorAttribution = {
  leadSourceId: string | null;
  referrerTutorId: string | null;
  landingTutorId: string | null;
  acquisitionSource: string;
};

export function isAttributionSchemaError(error: { code?: string; message?: string } | null | undefined) {
  const message = error?.message || "";
  return (
    error?.code === "42703" ||
    error?.code === "42P01" ||
    message.includes("lead_sources") ||
    message.includes("lead_source_id") ||
    message.includes("referrer_tutor_id") ||
    message.includes("landing_tutor_id") ||
    message.includes("acquisition_source")
  );
}

export async function getMentorAttributionFromCookies(): Promise<MentorAttribution> {
  const cookieStore = await cookies();

  return {
    leadSourceId: cookieStore.get(mentorAttributionCookies.leadSourceId)?.value || null,
    referrerTutorId: cookieStore.get(mentorAttributionCookies.referrerTutorId)?.value || null,
    landingTutorId: cookieStore.get(mentorAttributionCookies.landingTutorId)?.value || null,
    acquisitionSource: cookieStore.get(mentorAttributionCookies.acquisitionSource)?.value || "mentor_profile",
  };
}

export async function markMentorLeadConverted({
  bookingId,
  assessmentId,
  userId,
}: {
  bookingId?: string | null;
  assessmentId?: string | null;
  userId?: string | null;
}) {
  const attribution = await getMentorAttributionFromCookies();

  if (!attribution.leadSourceId) {
    return;
  }

  try {
    const adminClient = createAdminClient();
    const updatePayload: Record<string, string | boolean | null> = {
      converted: true,
      converted_at: new Date().toISOString(),
    };

    if (bookingId) updatePayload.booking_id = bookingId;
    if (assessmentId) updatePayload.assessment_id = assessmentId;
    if (userId) updatePayload.user_id = userId;

    const { error } = await adminClient
      .from("lead_sources")
      .update(updatePayload)
      .eq("id", attribution.leadSourceId);

    if (error && !isAttributionSchemaError(error)) {
      console.error("Lead source conversion update failed:", error.message);
    }
  } catch (error) {
    console.error("Lead source conversion update failed:", error);
  }
}
