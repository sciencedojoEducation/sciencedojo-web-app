"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

export default function TutorConnectLink({
  href,
  className,
  isGuest,
  subjects,
  children,
}: {
  href: string;
  className?: string;
  isGuest: boolean;
  subjects: string[];
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        if (!isGuest) return;

        trackEvent("tutor_connect_click", {
          source: "tutor_card",
          subject: subjects[0] || "unknown",
        });
      }}
    >
      {children}
    </Link>
  );
}
