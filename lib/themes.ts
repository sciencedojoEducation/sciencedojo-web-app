import type { FocusDojoAccessLevel } from "@/lib/focusdojo/access-levels";

export const DEFAULT_THEME = "midnight-focus" as const;
export const EXAM_THEME = "exam-silence" as const;
export const THEME_STORAGE_KEY = "focusdojo-theme";
export const LEGACY_THEME_STORAGE_KEY = "focusDojo.lastTheme";

export type SelectableThemeId =
  | "midnight-focus"
  | "sakura-night"
  | "old-library"
  | "forest-floor"
  | "lavender-haze"
  | "oled-dark"
  | "ocean-blue"
  | "daylight";

export type ThemeId = SelectableThemeId | typeof EXAM_THEME;
export interface Theme {
  id: SelectableThemeId;
  name: string;
  title: string;
  aesthetic: string;
  emotionalState: string;
  description: string;
  minimumAccess: FocusDojoAccessLevel;
  isDark: boolean;
  soundEnvironmentId: string | null;
  tags: string[];
  isDefault?: boolean;
  previewColors: {
    bg: string;
    accent1: string;
    accent2: string;
  };
}

export interface ExamTheme {
  id: typeof EXAM_THEME;
  name: string;
  title: string;
  aesthetic: string;
  emotionalState: string;
  description: string;
  minimumAccess: "free";
  isDark: true;
  soundEnvironmentId: null;
  tags: string[];
  previewColors: Theme["previewColors"];
}

export const THEMES: Theme[] = [
  {
    id: "midnight-focus",
    name: "Midnight Focus",
    title: "Midnight Focus",
    aesthetic: "Default",
    emotionalState: "clarity",
    description: "Deep navy with blue-to-teal accents",
    minimumAccess: "free",
    isDark: true,
    soundEnvironmentId: "deep-focus",
    tags: ["default", "clarity", "free"],
    isDefault: true,
    previewColors: {
      bg: "#0F172A",
      accent1: "#38BDF8",
      accent2: "#2DD4BF",
    },
  },
  {
    id: "sakura-night",
    name: "Sakura Night",
    title: "Sakura Night",
    aesthetic: "Soft Rose",
    emotionalState: "soft pastel focus",
    description: "Dark plum with pastel pink and rose",
    minimumAccess: "pro",
    isDark: true,
    soundEnvironmentId: "reading-atmosphere",
    tags: ["soft", "rose", "Pro"],
    previewColors: {
      bg: "#1A1020",
      accent1: "#F9A8D4",
      accent2: "#E879A8",
    },
  },
  {
    id: "old-library",
    name: "Old Library",
    title: "Old Library",
    aesthetic: "Dark Academia",
    emotionalState: "scholarly",
    description: "Espresso and walnut with warm amber",
    minimumAccess: "pro",
    isDark: true,
    soundEnvironmentId: "reading-atmosphere",
    tags: ["scholarly", "warm", "Pro"],
    previewColors: {
      bg: "#1C1612",
      accent1: "#D4A574",
      accent2: "#8B6F47",
    },
  },
  {
    id: "forest-floor",
    name: "Forest Floor",
    title: "Forest Floor",
    aesthetic: "Nature Calm",
    emotionalState: "grounding",
    description: "Deep forest with sage and mint",
    minimumAccess: "free",
    isDark: true,
    soundEnvironmentId: "reflection-space",
    tags: ["nature", "grounding", "free"],
    previewColors: {
      bg: "#0F1A14",
      accent1: "#86EFAC",
      accent2: "#4ADE80",
    },
  },
  {
    id: "lavender-haze",
    name: "Lavender Haze",
    title: "Lavender Haze",
    aesthetic: "Ethereal",
    emotionalState: "dreamy calm",
    description: "Deep violet-grey with lilac accents",
    minimumAccess: "pro",
    isDark: true,
    soundEnvironmentId: "creative-flow",
    tags: ["dreamy", "calm", "Pro"],
    previewColors: {
      bg: "#1A1625",
      accent1: "#C4B5FD",
      accent2: "#A78BFA",
    },
  },
  {
    id: "oled-dark",
    name: "OLED Dark",
    title: "OLED Dark",
    aesthetic: "Minimal",
    emotionalState: "minimal",
    description: "True black for maximum battery saving",
    minimumAccess: "pro",
    isDark: true,
    soundEnvironmentId: null,
    tags: ["minimal", "quiet", "Pro"],
    previewColors: {
      bg: "#000000",
      accent1: "#E2E8F0",
      accent2: "#94A3B8",
    },
  },
  {
    id: "ocean-blue",
    name: "Ocean Blue",
    title: "Ocean Blue",
    aesthetic: "Coastal",
    emotionalState: "coastal chill",
    description: "Deep ocean with sky blue accents",
    minimumAccess: "pro",
    isDark: true,
    soundEnvironmentId: "calm-revision",
    tags: ["coastal", "calm", "Pro"],
    previewColors: {
      bg: "#0C1929",
      accent1: "#7DD3FC",
      accent2: "#38BDF8",
    },
  },
  {
    id: "daylight",
    name: "Daylight",
    title: "Daylight",
    aesthetic: "Light Academia",
    emotionalState: "daytime calm",
    description: "Warm off-white for daytime study",
    minimumAccess: "basic",
    isDark: false,
    soundEnvironmentId: "calm-revision",
    tags: ["daytime", "light", "free"],
    previewColors: {
      bg: "#ECEAE4",
      accent1: "#0F766E",
      accent2: "#14B8A6",
    },
  },
];

