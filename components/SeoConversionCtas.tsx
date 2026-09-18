"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getPublicSource, trackEvent } from "@/lib/analytics";

export default function SeoConversionCtas({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  // Assume hero is visible on first render to avoid a flash on the homepage.
  const [heroVisible, setHeroVisible] = useState(true);
  const hiddenPrefixes = [
    "/dashboard",
    "/support/tutors",
    "/tutor/onboarding",
    "/tutor/contract",
    "/login",
    "/signup",
    "/reset-password",
    "/forgot-password",
    "/maintenance",
    "/ai-practice-studio",
    "/ai-question-generator",
  ];

  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) {
      // No hero on this page — show CTAs immediately.
      const frame = window.requestAnimationFrame(() => setHeroVisible(false));
      return () => window.cancelAnimationFrame(frame);
    }
    // Fire as soon as the last pixel of the hero leaves the viewport (threshold 0).
    const observer = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, [pathname]);

  if (!enabled || hiddenPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 z-40 flex items-center justify-center transition-all duration-300 xl:hidden${
        heroVisible ? " max-sm:opacity-0 max-sm:pointer-events-none max-sm:translate-y-2" : ""
      }`}
    >
      <Link
        href="/free-assessment"
        onClick={() => {
          trackEvent("cta_book_free_assessment_click", {
            source: "sticky_cta",
            page_slug: getPublicSource(pathname),
          });
        }}
        className="flex min-h-14 w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-center text-sm font-black text-white shadow-[0_18px_48px_rgba(0,102,255,0.3)] transition-all hover:-translate-y-0.5 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        Book a Free Learning Assessment
      </Link>
    </div>
  );
}
