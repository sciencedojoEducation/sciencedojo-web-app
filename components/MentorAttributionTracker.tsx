"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

type MentorAttributionTrackerProps = {
  landingSlug: string;
  referrerSlug?: string;
};

function getDeviceType() {
  if (typeof window === "undefined") return "unknown";
  const width = window.innerWidth;
  if (width < 640) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

export default function MentorAttributionTracker({
  landingSlug,
  referrerSlug,
}: MentorAttributionTrackerProps) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    try {
      trackEvent("mentor_profile_viewed", {
        landing_slug: landingSlug,
        referrer_slug: referrerSlug || params.get("r") || landingSlug,
      });
    } catch {
      // Analytics should never interrupt the mentor profile experience.
    }

    fetch("/api/mentor-attribution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        landingSlug,
        referrerSlug: referrerSlug || params.get("r") || landingSlug,
        landingPath: `${window.location.pathname}${window.location.search}`,
        utm_source: params.get("utm_source"),
        utm_medium: params.get("utm_medium"),
        utm_campaign: params.get("utm_campaign"),
        device_type: getDeviceType(),
      }),
      keepalive: true,
    }).catch(() => {
      // Attribution should never interrupt the mentor profile experience.
    });
  }, [landingSlug, referrerSlug]);

  return null;
}
