import { getTutorById, getAvailabilityByTutorIdForMonth } from "@/lib/supabase-queries";
import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import CalendlyBookingWizard from "@/components/CalendlyBookingWizard";
import AuthReturnTracker from "@/components/analytics/AuthReturnTracker";
import FeatureUnavailable from "@/components/FeatureUnavailable";
import { isFeatureEnabled } from "@/lib/feature-flags";

export default async function BookTutorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ auth_return?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const bookingEnabled = await isFeatureEnabled("booking_enabled");
  if (!bookingEnabled) {
    return (
      <FeatureUnavailable
        eyebrow="Booking opens soon"
        title="Booking is currently being prepared."
        message="We are preparing tutor booking carefully before opening it to families. Please contact ScienceDojo if you need help arranging support."
        ctaHref="/contact"
        ctaLabel="Contact ScienceDojo"
      />
    );
  }

  const tutor = await getTutorById(id);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!tutor) {
    notFound();
  }

  if (!tutor.is_publicly_listed || tutor.tutor_status === "rejected" || tutor.tutor_status === "suspended") {
    notFound();
  }

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/tutor/${id}/book`)}`);
  }

  // Pre-fetch the current month's availability to avoid a blank loading flash
  const now = new Date();
  const initialSlots = await getAvailabilityByTutorIdForMonth(
    tutor.id, 
    now.getFullYear(), 
    now.getMonth() + 1
  );

  return (
    <div className="bg-slate-50/50 min-h-screen py-12">
      <AuthReturnTracker enabled={query.auth_return === "1"} source="tutor_booking" />
      <main className="max-w-5xl mx-auto w-full px-4 md:px-8">
        <CalendlyBookingWizard tutor={tutor} initialSlots={initialSlots} />
      </main>
    </div>
  );
}
