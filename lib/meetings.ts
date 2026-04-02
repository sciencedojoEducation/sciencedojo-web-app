"use server";

import { createClient } from "@supabase/supabase-js";
import { createDailyRoom } from "@/app/classes/daily-actions";

export interface MeetingDetails {
  joinUrl: string;
  hostUrl: string;
  password?: string;
  meetingId: string;
}

/**
 * ScienceDojo Meeting Orchestrator.
 * Prioritizes Daily.co for high-performance video, falling back to Zoom if needed.
 */
export async function createMeetingUrl(bookingId: string): Promise<MeetingDetails> {
  // Use service role to bypass RLS for integration checks (Secure Server Action)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Fetch Daily.co keys first (The new ScienceDojo Standard) 🏁🧤
  const { data: dailyConfig } = await supabase
    .from("platform_integrations")
    .select("*")
    .eq("provider", "daily")
    .single();

  if (dailyConfig?.is_active && dailyConfig?.key_1) {
    try {
      console.log("[Meeting Engine] Launching High-Performance Daily.co Room... 🏎️🚀");
      const room = await createDailyRoom(bookingId);
      return {
        joinUrl: room.url,
        hostUrl: room.url, // Daily Prebuilt uses the same URL for host/join, but handles permissions via session/token
        meetingId: room.name
      };
    } catch (err: any) {
      console.error("[Meeting Engine] Daily.co failed to launch. Falling back to legacy Zoom...", err.message);
    }
  }

  // 2. Legacy Zoom Fallback
  const { data: zoomConfig } = await supabase
    .from("platform_integrations")
    .select("*")
    .eq("provider", "zoom")
    .single();

  if (zoomConfig?.is_active && zoomConfig?.key_1 && zoomConfig?.key_2 && zoomConfig?.key_3) {
    try {
      const { data: booking } = await supabase.from("bookings").select("requested_date").eq("id", bookingId).single();
      const timeStr = booking ? new Date(booking.requested_date).toISOString() : "Scheduled Session";

      const accountId = zoomConfig.key_1;
      const clientId = zoomConfig.key_2;
      const clientSecret = zoomConfig.key_3;

      const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const tokenRes = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${authHeader}` },
        cache: 'no-store'
      });

      if (tokenRes.ok) {
        const { access_token } = await tokenRes.json();
        const meetingRes = await fetch('https://api.zoom.us/v2/users/me/meetings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            topic: `ScienceDojo Session: ${timeStr}`,
            type: 2,
            settings: {
              host_video: true,
              participant_video: true,
              join_before_host: true,
              waiting_room: true
            }
          })
        });

        if (meetingRes.ok) {
          const meetingData = await meetingRes.json();
          return {
            joinUrl: meetingData.join_url,
            hostUrl: meetingData.start_url,
            password: meetingData.password,
            meetingId: meetingData.id.toString()
          };
        }
      }
    } catch (err: any) {
      console.error("[Meeting Engine] Zoom fallback failed:", err.message);
    }
  }

  console.warn("[Meeting Engine] No active providers found. Reverting to Mock URL as safety fallback.");
  return fallbackMockMeeting();
}

function fallbackMockMeeting(): MeetingDetails {
  return {
    joinUrl: `https://zoom.us/wc/join/${Math.floor(Math.random() * 900000000) + 100000000}?pwd=mock_password`,
    hostUrl: `https://zoom.us/s/${Math.floor(Math.random() * 900000000) + 100000000}`,
    password: "mock_password",
    meetingId: `${Math.floor(Math.random() * 900000000) + 100000000}`
  };
}
