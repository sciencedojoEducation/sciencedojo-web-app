import { Check } from "lucide-react";
import type { AcademyProgressState } from "@/lib/tutor-academy";

const labels: Record<AcademyProgressState, string> = {
  unstarted: "Not started",
  started: "Started",
  completed: "Completed",
};

export default function AcademyProgressRing({
  state,
  size = 20,
  className = "",
}: {
  state: AcademyProgressState;
  size?: number;
  className?: string;
}) {
  if (state === "completed") {
    return (
      <span
        role="img"
        aria-label={labels[state]}
        className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--academy-accent)] text-white ${className}`}
        style={{ width: size, height: size }}
      >
        <Check size={Math.round(size * 0.58)} strokeWidth={3} aria-hidden="true" />
      </span>
    );
  }

  const radius = 8;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg role="img" aria-label={labels[state]} viewBox="0 0 20 20" width={size} height={size} className={`shrink-0 -rotate-90 ${className}`}>
      <circle cx="10" cy="10" r={radius} fill="none" stroke="#C9CDD2" strokeWidth="2" />
      {state === "started" ? (
        <circle cx="10" cy="10" r={radius} fill="none" stroke="var(--academy-accent)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={`${circumference * 0.46} ${circumference}`} />
      ) : null}
    </svg>
  );
}
