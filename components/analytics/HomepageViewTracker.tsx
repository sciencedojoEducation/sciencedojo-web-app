"use client";

import { useEffect } from "react";
import { getDeviceCategory, trackEvent } from "@/lib/analytics";

export default function HomepageViewTracker() {
  useEffect(() => {
    trackEvent("homepage_view", { source_page: "homepage", device_category: getDeviceCategory() });
  }, []);

  return null;
}
