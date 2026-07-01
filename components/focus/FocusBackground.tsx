/** Decorative page background. Purely atmospheric — never intercepts taps. */
export default function FocusBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[var(--fd-bg-primary)]" />
      <div className="absolute -left-24 -top-28 h-80 w-80 rounded-full bg-[var(--fd-accent-muted)] blur-3xl" />
      <div className="absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-[var(--fd-bowl-glow)] blur-3xl" />
      <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[var(--fd-bg-secondary)]/40 blur-3xl" />
    </div>
  );
}
