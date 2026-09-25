"use client";

import { Contrast, MoonStar, Sun, Sunrise, Sunset } from "lucide-react";
import type { DashboardDayPeriod } from "@/lib/dashboard-day-period";

const PERIOD_BUTTONS = [
  { period: "morning", label: "Morning", Icon: Sunrise },
  { period: "afternoon", label: "Afternoon", Icon: Sun },
  { period: "evening", label: "Evening", Icon: Sunset },
  { period: "night", label: "Night", Icon: MoonStar },
] as const;

type DashboardThemePreviewControlsProps = {
  automaticPeriod: DashboardDayPeriod;
  previewPeriod: DashboardDayPeriod | null;
  onPreviewPeriod: (period: DashboardDayPeriod) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  placement: "desktop" | "mobile";
};

export default function DashboardThemePreviewControls({
  automaticPeriod,
  previewPeriod,
  onPreviewPeriod,
  darkMode,
  onToggleDarkMode,
  placement,
}: DashboardThemePreviewControlsProps) {
  return (
    <div
      role="group"
      aria-label="Dashboard theme preview"
      className={placement === "desktop"
        ? "dashboard-theme-controls absolute left-64 top-1/2 z-40 hidden -translate-y-1/2 translate-x-1.5 flex-col items-center gap-1 rounded-full border border-[var(--theme-line)] bg-[var(--theme-surface)] p-1 shadow-lg shadow-slate-900/10 lg:flex"
        : "dashboard-theme-controls mt-3 flex w-fit items-center gap-1 rounded-full border border-[var(--theme-line)] bg-[var(--theme-surface)] p-1 shadow-sm lg:hidden"}
    >
      {PERIOD_BUTTONS.map(({ period, label, Icon }) => {
        const selected = previewPeriod === period;
        const title = selected
          ? `Return to automatic local time from ${label.toLowerCase()} preview`
          : `Preview ${label.toLowerCase()} theme${previewPeriod === null && automaticPeriod === period ? " (current local time)" : ""}`;

        return (
          <button
            key={period}
            type="button"
            aria-label={title}
            aria-pressed={selected}
            title={title}
            onClick={() => onPreviewPeriod(period)}
            className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--theme-surface)] ${selected ? "bg-[var(--theme-accent)] text-[var(--theme-accent-contrast)]" : "text-[var(--theme-muted)] hover:bg-[var(--theme-accent-soft)] hover:text-[var(--theme-accent)]"}`}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden="true" />
            {!selected && previewPeriod === null && automaticPeriod === period && (
              <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-[var(--theme-accent)]" aria-hidden="true" />
            )}
          </button>
        );
      })}
      <span className={placement === "desktop" ? "my-0.5 h-px w-5 bg-[var(--theme-line)]" : "mx-0.5 h-5 w-px bg-[var(--theme-line)]"} aria-hidden="true" />
      <button
        type="button"
        aria-label={darkMode ? "Turn off dark mode" : "Turn on dark mode"}
        aria-pressed={darkMode}
        title={darkMode ? "Turn off dark mode" : "Turn on dark mode"}
        onClick={onToggleDarkMode}
        className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--theme-muted)] transition-colors hover:text-[var(--theme-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--theme-surface)]"
      >
        <span className={`flex h-7 w-7 items-center justify-center rounded-full ${darkMode ? "bg-[var(--theme-ink)] text-[var(--theme-surface)]" : "hover:bg-[var(--theme-accent-soft)]"}`}>
          <Contrast className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
        </span>
      </button>
    </div>
  );
}
