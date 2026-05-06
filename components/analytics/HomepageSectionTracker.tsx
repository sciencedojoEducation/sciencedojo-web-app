"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

interface HomepageSectionTrackerProps {
  eventName: string;
}

export default function HomepageSectionTracker({ eventName }: HomepageSectionTrackerProps) {
  const markerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const marker = markerRef.current;

    if (!marker || typeof IntersectionObserver === "undefined") {
      return;
    }

    let tracked = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!tracked && entry?.isIntersecting) {
          tracked = true;
          trackEvent(eventName, { source_page: "homepage" });
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(marker);

    return () => observer.disconnect();
  }, [eventName]);

  return <div ref={markerRef} aria-hidden="true" className="sr-only" />;
}
