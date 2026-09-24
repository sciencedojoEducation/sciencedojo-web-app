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
}

export default function SidebarLink({ href, name, iconName, badgeKey, exact = false, tourId }: SidebarLinkProps) {
  const pathname = usePathname();
  const isActive = isDashboardNavItemActive(pathname, { href, exact });

  return (
    <Link
      href={href}
      data-tour={tourId}
      aria-current={isActive ? "page" : undefined}
      className={`group flex min-h-11 items-center gap-2.5 rounded-xl px-2.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#102A43] ${
        isActive ? "bg-white/14 font-semibold text-white" : "font-medium text-slate-200 hover:bg-white/8 hover:text-white"
      }`}
    >
      <span className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg ${
        isActive ? "bg-cyan-300/20 text-cyan-200 ring-1 ring-cyan-200/40" : "bg-white/8 text-slate-200 group-hover:bg-white/12 group-hover:text-white"
      }`} aria-hidden="true">
        <DashboardNavIcon name={iconName} />
      </span>
      <span className="min-w-0 flex-1 truncate">{name}</span>
      <DashboardMenuBadge badgeKey={badgeKey} label={name} />
    </Link>
  );
}
