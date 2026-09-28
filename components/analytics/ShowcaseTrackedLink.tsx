"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { trackEvent } from "@/lib/analytics";
import type { ShowcaseRole } from "@/lib/product-showcase";

export default function ShowcaseTrackedLink({ href, role, sourcePage, kind, className, children }: {
  href: string;
  role: ShowcaseRole;
  sourcePage: "homepage" | "how_it_works";
  kind: "tour" | "cta";
  className: string;
  children: ReactNode;
}) {
  return <Link href={href} className={className} onClick={() => trackEvent(kind === "tour" ? "showcase_tour_click" : "showcase_cta_click", { role, source_page: sourcePage, destination: href })}>{children}</Link>;
}
