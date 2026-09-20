"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { DashboardBadgeCounts, DashboardBadgeKey } from "@/lib/dashboard-badges";

const DashboardBadgeContext = createContext<DashboardBadgeCounts | null>(null);

export default function DashboardBadgeProvider({
  initialCounts,
  children,
}: {
  initialCounts: DashboardBadgeCounts;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [counts, setCounts] = useState(initialCounts);

  useEffect(() => {
    let cancelled = false;

    async function refreshCounts() {
      try {
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
  }, [pathname]);

  const value = useMemo(() => counts, [counts]);
  return <DashboardBadgeContext.Provider value={value}>{children}</DashboardBadgeContext.Provider>;
}

export function DashboardMenuBadge({
  badgeKey,
  label,
}: {
  badgeKey?: DashboardBadgeKey;
  label: string;
}) {
  const counts = useContext(DashboardBadgeContext);
  const count = badgeKey && counts ? counts[badgeKey] : 0;
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
