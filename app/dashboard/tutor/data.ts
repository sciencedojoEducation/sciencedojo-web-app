import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getActiveAnnouncementsForUser } from "@/lib/announcement-queries";
import { getAvailabilityByTutorId, getBookingsByUserId, getTutorById } from "@/lib/supabase-queries";
import { buildTutorLaunchChecklist, buildTutorReadiness } from "@/lib/tutor-readiness";
import { getTutorMentorReach } from "@/lib/tutor-mentor-reach";

function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
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
  const mentorReach = await getTutorMentorReach(user.id);
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
