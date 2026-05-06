"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

export default function FreeAssessmentViewTracker() {
  useEffect(() => {
    trackEvent("free_assessment_view", {
      source: "free_assessment_page",
    });
  }, []);

  return null;
}
