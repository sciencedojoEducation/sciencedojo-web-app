import { getTutorById, getAvailabilityByTutorIdForMonth } from "@/lib/supabase-queries";
import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import CalendlyBookingWizard from "@/components/CalendlyBookingWizard";

export default async function BookTutorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tutor = await getTutorById(id);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!tutor) {
    notFound();
  }

  if (!user) {
    redirect(`/login?next=/tutor/${id}/book`);
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
      <main className="max-w-5xl mx-auto w-full px-4 md:px-8">
        <CalendlyBookingWizard tutor={tutor} initialSlots={initialSlots} />
      </main>
    </div>
  );
}
