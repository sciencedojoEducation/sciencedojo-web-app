"use server"

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendBookingRequestedEmail, sendBookingAcceptedEmail, sendLessonNotesEmail } from "@/lib/email";
import { getMentorAttributionFromCookies, isAttributionSchemaError, markMentorLeadConverted } from "@/lib/mentor-attribution";
import { getMeaningfulTutorSubjects } from "@/lib/tutors/subjects";
import crypto from 'crypto';

export async function createBookingRequest(formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?message=Please log in to book a session.");
  }

  const tutorId = formData.get("tutorId") as string;
  const subject = formData.get("subject") as string;
  const description = formData.get("description") as string;
  const hourlyRate = Number(formData.get("hourlyRate"));
  const requestedDate = formData.get("requestedDate") as string;
  const durationHours = Number(formData.get("durationHours") || 1);
  const recurrenceCount = Number(formData.get("recurrenceCount") || 1);
  const lessonMode = formData.get("lessonMode") === "physical" ? "physical" : "online";
  const locationDetails = String(formData.get("locationDetails") || "").trim();
  const arrivalNotes = String(formData.get("arrivalNotes") || "").trim();
  const travelFee = Math.max(0, Number(formData.get("travelFee") || 0));
  const isRecurring = recurrenceCount > 1;
  const recurrenceGroupId = isRecurring ? crypto.randomUUID() : null;
  const attribution = await getMentorAttributionFromCookies();
  const pricePerBooking = (hourlyRate * durationHours) + (lessonMode === "physical" ? travelFee : 0);

  if (lessonMode === "physical" && !locationDetails) {
    redirect(`/tutor/${tutorId}/book?error=${encodeURIComponent("Please add the in-person class location before requesting.")}`);
  }

  const baseDate = new Date(requestedDate || new Date().toISOString());
  const bookingsToInsert = [];

  for (let i = 0; i < recurrenceCount; i++) {
    const bookingDate = new Date(baseDate);
    bookingDate.setDate(bookingDate.getDate() + (i * 7));

    bookingsToInsert.push({
      student_id: user.id,
      tutor_id: tutorId,
      subject: subject,
      description: description,
      price_at_booking: pricePerBooking,
      status: "requested",
      requested_date: bookingDate.toISOString(),
      duration_hours: durationHours,
      lesson_mode: lessonMode,
      location_details: lessonMode === "physical" ? locationDetails : null,
      arrival_notes: lessonMode === "physical" ? arrivalNotes || null : null,
      travel_fee: lessonMode === "physical" ? travelFee : 0,
      payment_status: "unpaid",
      recurrence_group_id: recurrenceGroupId,
      is_recurring: isRecurring,
      recurrence_count: recurrenceCount,
      recurrence_index: i + 1,
      acquisition_source: attribution.acquisitionSource,
      referrer_tutor_id: attribution.referrerTutorId,
      landing_tutor_id: attribution.landingTutorId,
      lead_source_id: attribution.leadSourceId,
    });
  }

  let { data: insertedBookings, error } = await supabase
    .from("bookings")
    .insert(bookingsToInsert)
    .select("id");

  if (error && isAttributionSchemaError(error)) {
    const fallbackBookings = bookingsToInsert.map((booking) => {
      const {
        acquisition_source: _acquisitionSource,
        referrer_tutor_id: _referrerTutorId,
        landing_tutor_id: _landingTutorId,
        lead_source_id: _leadSourceId,
        ...baseBooking
      } = booking;
      return baseBooking;
    });

    const fallbackResult = await supabase
      .from("bookings")
      .insert(fallbackBookings)
      .select("id");

    insertedBookings = fallbackResult.data;
    error = fallbackResult.error;
  }

  if (error) {
    console.error("Booking Error:", error.message);
    // In a real app, we'd redirect to an error page or use useActionState
    redirect(`/tutor/${tutorId}/book?error=${encodeURIComponent(error.message)}`);
  }

  await markMentorLeadConverted({
    bookingId: insertedBookings?.[0]?.id || null,
    userId: user.id,
  });

  // Get tutor email for notification
  const { data: tutorProfile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", tutorId)
    .single();

  if (tutorProfile?.email) {
    await sendBookingRequestedEmail(
      tutorProfile.email,
      user.user_metadata?.full_name || "A student",
      new Date(requestedDate || new Date()),
      subject
    );
  }

  revalidatePath("/dashboard/parent");
  redirect(`/tutor/${tutorId}/book/success?subject=${encodeURIComponent(subject)}&date=${encodeURIComponent(requestedDate || new Date().toISOString())}`);
}

