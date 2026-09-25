"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import DashboardWelcomeBanner from "@/components/DashboardWelcomeBanner";
import DashboardThemePreviewControls from "@/components/DashboardThemePreviewControls";
import { getDashboardDayPeriod, type DashboardDayPeriod } from "@/lib/dashboard-day-period";

export type DashboardRole = "user" | "admin" | "tutor" | "parent" | "student" | "internal";
const DashboardRoleContext = createContext<DashboardRole>("user");
export function useDashboardRole() { return useContext(DashboardRoleContext); }

export default function DashboardFrame({
  children,
  sidebar,
  guidedTour,
  role,
  userName,
  avatarUrl,
  initialDashboardDark = false,
}: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  guidedTour: React.ReactNode;
  role: DashboardRole;
  userName?: string | null;
  avatarUrl?: string | null;
  initialDashboardDark?: boolean;
}) {
  const pathname = usePathname();
  const isDashboardHome = pathname === `/dashboard/${role}`;
  const [localNow, setLocalNow] = useState<Date | null>(null);
  const [previewPeriod, setPreviewPeriod] = useState<DashboardDayPeriod | null>(null);
  const [dashboardDark, setDashboardDark] = useState(initialDashboardDark);
  useEffect(() => {
    if (!isDashboardHome) return;
    const updateTime = () => setLocalNow(new Date());
    const animationFrame = window.requestAnimationFrame(updateTime);
    const interval = window.setInterval(updateTime, 60_000);
    document.addEventListener("visibilitychange", updateTime);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", updateTime);
    };
  }, [isDashboardHome]);
  const automaticPeriod = getDashboardDayPeriod(localNow?.getHours() ?? 14);
  const period = previewPeriod ?? automaticPeriod;
  const toggleDashboardDark = () => {
    const next = !dashboardDark;
    setDashboardDark(next);
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `dashboard_dark=${next ? "1" : "0"}; Max-Age=31536000; Path=/dashboard; SameSite=Lax${secure}`;
    document.cookie = `student_dashboard_dark=; Max-Age=0; Path=/dashboard/student; SameSite=Lax${secure}`;
  };
  const themeControls = isDashboardHome ? (
    <DashboardThemePreviewControls
      automaticPeriod={automaticPeriod}
      previewPeriod={previewPeriod}
      onPreviewPeriod={(selected) => setPreviewPeriod(current => current === selected ? null : selected)}
      darkMode={dashboardDark}
      onToggleDarkMode={toggleDashboardDark}
      placement="desktop"
    />
  ) : null;
  const dashboardWidth = role === "internal" ? "max-w-7xl" : role === "admin" || role === "tutor" || role === "student" ? "max-w-6xl" : "max-w-5xl";
  const isAcademyRoute =
    pathname === "/dashboard/tutor/academy" ||
    pathname.startsWith("/dashboard/tutor/academy/") ||
    pathname.startsWith("/dashboard/academy/") ||
    /^\/dashboard\/admin\/academy\/[^/]+\/preview$/.test(pathname);

  if (isAcademyRoute) {
    return <DashboardRoleContext.Provider value={role}><div className="h-[100dvh] min-h-0 overflow-hidden bg-white">{children}</div></DashboardRoleContext.Provider>;
  }

  return (
    <DashboardRoleContext.Provider value={role}><div className="dashboard-shell relative flex h-[100dvh] min-h-0 flex-1 flex-col overflow-hidden lg:flex-row" data-role={role} data-period={isDashboardHome ? period : undefined} data-home-theme={isDashboardHome ? (dashboardDark ? "dark" : "light") : undefined} data-student-mode={isDashboardHome && role === "student" ? (dashboardDark ? "dark" : "light") : undefined}>
      <a href="#dashboard-main" className="sr-only fixed left-3 top-3 z-[100] rounded-lg bg-white px-4 py-3 font-semibold text-[#102A43] shadow-lg focus:not-sr-only focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500">
        Skip to dashboard content
      </a>
      {sidebar}
      {themeControls}
      <main id="dashboard-main" tabIndex={-1} className={`dashboard-canvas min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain ${isDashboardHome ? "dashboard-themed-home-canvas lg:pl-8" : ""}`}>
        {isDashboardHome ? (
          <div className={`mx-auto px-3 pt-4 sm:px-6 sm:pt-6 md:px-8 md:pt-8 ${dashboardWidth}`}>
            <DashboardWelcomeBanner name={userName} avatarUrl={avatarUrl} role={role} period={period} localNow={localNow} />
            <DashboardThemePreviewControls
              automaticPeriod={automaticPeriod}
              previewPeriod={previewPeriod}
              onPreviewPeriod={(selected) => setPreviewPeriod(current => current === selected ? null : selected)}
              darkMode={dashboardDark}
              onToggleDarkMode={toggleDashboardDark}
              placement="mobile"
            />
          </div>
        ) : null}
        {children}
      </main>
      {guidedTour}
    </div></DashboardRoleContext.Provider>
  );
}
