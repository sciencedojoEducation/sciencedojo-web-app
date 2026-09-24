"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext } from "react";

export type DashboardRole = "user" | "admin" | "tutor" | "parent" | "student" | "internal";
const DashboardRoleContext = createContext<DashboardRole>("user");
export function useDashboardRole() { return useContext(DashboardRoleContext); }

export default function DashboardFrame({
  children,
  sidebar,
  guidedTour,
  role,
}: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  guidedTour: React.ReactNode;
  role: DashboardRole;
}) {
  const pathname = usePathname();
  const isAcademyRoute =
    pathname === "/dashboard/tutor/academy" ||
    pathname.startsWith("/dashboard/tutor/academy/") ||
    pathname.startsWith("/dashboard/academy/") ||
    /^\/dashboard\/admin\/academy\/[^/]+\/preview$/.test(pathname);

  if (isAcademyRoute) {
    return <DashboardRoleContext.Provider value={role}><div className="h-[100dvh] min-h-0 overflow-hidden bg-white">{children}</div></DashboardRoleContext.Provider>;
  }

  return (
    <DashboardRoleContext.Provider value={role}><div className="dashboard-shell flex h-[100dvh] min-h-0 flex-1 flex-col overflow-hidden lg:flex-row" data-role={role}>
      <a href="#dashboard-main" className="sr-only fixed left-3 top-3 z-[100] rounded-lg bg-white px-4 py-3 font-semibold text-[#102A43] shadow-lg focus:not-sr-only focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500">
        Skip to dashboard content
      </a>
      {sidebar}
      <main id="dashboard-main" tabIndex={-1} className="dashboard-canvas min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain">
        {children}
      </main>
      {guidedTour}
    </div></DashboardRoleContext.Provider>
  );
}
