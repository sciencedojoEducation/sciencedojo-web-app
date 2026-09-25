"use client";

import { useEffect, useState } from "react";

function formatTime(date: Date) {
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export default function InternalClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setNow(new Date()));
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => { window.cancelAnimationFrame(frame); window.clearInterval(timer); };
  }, []);

  return (
    <div className="flex items-center justify-between gap-4 border-t border-[var(--theme-line)] py-3" aria-label="Local date and time">
      <span className="text-sm text-[var(--theme-muted)]">{now ? formatDate(now) : "Local date"}</span>
      <time className="text-base font-semibold tabular-nums text-[var(--theme-ink)]">{now ? formatTime(now) : "--:--"}</time>
    </div>
  );
}
