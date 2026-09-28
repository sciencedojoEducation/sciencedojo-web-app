"use client";

import { useEffect } from "react";
import { getDeviceCategory, trackEvent } from "@/lib/analytics";

export default function FreeAssessmentViewTracker() {
  useEffect(() => {
    trackEvent("free_assessment_view", {
      source: "free_assessment_page",
      device_category: getDeviceCategory(),
    });
  }, []);

  return null;
}
