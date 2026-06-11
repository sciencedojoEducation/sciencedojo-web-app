"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

type MentorActionLinkProps = {
  href: string;
  eventName: string;
  eventParams?: Record<string, string | number | boolean | null | undefined>;
  className?: string;
  children: React.ReactNode;
};

export default function MentorActionLink({
  href,
  eventName,
  eventParams = {},
  className,
  children,
}: MentorActionLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        try {
          trackEvent(eventName, eventParams);
        } catch {
          // Analytics should never block navigation.
        }
      }}
    >
      {children}
    </Link>
  );
}
