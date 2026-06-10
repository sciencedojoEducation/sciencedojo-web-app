import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getBookingsByUserId, getTutorById, getAvailabilityByTutorId } from "@/lib/supabase-queries";
import { getActiveAnnouncementsForUser } from "@/lib/announcement-queries";
import TutorDashboardUI from "./TutorDashboardUI";

export default async function TutorDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return <div>Please log in.</div>;
  }

  const bookings = await getBookingsByUserId(user.id);
  const tutorData = await getTutorById(user.id);
  // Mandatory GDPR Recruitment Flow Gate
  if (!tutorData || !tutorData.is_verified) {
    const { data: application } = await supabase
      .from('applications')
      .select('status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!application || application.status === 'draft') {
      redirect("/tutor/onboarding");
    } else if (application.status === 'approved') {
      redirect("/tutor/contract");
    }
    // If 'pending', they stay on the dashboard to see the "Under Review" banner!
  }

  const slots = await getAvailabilityByTutorId(user.id);
  const announcements = await getActiveAnnouncementsForUser();
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
    />
  );
}
