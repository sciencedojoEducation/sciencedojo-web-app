import { createCalendarEvent } from "@/lib/calendar";
import { createMeetingUrl } from "@/lib/meetings";
import { createAdminClient } from "@/utils/supabase/admin";

type ConfirmBookingOptions = {
  bookingId: string;
  paymentMethod: "stripe";
  paymentIntentId?: string | null;
};

type BookingConfirmationResult = {
  bookingId: string;
  classId: string | null;
  meetingUrl: string | null;
};

async function findOrCreateClassWithAdmin(
  supabase: ReturnType<typeof createAdminClient>,
  studentId: string,
  tutorId: string,
  subject: string,
) {
  const { data: existing } = await supabase
    .from("classes")
    .select("id")
    .eq("student_id", studentId)
    .eq("tutor_id", tutorId)
    .eq("subject", subject)
    .maybeSingle();

  if (existing?.id) return existing.id as string;

  const { data: created, error } = await supabase
    .from("classes")
    .insert({
      student_id: studentId,
      tutor_id: tutorId,
      subject,
      display_name: subject,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: retry } = await supabase
        .from("classes")
        .select("id")
        .eq("student_id", studentId)
        .eq("tutor_id", tutorId)
        .eq("subject", subject)
        .single();
      return retry!.id as string;
    }
    throw error;
  }

  return created.id as string;
}

export async function confirmPaidBooking({
  bookingId,
  paymentMethod,
  paymentIntentId = null,
}: ConfirmBookingOptions): Promise<BookingConfirmationResult> {
  const supabase = createAdminClient();

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, student_id, tutor_id, subject, lesson_mode")
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    throw new Error(`Booking not found: ${bookingError?.message || bookingId}`);
  }

  const isPhysical = booking.lesson_mode === "physical";
  let meetingJoinUrl: string | null = null;

  if (!isPhysical) {
    const meeting = await createMeetingUrl(bookingId);
    meetingJoinUrl = meeting.joinUrl;
  }

  const updates: Record<string, unknown> = {
    status: "confirmed",
    payment_status: "paid",
    payment_method: paymentMethod,
    payment_confirmed_at: new Date().toISOString(),
  };

  if (paymentIntentId) updates.payment_intent_id = paymentIntentId;
  if (!isPhysical) updates.meeting_url = meetingJoinUrl;

  const { error: updateError } = await supabase
    .from("bookings")
    .update(updates)
    .eq("id", bookingId);

  if (updateError) {
    throw new Error(`Failed to confirm booking: ${updateError.message}`);
  }

  await createCalendarEvent(bookingId);

  let classId: string | null = null;
  try {
    classId = await findOrCreateClassWithAdmin(
      supabase,
      booking.student_id,
      booking.tutor_id,
      booking.subject,
    );

    await supabase
      .from("bookings")
      .update({ class_id: classId })
      .eq("id", bookingId);
  } catch (classErr) {
    console.error(`[booking-confirmation] Class creation failed for ${bookingId}:`, classErr);
  }

  return { bookingId, classId, meetingUrl: meetingJoinUrl };
}
