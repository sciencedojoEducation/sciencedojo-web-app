import {
  FEATURED_ATMOSPHERE_IDS,
  THEMES,
  type Theme,
} from "@/lib/themes";
import AtmosphereCard from "./AtmosphereCard";

type FocusAtmospherePickerProps = {
  currentTheme: string;
  isProUser: boolean;
  expanded: boolean;
  onSelect: (themeId: string) => void;
  onProGate: (theme: Theme) => void;
  onToggleExpanded: () => void;
};

export default function FocusAtmospherePicker({
  currentTheme,
  isProUser,
  expanded,
  onSelect,
  onProGate,
  onToggleExpanded,
}: FocusAtmospherePickerProps) {
  const featured = FEATURED_ATMOSPHERE_IDS.map((id) =>
    THEMES.find((theme) => theme.id === id),
  ).filter((theme): theme is Theme => Boolean(theme));
  const more = THEMES.filter(
    (theme) => !FEATURED_ATMOSPHERE_IDS.includes(theme.id),
  );
  const visibleAtmospheres = expanded ? [...featured, ...more] : featured;

  return (
    <>
      <div className="mt-7 grid max-h-[42dvh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
        {visibleAtmospheres.map((theme) => (
          <AtmosphereCard
            key={theme.id}
            theme={theme}
            isActive={theme.id === currentTheme}
            isProUser={isProUser}
            onSelect={onSelect}
            onProGate={onProGate}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={onToggleExpanded}
        className="mx-auto mt-4 rounded-full px-4 py-2 text-sm font-medium text-[var(--fd-text-secondary)] transition hover:text-[var(--fd-text-primary)]"
        aria-expanded={expanded}
      >
        {expanded ? "Fewer atmospheres" : "More atmospheres"}
      </button>
    </>
  );
}
