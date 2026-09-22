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
      className={`group flex min-h-11 items-center gap-2.5 rounded-xl px-2.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E5AA8] focus-visible:ring-offset-2 ${
        isActive ? "bg-[#1E5AA8]/8 font-semibold text-[#164b87]" : "font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <span className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg ${
        isActive ? "bg-[#1E5AA8]/12 text-[#1E5AA8] ring-1 ring-[#6FE3D6]/70" : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-[#1E5AA8]"
      }`} aria-hidden="true">
        <DashboardNavIcon name={iconName} />
      </span>
      <span className="min-w-0 flex-1 truncate">{name}</span>
      <DashboardMenuBadge badgeKey={badgeKey} label={name} />
    </Link>
  );
}
