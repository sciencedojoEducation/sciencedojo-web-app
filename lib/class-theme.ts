const SUBJECT_THEME_PRESETS = [
  "#6366f1",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
  "#f97316",
  "#06b6d4",
];

const SUBJECT_THEMES = [
  { match: ["math", "algebra", "geometry", "calculus", "statistics"], color: "#2563eb", bannerColor: "#1d4ed8", label: "Mathematics", artwork: "mathematics" },
  { match: ["physic", "mechanic", "electric", "force", "motion"], color: "#0891b2", bannerColor: "#0e7490", label: "Physics", artwork: "physics" },
  { match: ["chem", "organic", "inorganic", "molecule"], color: "#db2777", bannerColor: "#be185d", label: "Chemistry", artwork: "chemistry" },
  { match: ["biol", "human", "cell", "genetic", "ecology"], color: "#059669", bannerColor: "#047857", label: "Biology", artwork: "biology" },
  { match: ["econom", "business"], color: "#ea580c", bannerColor: "#9a3412", label: "Economics", artwork: "economics" },
  { match: ["computer", "coding", "programming"], color: "#7c3aed", bannerColor: "#6d28d9", label: "Computer Science", artwork: "computer" },
  { match: ["science"], color: "#0f766e", bannerColor: "#115e59", label: "Science", artwork: "science" },
] as const;

export type ClassSubjectArtwork = (typeof SUBJECT_THEMES)[number]["artwork"] | "general";

function hashedColor(subject: string) {
  const hash = subject.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return SUBJECT_THEME_PRESETS[hash % SUBJECT_THEME_PRESETS.length];
}

function darkenHex(color: string) {
  const channels = color.match(/[0-9a-f]{2}/gi);
  if (!channels || channels.length !== 3) return "#334155";
  return `#${channels.map((channel) => Math.round(parseInt(channel, 16) * 0.65).toString(16).padStart(2, "0")).join("")}`;
}

export function getClassSubjectTheme(subject: string, coverColor?: string | null) {
  const normalizedSubject = (subject || "Class").toLowerCase();
  const matchedTheme = SUBJECT_THEMES.find((theme) =>
    theme.match.some((keyword) => normalizedSubject.includes(keyword))
  );
  const semanticColor = matchedTheme?.color || hashedColor(subject || "Class");
  const color = coverColor && coverColor !== "#6366f1" ? coverColor : semanticColor;

  return {
    color,
    bannerColor: matchedTheme?.bannerColor || darkenHex(color),
    label: matchedTheme?.label || subject || "Class",
    artwork: (matchedTheme?.artwork || "general") as ClassSubjectArtwork,
    gradient: `linear-gradient(135deg, ${color}, ${color}cc)`,
  };
}

export const CLASS_THEME_SWATCHES = SUBJECT_THEMES.map((theme) => theme.color);
