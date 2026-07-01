export type FocusMode = "focus" | "exam";

type FocusModeSwitchProps = {
  mode: FocusMode;
  onChange: (mode: FocusMode) => void;
};

const MODES: { id: FocusMode; label: string }[] = [
  { id: "focus", label: "Focus" },
  { id: "exam", label: "Exam" },
];

/** Segmented control: [ Focus | Exam ]. Stays compact so it never
 *  overlaps the status text beside it. */
export default function FocusModeSwitch({
  mode,
  onChange,
}: FocusModeSwitchProps) {
  return (
    <div
      role="tablist"
      aria-label="Timer mode"
      className="relative z-10 inline-flex shrink-0 rounded-full bg-white/8 p-1 ring-1 ring-white/10"
    >
      {MODES.map((m) => {
        const active = m.id === mode;
        return (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(m.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              active
                ? "bg-white text-navy shadow-sm"
                : "text-white/60 hover:text-white/90"
            }`}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
