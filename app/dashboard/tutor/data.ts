import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getActiveAnnouncementsForUser } from "@/lib/announcement-queries";
import { getAvailabilityByTutorId, getBookingsByUserId, getTutorById } from "@/lib/supabase-queries";
import { buildTutorLaunchChecklist, buildTutorReadiness } from "@/lib/tutor-readiness";
import { isAttributionSchemaError } from "@/lib/mentor-attribution";

function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}

async function getMentorReach(tutorId: string) {
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

      return {
        profileVisits: 0,
        learningChecks: 0,
        trialLessons: 0,
      };
    }

    const rows = data || [];

    return {
      profileVisits: rows.length,
      learningChecks: rows.filter((row: any) => Boolean(row.assessment_id)).length,
      trialLessons: rows.filter((row: any) => Boolean(row.booking_id)).length,
    };
  } catch (error) {
    console.error("Mentor reach fetch failed:", error);
    return {
      profileVisits: 0,
      learningChecks: 0,
      trialLessons: 0,
    };
  }
}

export async function getTutorDashboardData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const bookings = await getBookingsByUserId(user.id);
  const tutorData = await getTutorById(user.id);
  const { data: application } = await supabase
    .from("applications")
    .select("status, data")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!tutorData || !tutorData.is_verified) {
    if (!application || application.status === "draft") {
      redirect("/tutor/onboarding");
    } else if (application.status === "approved") {
      redirect("/tutor/contract");
    }
  }

  const slots = await getAvailabilityByTutorId(user.id);
  const announcements = await getActiveAnnouncementsForUser();
  const applicationData = asRecord(application?.data);
  const { data: tutorStripe } = await supabase
    .from("tutors")
    .select("stripe_onboarding_complete")
    .eq("id", user.id)
    .maybeSingle();

  const adminClient = createAdminClient();
  let { data: reviewRows, error: reviewError } = await adminClient
    .from("reviews")
    .select("status")
    .eq("tutor_id", user.id);

  if (
    reviewError?.code === "42703" ||
    reviewError?.message?.includes("reviews.status")
  ) {
    const fallbackReviews = await adminClient
      .from("reviews")
      .select("id")
      .eq("tutor_id", user.id);

    reviewRows = (fallbackReviews.data || []).map(() => ({ status: "approved" }));
  }

  const reviewVisibility = {
    approved: reviewRows?.filter((review: any) => review.status === "approved").length || 0,
    pending: reviewRows?.filter((review: any) => review.status === "pending").length || 0,
  };

  const completedLessonCount = bookings.filter((booking) => booking.status === "completed").length;
  const mentorReach = await getMentorReach(user.id);
  const profileReadiness = buildTutorReadiness({
    tutor: tutorData,
    applicationData,
    availabilitySlots: slots,
    stripeOnboardingComplete: Boolean((tutorStripe as any)?.stripe_onboarding_complete),
    publicReviewCount: reviewVisibility.approved,
    bookingRequestCount: bookings.length,
    completedLessonCount,
  });

  return {
    userId: user.id,
    userName: tutorData?.full_name || user?.user_metadata?.full_name || "Tutor",
    avatarUrl: tutorData?.avatar_url || user?.user_metadata?.avatar_url,
    bookings,
    tutorData,
    slots,
    announcements,
    reviewVisibility,
    showAcceptedWelcome: Boolean(
      tutorData?.is_verified &&
      application?.status === "approved" &&
      !applicationData.tutor_welcome_seen_at
    ),
    showLaunchChecklist: Boolean(tutorData?.is_verified),
    profileReadiness,
    launchChecklist: buildTutorLaunchChecklist(profileReadiness, user.id),
    mentorReach,
  };
}
