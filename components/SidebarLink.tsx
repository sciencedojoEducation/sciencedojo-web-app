"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardMenuBadge } from "./DashboardBadgeProvider";
import DashboardNavIcon from "./DashboardNavIcon";
import type { DashboardBadgeKey } from "@/lib/dashboard-badges";
import { isDashboardNavItemActive, type DashboardNavIconName } from "@/lib/dashboard-navigation";

interface SidebarLinkProps {
  href: string;
  name: string;
  iconName: DashboardNavIconName;
  badgeKey?: DashboardBadgeKey;
  exact?: boolean;
  tourId?: string;
  appearance?: "dark" | "light";
}

export default function SidebarLink({ href, name, iconName, badgeKey, exact = false, tourId, appearance = "dark" }: SidebarLinkProps) {
  const pathname = usePathname();
  const isActive = isDashboardNavItemActive(pathname, { href, exact });
  const light = appearance === "light";

  return (
    <Link
      href={href}
      data-tour={tourId}
      aria-current={isActive ? "page" : undefined}
      className={`group flex min-h-11 items-center gap-2.5 rounded-xl px-2.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        light ? "focus-visible:ring-[var(--student-accent)] focus-visible:ring-offset-[var(--student-sidebar-bg)]" : "focus-visible:ring-cyan-300 focus-visible:ring-offset-[#102A43]"
      } ${
        isActive
          ? light ? "bg-[var(--student-accent-soft)] font-semibold text-[var(--student-ink)]" : "bg-white/14 font-semibold text-white"
          : light ? "font-medium text-[var(--student-muted)] hover:bg-[var(--student-accent-soft)] hover:text-[var(--student-ink)]" : "font-medium text-slate-200 hover:bg-white/8 hover:text-white"
      }`}
    >
      <span className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg ${
        light
          ? isActive ? "text-[var(--student-accent)]" : "text-[var(--student-muted)] group-hover:text-[var(--student-accent)]"
          : isActive ? "bg-cyan-300/20 text-cyan-200 ring-1 ring-cyan-200/40" : "bg-white/8 text-slate-200 group-hover:bg-white/12 group-hover:text-white"
      }`} aria-hidden="true">
        <DashboardNavIcon name={iconName} />
      </span>
      <span className="min-w-0 flex-1 truncate">{name}</span>
      <DashboardMenuBadge badgeKey={badgeKey} label={name} />
    </Link>
  );
}
