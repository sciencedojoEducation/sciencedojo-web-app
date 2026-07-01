import type { FocusEnvironment } from "@/lib/focusEnvironments";

type FocusEnvironmentSelectorProps = {
  environments: FocusEnvironment[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
};

/** Compact study-environment picker. Deliberately not a playlist:
 *  no album art, no search, no favourites — just calm, named spaces. */
export default function FocusEnvironmentSelector({
  environments,
  selectedId,
  onSelect,
  onClose,
}: FocusEnvironmentSelectorProps) {
  return (
    <div className="relative z-10">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
          Study environment
        </p>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-medium text-white/55 transition hover:text-white"
        >
          Done
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {environments.map((env) => {
          const active = env.id === selectedId;
          return (
            <button
              key={env.id}
              type="button"
              onClick={() => onSelect(env.id)}
              aria-pressed={active}
              className={`rounded-2xl px-4 py-3 text-left transition ${
                active
                  ? "bg-white/12 ring-1 ring-teal/40"
                  : "bg-white/[0.04] ring-1 ring-white/5 hover:bg-white/[0.08]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-white">
                  {env.title}
                </span>
                {active && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-teal" />
                )}
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-white/55">
                {env.description}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-white/40">
                {env.mood}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
