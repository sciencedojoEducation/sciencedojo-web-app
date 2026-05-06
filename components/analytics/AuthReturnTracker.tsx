"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

export default function AuthReturnTracker({
  enabled,
  source,
}: {
  enabled: boolean;
  source: string;
}) {
  useEffect(() => {
    if (!enabled) return;

    trackEvent("auth_return_to_booking", {
      source,
    });
  }, [enabled, source]);

  return null;
}
