"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getPublicSource, trackEvent } from "@/lib/analytics";

type AiPracticeStudioCtaLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  cta: string;
  source?: string;
};

export default function AiPracticeStudioCtaLink({
  href,
  children,
  className,
  cta,
  source,
}: AiPracticeStudioCtaLinkProps) {
  const pathname = usePathname();

  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        trackEvent("ai_practice_studio_cta_click", {
          cta,
          source_page: source || getPublicSource(pathname),
        });
      }}
    >
      {children}
    </Link>
  );
}
