"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { DashboardBadgeCounts, DashboardBadgeKey } from "@/lib/dashboard-badges";

type DashboardBadgeContextValue = {
  counts: DashboardBadgeCounts;
  activeBadgeKey?: DashboardBadgeKey;
};

const DashboardBadgeContext = createContext<DashboardBadgeContextValue | null>(null);

function badgeKeyForPathname(pathname: string): DashboardBadgeKey | undefined {
  if (pathname === "/dashboard/parent" || pathname === "/dashboard/student") return "bookingPayments";
  if (pathname.startsWith("/dashboard/student/missions")) return "studentMissions";
  if (pathname.startsWith("/dashboard/tutor/schedule")) return "tutorRequests";
  if (pathname.startsWith("/dashboard/tutor/missions")) return "missionReviews";
  if (pathname.startsWith("/dashboard/admin/projects") || pathname.startsWith("/dashboard/internal/projects")) return "projectIdeas";
  if (pathname.startsWith("/dashboard/admin/leads")) return "assessmentLeads";
  if (pathname.startsWith("/dashboard/messages")) return "messages";
  if (pathname.startsWith("/dashboard/admin/safeguards")) return "safeguards";
  if (pathname.startsWith("/dashboard/admin/tutors")) return "manageTutors";
  return undefined;
}

async function persistBadgeView(badgeKey: DashboardBadgeKey) {
  try {
    const response = await fetch("/api/dashboard/badges", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ badgeKey }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export default function DashboardBadgeProvider({
  initialCounts,
  children,
}: {
  initialCounts: DashboardBadgeCounts;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [counts, setCounts] = useState(initialCounts);
  const activeBadgeKey = badgeKeyForPathname(pathname);

  useEffect(() => {
    let cancelled = false;

    async function refreshCounts() {
      try {
        if (activeBadgeKey) await persistBadgeView(activeBadgeKey);
        const response = await fetch("/api/dashboard/badges", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as { counts?: DashboardBadgeCounts };
        if (!cancelled && payload.counts) setCounts(payload.counts);
      } catch {
        // Keep the last successful counts when the user is offline or refresh fails.
      }
    }

    void refreshCounts();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refreshCounts();
    }, 60_000);

    function handleFocus() {
      void refreshCounts();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") void refreshCounts();
    }

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeBadgeKey, pathname]);

  const value = useMemo(() => ({ counts, activeBadgeKey }), [activeBadgeKey, counts]);
  return <DashboardBadgeContext.Provider value={value}>{children}</DashboardBadgeContext.Provider>;
}

export function DashboardBadgeViewMarker({ badgeKey }: { badgeKey: DashboardBadgeKey }) {
  useEffect(() => {
    void persistBadgeView(badgeKey);
  }, [badgeKey]);

  return null;
}

export function DashboardMenuBadge({
  badgeKey,
  label,
}: {
  badgeKey?: DashboardBadgeKey;
  label: string;
}) {
  const badgeState = useContext(DashboardBadgeContext);
  const count = badgeKey && badgeState && badgeState.activeBadgeKey !== badgeKey
    ? badgeState.counts[badgeKey]
    : 0;
  if (!count) return null;

  const displayCount = count > 99 ? "99+" : String(count);

  return (
    <span
      aria-label={`${count} pending ${label.toLowerCase()}`}
      title={`${count} pending ${label.toLowerCase()}`}
      className="min-w-[1.4rem] rounded-full bg-red-500 px-2 py-0.5 text-center text-[10px] font-black text-white shadow-lg shadow-red-500/20 animate-in zoom-in duration-300"
    >
      {displayCount}
    </span>
  );
}
