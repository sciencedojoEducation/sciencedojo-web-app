"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getPublicSource, trackEvent } from "@/lib/analytics";

export default function SeoConversionCtas() {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const hiddenPrefixes = ["/dashboard", "/login", "/signup", "/reset-password", "/forgot-password", "/maintenance"];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || hiddenPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  const whatsappNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+94773850821").replace(/[^\d]/g, "");
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hi ScienceDojo, I'd like to book a free assessment.")}`
    : "/contact";

  return (
    <div className="fixed bottom-5 left-5 right-5 z-40 flex items-center justify-center gap-3 sm:left-auto sm:right-7 sm:bottom-7 sm:flex-col sm:items-end">
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
        className="rounded-full bg-emerald-500/95 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white shadow-lg shadow-emerald-500/15 transition-all hover:-translate-y-0.5 hover:bg-emerald-500"
      >
        WhatsApp
      </Link>
    </div>
  );
}
