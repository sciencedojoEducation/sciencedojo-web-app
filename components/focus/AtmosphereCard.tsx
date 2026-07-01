import type { Theme } from "@/lib/themes";

type AtmosphereCardProps = {
  theme: Theme;
  isActive: boolean;
  isProUser: boolean;
  onSelect: (themeId: string) => void;
  onProGate: (theme: Theme) => void;
};

export default function AtmosphereCard({
  theme,
  isActive,
  isProUser,
  onSelect,
  onProGate,
}: AtmosphereCardProps) {
  const locked = theme.tier === "pro" && !isProUser;

  return (
    <button
      type="button"
      onClick={() => (locked ? onProGate(theme) : onSelect(theme.id))}
      aria-pressed={isActive}
      className={[
        "fd-card relative p-4 text-left",
        isActive ? "active" : "",
      ].join(" ")}
    >
      <span className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="grid h-11 w-11 shrink-0 grid-cols-2 gap-1 rounded-xl p-2 ring-1 ring-[var(--fd-border-primary)]"
          style={{ backgroundColor: theme.previewColors.bg }}
        >
          <span
            className="rounded-full"
            style={{ backgroundColor: theme.previewColors.accent1 }}
          />
          <span
            className="rounded-full"
            style={{ backgroundColor: theme.previewColors.accent2 }}
          />
          <span className="rounded-full bg-white/20" />
          <span className="rounded-full bg-black/15" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-[var(--fd-text-primary)]">
              {theme.name}
            </span>
            {isActive && (
              <span
                className="text-xs font-bold text-[var(--fd-accent-primary)]"
                aria-label="Selected"
              >
                ✓
              </span>
            )}
          </span>
          <span className="mt-1 block text-xs font-medium text-[var(--fd-text-secondary)]">
            {theme.aesthetic}
          </span>
          <span className="mt-1 block text-xs leading-relaxed text-[var(--fd-text-tertiary)]">
            {theme.description}
          </span>
        </span>
      </span>

      <span className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-[var(--fd-bg-tertiary)] px-2 py-0.5 text-[0.64rem] font-bold uppercase tracking-[0.14em] text-[var(--fd-text-secondary)]">
          {locked ? "○ Pro" : theme.tier === "pro" ? "✓ Pro" : "Free"}
        </span>
        {theme.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-[var(--fd-bg-tertiary)] px-2 py-0.5 text-[0.64rem] font-medium text-[var(--fd-text-tertiary)]"
          >
            {tag}
          </span>
        ))}
      </span>
    </button>
  );
}
