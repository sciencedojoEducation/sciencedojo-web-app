"use server"

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendBookingRequestedEmail, sendBookingAcceptedEmail, sendLessonNotesEmail } from "@/lib/email";
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
  const isRecurring = recurrenceCount > 1;
  const recurrenceGroupId = isRecurring ? crypto.randomUUID() : null;

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
      price_at_booking: hourlyRate,
      status: "requested",
      requested_date: bookingDate.toISOString(),
      duration_hours: durationHours,
      recurrence_group_id: recurrenceGroupId,
      is_recurring: isRecurring,
      recurrence_count: recurrenceCount,
      recurrence_index: i + 1
    });
  }

  const { error } = await supabase
    .from("bookings")
    .insert(bookingsToInsert);

  if (error) {
    console.error("Booking Error:", error.message);
    // In a real app, we'd redirect to an error page or use useActionState
    redirect(`/tutor/${tutorId}/book?error=${encodeURIComponent(error.message)}`);
  }

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
  const subjects = subjectsStr ? subjectsStr.split(',').map(s => s.trim()) : [];
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

  revalidatePath("/dashboard/tutor");
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

  revalidatePath("/dashboard/tutor");
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
    // Even if notes fail, booking is completed, but we should log it
  } else {
    // Determine student to notify
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
        await sendLessonNotesEmail(
          studentProfile.email,
          user.user_metadata?.full_name || "Your Tutor",
          new Date(booking.requested_date),
          summary,
          homework
        );
      }
    }
  }

  revalidatePath("/dashboard/tutor");
  revalidatePath("/dashboard/tutor/earnings");
  revalidatePath("/dashboard/student");
  revalidatePath("/dashboard/parent");
  
  redirect("/dashboard/tutor?message=Session completed and summary sent!");
}
