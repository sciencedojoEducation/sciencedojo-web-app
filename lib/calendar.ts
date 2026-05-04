import { google } from "googleapis";
import { createClient } from "@/utils/supabase/server";

function getMeetingJoinUrl(meetingUrl: unknown) {
  if (typeof meetingUrl === "string") return meetingUrl;
  if (meetingUrl && typeof meetingUrl === "object" && "joinUrl" in meetingUrl) {
    return String((meetingUrl as { joinUrl?: string }).joinUrl || "");
  }
  return "";
}

function getMeetingPassword(meetingUrl: unknown) {
  if (meetingUrl && typeof meetingUrl === "object" && "password" in meetingUrl) {
    return String((meetingUrl as { password?: string }).password || "");
  }
  return "";
}

export async function createCalendarEvent(bookingId: string) {
  const supabase = await createClient();

  // 1. Fetch Google Calendar keys from DB securely
  const { data: googleConfig } = await supabase
    .from("platform_integrations")
    .select("*")
    .eq("provider", "google_calendar")
    .single();

  if (!googleConfig || !googleConfig.is_active || !googleConfig.key_1 || !googleConfig.key_2) {
    console.warn("[Google Calendar] Integration is disabled or missing keys. Skipping calendar event creation.");
    return null;
  }

  try {
    const clientEmail = googleConfig.key_1;
    // Replace literal '\n' strings with actual newline characters if they are escaped in the DB
    const privateKey = googleConfig.key_2.replace(/\\n/g, "\n");

    // 2. Fetch booking details with tutor and student emails
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        id,
        subject,
        description,
        requested_date,
        meeting_url,
        duration_hours,
        student:profiles!bookings_student_id_fkey(full_name, email),
        tutor_profile:profiles!bookings_tutor_id_fkey(full_name, email)
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error(`Booking not found: ${bookingError?.message}`);
    }

    const { student, tutor_profile, subject, description, requested_date, meeting_url, duration_hours } = booking as any;
    const joinUrl = getMeetingJoinUrl(meeting_url);
    const password = getMeetingPassword(meeting_url);
    
    if (!student?.email || !tutor_profile?.email) {
      throw new Error("Missing student or tutor email for calendar invite.");
    }

    // 3. Authenticate with Google
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/calendar.events"]
    });

    const calendar = google.calendar({ version: "v3", auth });

    // 4. Construct Event
    const startTime = new Date(requested_date);
    const endTime = new Date(startTime.getTime() + (duration_hours || 1) * 60 * 60 * 1000);

    const event = {
      summary: `ScienceDojo: ${subject} with ${tutor_profile.full_name}`,
      location: joinUrl || "Online Class",
      description: `
Tutoring Session: ${subject}
Student: ${student.full_name}
Tutor: ${tutor_profile.full_name}

Topic: ${description || 'N/A'}

CLASSROOM LINK: ${joinUrl || 'To be provided'}
Password: ${password || 'N/A'}

Managed by ScienceDojo Platform.
      `.trim(),
      start: {
        dateTime: startTime.toISOString(),
      },
      end: {
        dateTime: endTime.toISOString(),
      },
      attendees: [
        { email: student.email, displayName: student.full_name },
        { email: tutor_profile.email, displayName: tutor_profile.full_name }
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 },
          { method: "popup", minutes: 30 },
        ],
      },
      conferenceData: joinUrl ? {
        createRequest: {
          requestId: `sd-${bookingId}`,
          conferenceSolutionKey: { type: "hangoutsMeet" } // Just a fallback if Zoom link isn't used as primary location
        }
      } : undefined
    };

    // 5. Insert Event
    const response = await calendar.events.insert({
      calendarId: "primary", // Using the service account's primary calendar
      requestBody: event,
      sendUpdates: "all", // Sends email invitations to all attendees
    });

    console.log(`[Google Calendar] Successfully created live event: ${response.data.id}`);
    return response.data;

  } catch (err: any) {
    console.error("[Google Calendar] Critical failure creating live event:", err.message);
    return null;
  }
}
