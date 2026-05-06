"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getPublicSource, trackEvent } from "@/lib/analytics";

type BookAssessmentLinkProps = {
  children: React.ReactNode;
  className?: string;
  source?: string;
  pageSlug?: string;
};

export default function BookAssessmentLink({
  children,
  className,
  source,
  pageSlug,
}: BookAssessmentLinkProps) {
  const pathname = usePathname();

  return (
    <Link
      href="/free-assessment"
      className={className}
      onClick={() => {
        trackEvent("cta_book_free_assessment_click", {
          source: source || getPublicSource(pathname),
          page_slug: pageSlug || getPublicSource(pathname),
        });
      }}
    >
      {children}
    </Link>
  );
}
