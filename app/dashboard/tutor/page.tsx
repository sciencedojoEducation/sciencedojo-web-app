import { createClient } from "@/utils/supabase/server";
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
  const slots = await getAvailabilityByTutorId(user.id);
  const announcements = await getActiveAnnouncementsForUser();

  const userName = tutorData?.full_name || user?.user_metadata?.full_name || "Tutor";
  const avatarUrl = tutorData?.avatar_url || user?.user_metadata?.avatar_url;

  return (
    <TutorDashboardUI 
      userName={userName} 
      avatarUrl={avatarUrl} 
      bookings={bookings} 
      tutorData={tutorData}
      slots={slots}
      announcements={announcements}
    />
  );
}

