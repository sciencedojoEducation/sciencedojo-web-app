"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getPublicSource, trackEvent } from "@/lib/analytics";

export default function AiPracticeStudioViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    trackEvent("ai_practice_studio_view", {
      source_page: getPublicSource(pathname),
    });
  }, [pathname]);

  return null;
}