export async function updateBookingStatus(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  const bookingId = formData.get("bookingId") as string;
  const recurrenceGroupId = formData.get("recurrenceGroupId") as string | null;
  const status = formData.get("status") as string;

  let query = supabase
    .from("bookings")
    .update({ status: status })
    .eq("tutor_id", user.id); // Security: Ensure only the tutor can accept/decline

  if (recurrenceGroupId) {
    query = query.eq("recurrence_group_id", recurrenceGroupId);
  } else {
    query = query.eq("id", bookingId);
  }

  const { error } = await query;

  if (error) {
    console.error("Update Status Error:", error.message);
    redirect(`/dashboard/tutor?error=${encodeURIComponent(error.message)}`);
  }

  if (status === "accepted") {
    // Get booking details to find the student
    const { data: booking } = await supabase
      .from("bookings")
      .select("student_id, requested_date")
      .eq("id", bookingId)
      .single();

    if (booking) {
      const { data: studentProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", booking.student_id)
        .single();
        
      if (studentProfile?.email) {
        await sendBookingAcceptedEmail(
          studentProfile.email,
          user.user_metadata?.full_name || "Your Tutor",
          new Date(booking.requested_date)
        );
      }
    }
  }

  revalidatePath("/dashboard/tutor");
  redirect("/dashboard/tutor?message=Booking updated successfully.");
}

export async function updateTutorProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  const bio = formData.get("bio") as string;
  const hourlyRate = Number(formData.get("hourlyRate"));
  const subjectsStr = formData.get("subjects") as string;
  const subjects = getMeaningfulTutorSubjects(subjectsStr);
  const fullName = formData.get("fullName") as string;
  const chatAvailabilityStr = formData.get("chatAvailability") as string;
  const chatAvailability = chatAvailabilityStr ? JSON.parse(chatAvailabilityStr) : null;
  const youtubeIntroUrl = formData.get("youtubeIntroUrl") as string;

  // Avatar is uploaded client-side directly to Supabase Storage.
  // The Server Action only receives the resulting public URL string.
  const finalAvatarUrl = (formData.get("avatarUrl") as string) || "";

  // Update Profile (Avatar)
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ 
      avatar_url: finalAvatarUrl,
      full_name: fullName || undefined
    })
    .eq("id", user.id);

  if (profileError) {
    console.error("Profile update error:", profileError.message);
    redirect(`/dashboard/tutor?error=${encodeURIComponent(profileError.message)}`);
  }

  // Update Tutor details (Bio, Subjects, Rate)
  const { error: tutorError } = await supabase
    .from("tutors")
    .update({ 
      bio: bio,
      subjects: subjects,
      hourly_rate: hourlyRate,
      chat_availability: chatAvailability || undefined,
      youtube_intro_url: youtubeIntroUrl || null
    })
    .eq("id", user.id);

  if (tutorError) {
    console.error("Tutor update error:", tutorError.message);
    redirect(`/dashboard/tutor?error=${encodeURIComponent(tutorError.message)}`);
  }

  revalidatePath("/dashboard/tutor");
  revalidatePath("/dashboard/tutor/settings");
  redirect("/dashboard/tutor?message=Profile updated successfully!");
}

