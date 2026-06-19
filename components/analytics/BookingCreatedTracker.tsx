"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

export default function BookingCreatedTracker({
  tutorId,
  subject,
}: {
  tutorId: string;
  subject?: string;
}) {
  useEffect(() => {
    try {
      trackEvent("booking_created", {
        tutor_id: tutorId,
        subject: subject || "unknown",
      });
    } catch {
      // Analytics should never affect the booking success page.
    }
  }, [subject, tutorId]);

  return null;
}
