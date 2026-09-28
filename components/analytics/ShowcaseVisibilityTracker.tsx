"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

export default function ShowcaseVisibilityTracker({ sourcePage }: { sourcePage: "homepage" | "how_it_works" }) {
  const markerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker || typeof IntersectionObserver === "undefined") return;
    let tracked = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting && !tracked) {
        tracked = true;
        trackEvent("showcase_visible", { source_page: sourcePage });
        observer.disconnect();
      }
    }, { threshold: 0.35 });
    observer.observe(marker);
    return () => observer.disconnect();
  }, [sourcePage]);

  return <div ref={markerRef} aria-hidden="true" className="sr-only" />;
}