export async function updateTutorAvailability(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  const isAvailable = formData.get("isAvailable") === "true";

  const { error } = await supabase
    .from("tutors")
    .update({ is_available_now: isAvailable })
    .eq("id", user.id);

  if (error) {
    console.error("Availability update error:", error.message);
    redirect(`/dashboard/tutor/settings?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/tutor");
  revalidatePath("/dashboard/tutor/settings");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Availability Management
// ─────────────────────────────────────────────────────────────────────────────

export interface BulkAvailabilityInput {
  year: number;
  month: number; // 1-12
  weekdays: number[]; // Sunday = 0
  timeRanges: Array<{ startTime: string; endTime: string }>;
}

export interface BulkAvailabilityResult {
  createdCount: number;
  skippedCount: number;
  message: string;
}

const TIME_INPUT_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function availabilityPathsChanged() {
  revalidatePath("/dashboard/tutor");
  revalidatePath("/dashboard/tutor/schedule");
}

export async function addMonthlyWeeklyAvailability(
  input: BulkAvailabilityInput,
): Promise<BulkAvailabilityResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  if (!input || !Array.isArray(input.weekdays) || !Array.isArray(input.timeRanges)) {
    throw new Error("Invalid weekly availability request.");
  }

  const { year, month, weekdays, timeRanges } = input;
  if (!Number.isInteger(year) || year < 2000 || year > 2100 || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Choose a valid calendar month.");
  }

  const uniqueWeekdays = [...new Set(weekdays)];
  if (uniqueWeekdays.length === 0 || uniqueWeekdays.some(day => !Number.isInteger(day) || day < 0 || day > 6)) {
    throw new Error("Choose at least one valid weekday.");
  }
  if (timeRanges.length === 0 || timeRanges.length > 12) {
    throw new Error("Add between 1 and 12 time ranges.");
  }

  const normalizedRanges = timeRanges.map(({ startTime, endTime }) => {
    if (!TIME_INPUT_PATTERN.test(startTime) || !TIME_INPUT_PATTERN.test(endTime) || startTime >= endTime) {
      throw new Error("Every time range must have a valid end time after its start time.");
    }
    return { startTime: `${startTime}:00`, endTime: `${endTime}:00` };
  });

  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const today = new Date().toISOString().slice(0, 10);

  const { data: existing, error: fetchError } = await supabase
    .from("tutor_availability")
    .select("date, start_time, end_time")
    .eq("tutor_id", user.id)
    .gte("date", monthStart)
    .lte("date", monthEnd);

  if (fetchError) throw new Error(`Failed to check existing availability: ${fetchError.message}`);

  const occupied = new Map<string, Array<{ startTime: string; endTime: string }>>();
  for (const slot of existing ?? []) {
    const ranges = occupied.get(slot.date) ?? [];
    ranges.push({ startTime: slot.start_time, endTime: slot.end_time });
    occupied.set(slot.date, ranges);
  }

  const rows: Array<{ tutor_id: string; date: string; start_time: string; end_time: string }> = [];
  let skippedCount = 0;

  for (let day = 1; day <= lastDay; day++) {
    const date = new Date(year, month - 1, day);
    if (!uniqueWeekdays.includes(date.getDay())) continue;
    const dateString = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (dateString < today) {
      skippedCount += normalizedRanges.length;
      continue;
    }

    const rangesForDate = occupied.get(dateString) ?? [];
    for (const range of normalizedRanges) {
      const overlaps = rangesForDate.some(existingRange =>
        range.startTime < existingRange.endTime && range.endTime > existingRange.startTime
      );
      if (overlaps) {
        skippedCount++;
        continue;
      }
      rows.push({
        tutor_id: user.id,
        date: dateString,
        start_time: range.startTime,
        end_time: range.endTime,
      });
      rangesForDate.push(range);
    }
    occupied.set(dateString, rangesForDate);
  }

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from("tutor_availability").insert(rows);
    if (insertError) throw new Error(`Failed to publish weekly availability: ${insertError.message}`);
  }

  availabilityPathsChanged();
  const createdCount = rows.length;
  const message = createdCount === 0
    ? `No new slots were published; ${skippedCount} conflicted or were in the past.`
    : `Published ${createdCount} slot${createdCount === 1 ? "" : "s"}${skippedCount ? ` and skipped ${skippedCount}` : ""}.`;

  return { createdCount, skippedCount, message };
}

export async function addAvailabilitySlot(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("Unauthorized");
  }

  const date = formData.get("date") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;

  if (!date || !startTime || !endTime) {
    throw new Error("Missing required fields");
  }

  const { error } = await supabase
    .from("tutor_availability")
    .insert({
      tutor_id: user.id,
      date,
      start_time: startTime + ":00", // DB needs HH:MM:SS
      end_time: endTime + ":00",
    });

  if (error) {
    console.error("Add Availability error:", error.message);
    throw new Error("Failed to add slot: " + error.message);
  }

  availabilityPathsChanged();
  return { success: true };
}

export async function deleteAvailabilitySlot(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("Unauthorized");
  }

  const id = formData.get("id") as string;

  if (!id) {
    throw new Error("Missing ID");
  }

  const { error } = await supabase
    .from("tutor_availability")
    .delete()
    .eq("id", id)
    .eq("tutor_id", user.id); // Security: ensure tutor owns it

  if (error) {
    console.error("Delete Availability error:", error.message);
    throw new Error("Failed to delete slot: " + error.message);
  }

  availabilityPathsChanged();
  return { success: true };
}

export async function fetchTutorSlots(tutorId: string, year: number, month: number) {
  const { getAvailabilityByTutorIdForMonth } = await import("@/lib/supabase-queries");
  return await getAvailabilityByTutorIdForMonth(tutorId, year, month);
}

export async function completeSessionAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  const bookingId = formData.get("bookingId") as string;
  const summary = formData.get("summary") as string;
  const homework = formData.get("homework") as string;

  if (!bookingId || !summary) {
    console.error("Missing bookingId or summary");
    redirect("/dashboard/tutor?error=Missing required summary fields.");
  }

  // 1. Update Booking Status
  const { error: bookingError } = await supabase
    .from("bookings")
    .update({ status: "completed" })
    .eq("id", bookingId)
    .eq("tutor_id", user.id);

  if (bookingError) {
    console.error("Booking completion error:", bookingError.message);
    redirect(`/dashboard/tutor?error=${encodeURIComponent(bookingError.message)}`);
  }

  // 2. Insert Lesson Notes
  const { error: notesError } = await supabase
    .from("lesson_notes")
    .insert({
      booking_id: bookingId,
      summary: summary,
      homework: homework
    });

  if (notesError) {
    console.error("Lesson notes error:", notesError.message);
  }

  // 3. Get booking details for class integration + email
  const { data: booking } = await supabase
    .from("bookings")
    .select("student_id, subject, requested_date")
    .eq("id", bookingId)
    .single();

  if (booking) {
    // 4. Find or create the class for this student+tutor+subject
    const { findOrCreateClass } = await import("@/lib/class-queries");
    try {
      const classId = await findOrCreateClass(booking.student_id, user.id, booking.subject);

      // Link booking to class
      await supabase
        .from("bookings")
        .update({ class_id: classId })
        .eq("id", bookingId);

      // Create lesson_report post in class feed
      await supabase
        .from("class_posts")
        .insert({
          class_id: classId,
          author_id: user.id,
          content: summary,
          post_type: "lesson_report",
          booking_id: bookingId,
        });

      // If homework was assigned, create assignment post in class feed
      if (homework && homework.trim()) {
        await supabase
          .from("class_posts")
          .insert({
            class_id: classId,
            author_id: user.id,
            content: homework,
            post_type: "assignment",
            booking_id: bookingId,
          });
      }
    } catch (classErr) {
      console.error("Class integration error:", classErr);
      // Non-blocking — session is still completed
    }

    // 5. Send email notification
    const { data: studentProfile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", booking.student_id)
      .single();
      
    if (studentProfile?.email) {
      await sendLessonNotesEmail(
        studentProfile.email,
        user.user_metadata?.full_name || "Your Tutor",
        new Date(booking.requested_date),
        summary,
        homework
      );
    }
  }

  revalidatePath("/dashboard/tutor");
  revalidatePath("/dashboard/tutor/earnings");
  revalidatePath("/dashboard/student");
  revalidatePath("/dashboard/parent");
  revalidatePath("/dashboard/classes");
  
  redirect("/dashboard/tutor?message=Session completed and summary sent!");
}
