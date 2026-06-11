import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getBookingsByUserId, getTutorById, getAvailabilityByTutorId } from "@/lib/supabase-queries";
import { getActiveAnnouncementsForUser } from "@/lib/announcement-queries";
import TutorDashboardUI from "./TutorDashboardUI";

function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}

export default async function TutorDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return <div>Please log in.</div>;
  }

  const bookings = await getBookingsByUserId(user.id);
  const tutorData = await getTutorById(user.id);
  const { data: application } = await supabase
    .from('applications')
    .select('status, data')
    .eq('user_id', user.id)
    .maybeSingle();

  // Mandatory GDPR Recruitment Flow Gate
  if (!tutorData || !tutorData.is_verified) {
    if (!application || application.status === 'draft') {
      redirect("/tutor/onboarding");
    } else if (application.status === 'approved') {
      redirect("/tutor/contract");
    }
    // If 'pending', they stay on the dashboard to see the "Under Review" banner!
  }

  const slots = await getAvailabilityByTutorId(user.id);
  const announcements = await getActiveAnnouncementsForUser();
  const applicationData = asRecord(application?.data);
  const { data: tutorStripe } = await supabase
    .from("tutors")
    .select("stripe_onboarding_complete")
    .eq("id", user.id)
    .maybeSingle();

  const hasIntroVideo = Boolean(
    tutorData?.youtube_intro_url ||
    applicationData.demo_video_url ||
    applicationData.youtube_url
  );
  const readinessItems = [
    {
      id: "photo",
      label: "Profile photo",
      helper: "Help students and parents recognize you.",
      completed: Boolean(tutorData?.avatar_url),
      href: "/dashboard/tutor/settings",
    },
    {
      id: "bio",
      label: "Tutor bio",
      helper: "Explain who you support and how you teach.",
      completed: Boolean(tutorData?.bio && tutorData.bio.trim().length >= 40),
      href: "/dashboard/tutor/settings",
    },
    {
      id: "subjects",
      label: "Subjects and rate",
      helper: "Keep subjects and hourly rate ready for families.",
      completed: Boolean((tutorData?.subjects?.length || 0) > 0 && Number(tutorData?.hourly_rate || 0) > 0),
      href: "/dashboard/tutor/settings",
    },
    {
      id: "video",
      label: "Introduction video",
      helper: "Show your teaching style with a short intro or demo.",
      completed: hasIntroVideo,
      href: "/dashboard/tutor/settings",
    },
    {
      id: "availability",
      label: "Availability",
      helper: "Set times students can request lessons.",
      completed: slots.length > 0,
      action: "availability" as const,
    },
    {
      id: "payments",
      label: "Payment setup",
      helper: "Connect payouts before paid lessons begin.",
      completed: Boolean((tutorStripe as any)?.stripe_onboarding_complete),
      href: "/dashboard/tutor/earnings",
    },
  ];
  const completedReadinessItems = readinessItems.filter((item) => item.completed).length;
  const profileReadiness = {
    percent: Math.round((completedReadinessItems / readinessItems.length) * 100),
    completed: completedReadinessItems,
    total: readinessItems.length,
    items: readinessItems,
  };

  const launchChecklist = [
    ...readinessItems,
    {
      id: "guide",
      label: "Read Getting Started Guide",
      helper: "Review how lessons, records, payments, and support work.",
      completed: false,
      href: "/support/tutors",
    },
    {
      id: "public-profile",
      label: "Review your public profile",
      helper: "See what families will view when your profile is ready.",
      completed: profileReadiness.percent === 100,
      href: `/tutor/${user.id}`,
    },
  ];

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

  const userName = tutorData?.full_name || user?.user_metadata?.full_name || "Tutor";
  const avatarUrl = tutorData?.avatar_url || user?.user_metadata?.avatar_url;
  const showAcceptedWelcome = Boolean(
    tutorData?.is_verified &&
    application?.status === "approved" &&
    !applicationData.tutor_welcome_seen_at
  );

  return (
    <TutorDashboardUI 
      userId={user.id}
      userName={userName} 
      avatarUrl={avatarUrl} 
      bookings={bookings} 
      tutorData={tutorData}
      slots={slots}
      announcements={announcements}
      reviewVisibility={reviewVisibility}
      showAcceptedWelcome={showAcceptedWelcome}
      showLaunchChecklist={Boolean(tutorData?.is_verified)}
      profileReadiness={profileReadiness}
      launchChecklist={launchChecklist}
    />
  );
}
