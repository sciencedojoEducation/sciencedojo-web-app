type FocusStatusDotProps = {
  /** Must reflect the *real* audio element state. */
  isPlaying: boolean;
  variant?: "panel" | "fullscreen";
  expanded?: boolean;
  onClick?: () => void;
};

/** The tiny atmospheric status dot.
 *  - panel: a button with a downward arrow, opens the soundtrack controls.
 *  - fullscreen: just the dot, no arrow, no interaction. */
export default function FocusStatusDot({
  isPlaying,
  variant = "panel",
  expanded = false,
  onClick,
}: FocusStatusDotProps) {
  const dot = (
    <span
      className={`block h-2.5 w-2.5 rounded-full transition-colors duration-500 ${
        isPlaying ? "bg-teal dot-breathe" : "bg-white/25"
      }`}
    />
  );

  if (variant === "fullscreen") {
    return (
      <span className="flex items-center justify-center" aria-hidden="true">
        {dot}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      aria-label={
        expanded
          ? "Close focus atmosphere controls"
          : "Open focus atmosphere controls"
      }
      className="relative z-10 flex flex-col items-center gap-1 rounded-full px-3 py-1 text-white/50 transition hover:text-white/80"
    >
      {dot}
      <svg
        width="12"
        height="8"
        viewBox="0 0 12 8"
        fill="none"
        aria-hidden="true"
        className={`transition-transform duration-300 ${
          expanded ? "rotate-180" : ""
        }`}
      >
        <path
          d="M1 1.5 6 6.5 11 1.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
