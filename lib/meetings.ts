"use server";

import { createJitsiRoomUrl } from "@/lib/jitsi";

export interface MeetingDetails {
  joinUrl: string;
  hostUrl: string;
  password?: string;
  meetingId: string;
}

/**
 * ScienceDojo Meeting Orchestrator.
 * Creates a hard-to-guess Jitsi room URL for live classroom sessions.
 */
export async function createMeetingUrl(bookingId: string): Promise<MeetingDetails> {
  const room = createJitsiRoomUrl(bookingId);
  return {
    joinUrl: room.roomUrl,
    hostUrl: room.roomUrl,
    meetingId: room.roomName,
  };
}
