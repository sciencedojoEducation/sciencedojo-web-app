"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getPublicSource, trackEvent } from "@/lib/analytics";

export default function SeoConversionCtas() {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
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
  ];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) {
      // No hero on this page — show CTAs immediately.
      setHeroVisible(false);
      return;
    }
    // Fire as soon as the last pixel of the hero leaves the viewport (threshold 0).
    const observer = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, [pathname]);

  if (!isMounted || hiddenPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  const whatsappNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+94773850821").replace(/[^\d]/g, "");
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hi ScienceDojo, I'd like to book a free assessment.")}`
    : "/contact";

  return (
    <div
      className={`fixed bottom-5 left-5 right-5 z-40 flex items-center justify-center gap-3 transition-all duration-300 sm:left-auto sm:right-7 sm:bottom-7 sm:flex-col sm:items-end${
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
        className="rounded-full bg-primary/95 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white shadow-lg shadow-primary/15 transition-all hover:-translate-y-0.5 hover:bg-primary"
      >
        Book Free Assessment
      </Link>
      <Link
        href={whatsappHref}
        target={whatsappHref.startsWith("http") ? "_blank" : undefined}
        className="max-[480px]:hidden rounded-full bg-emerald-500/95 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white shadow-lg shadow-emerald-500/15 transition-all hover:-translate-y-0.5 hover:bg-emerald-500"
      >
        WhatsApp
      </Link>
    </div>
  );
}
