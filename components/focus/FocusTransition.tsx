/** The brief visual transition from preparation into the immersive session —
 *  an ambient glow that expands outward, signalling "entering focus".
 *  Purely decorative; never intercepts taps. */
export default function FocusTransition() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <div className="animate-glow-expand absolute left-1/2 top-1/2 h-64 w-64 rounded-full bg-blue/40 blur-3xl" />
    </div>
  );
}
