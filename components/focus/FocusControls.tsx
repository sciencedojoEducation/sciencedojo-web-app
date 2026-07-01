type FocusControlsProps = {
  isRunning: boolean;
  isFullscreen: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  onToggleFullscreen: () => void;
  /** Drives the accessible labels — Focus Mode vs Exam Mode. */
  context?: "focus" | "exam";
};

/** Minimal timer controls: Reset · Play/Pause · Fullscreen.
 *  Real <button> elements, accessible labels, comfortably tappable.
 *  Shared by Focus Mode and Exam Mode. */
export default function FocusControls({
  isRunning,
  isFullscreen,
  onPlayPause,
  onReset,
  onToggleFullscreen,
  context = "focus",
}: FocusControlsProps) {
  const isExam = context === "exam";

  const playPauseLabel = isRunning
    ? isExam
      ? "Pause exam timer"
      : "Pause focus timer"
    : isExam
      ? "Start exam timer"
      : "Play focus timer";
  const resetLabel = isExam ? "Reset exam timer" : "Reset focus timer";
  const fullscreenLabel = isFullscreen
    ? isExam
      ? "Exit fullscreen exam mode"
      : "Exit fullscreen focus mode"
    : isExam
      ? "Enter fullscreen exam mode"
      : "Enter fullscreen focus mode";

  const ghost =
    "flex h-12 w-12 items-center justify-center rounded-full bg-[var(--fd-bg-tertiary)] text-[var(--fd-text-secondary)] ring-1 ring-[var(--fd-border-primary)] transition hover:brightness-110 hover:text-[var(--fd-text-primary)]";

  return (
    <div className="relative z-10 flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={onReset}
        aria-label={resetLabel}
        className={ghost}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path
            d="M3.6 9a5.5 5.5 0 1 1 1.5 3.8"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M2.8 6.2 3.5 10l3.8-.8"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <button
        type="button"
        onClick={onPlayPause}
        aria-label={playPauseLabel}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--fd-accent-primary)] text-[var(--fd-bg-primary)] shadow-[0_10px_30px_-8px_var(--fd-accent-primary)] transition hover:brightness-110 active:scale-95"
      >
        {isRunning ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <rect x="4.5" y="3" width="4" height="14" rx="1.2" />
            <rect x="11.5" y="3" width="4" height="14" rx="1.2" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M6 3.7c0-.9 1-1.5 1.8-1L16 7.9c.8.5.8 1.7 0 2.2L7.8 15.3c-.8.5-1.8-.1-1.8-1V3.7Z" />
          </svg>
        )}
      </button>

      <button
        type="button"
        onClick={onToggleFullscreen}
        aria-label={fullscreenLabel}
        className={ghost}
      >
        {isFullscreen ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path
              d="M7 2v3a2 2 0 0 1-2 2H2M16 7h-3a2 2 0 0 1-2-2V2M2 11h3a2 2 0 0 1 2 2v3M11 16v-3a2 2 0 0 1 2-2h3"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path
              d="M2 6V4a2 2 0 0 1 2-2h2M12 2h2a2 2 0 0 1 2 2v2M16 12v2a2 2 0 0 1-2 2h-2M6 16H4a2 2 0 0 1-2-2v-2"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