// exam-silence exists only as CSS tokens and EXAM_THEME constant.
// It is automatic for Exam Mode and is not user-selectable.
export const examSilenceTheme: ExamTheme = {
  id: EXAM_THEME,
  name: "Exam Silence",
  title: "Exam Silence",
  aesthetic: "Exam",
  emotionalState: "controlled pressure",
  description: "A quiet exam-practice atmosphere with no ambience.",
  minimumAccess: "free",
  isDark: true,
  soundEnvironmentId: null,
  tags: ["exam", "silent", "pressure"],
  previewColors: {
    bg: "#18181B",
    accent1: "#C8D3F5",
    accent2: "#7F8FB8",
  },
};

export const SELECTABLE_THEMES = THEMES;
export const FREE_THEMES = THEMES.filter(
  (theme) => theme.minimumAccess === "free",
);
export const BASIC_THEMES = THEMES.filter(
  (theme) => theme.minimumAccess === "free" || theme.minimumAccess === "basic",
);
export const PRO_THEMES = THEMES.filter(
  (theme) => theme.minimumAccess === "pro",
);
export const FEATURED_ATMOSPHERE_IDS: SelectableThemeId[] = [
  "midnight-focus",
  "forest-floor",
  "daylight",
];

const LEGACY_THEME_MAP: Record<string, SelectableThemeId> = {
  "deep-focus": "midnight-focus",
  midnight: "midnight-focus",
  "forest-calm": "forest-floor",
  "paper-light": "daylight",
};

export function normalizeThemeId(id: string | null | undefined): ThemeId {
  if (id === EXAM_THEME) return EXAM_THEME;
  if (!id) return DEFAULT_THEME;
  if (LEGACY_THEME_MAP[id]) return LEGACY_THEME_MAP[id];
  if (THEMES.some((theme) => theme.id === id)) return id as SelectableThemeId;
  return DEFAULT_THEME;
}

export function normalizeSelectableThemeId(
  id: string | null | undefined,
): SelectableThemeId {
  const normalized = normalizeThemeId(id);
  return normalized === EXAM_THEME ? DEFAULT_THEME : normalized;
}

export function getFocusTheme(id: string | null | undefined): Theme | ExamTheme {
  const normalized = normalizeThemeId(id);
  if (normalized === EXAM_THEME) return examSilenceTheme;
  return (
    THEMES.find((theme) => theme.id === normalized) ??
    THEMES.find((theme) => theme.isDefault) ??
    THEMES[0]
  );
}

export function getSelectableTheme(id: string | null | undefined): Theme {
  const normalized = normalizeSelectableThemeId(id);
  return (
    THEMES.find((theme) => theme.id === normalized) ??
    THEMES.find((theme) => theme.isDefault) ??
    THEMES[0]
  );
}
