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
  { match: ["math", "algebra", "geometry", "calculus", "statistics"], color: "#2563eb", label: "Mathematics" },
  { match: ["physic", "mechanic", "electric", "force", "motion"], color: "#0891b2", label: "Physics" },
  { match: ["chem", "organic", "inorganic", "molecule"], color: "#db2777", label: "Chemistry" },
  { match: ["biol", "human", "cell", "genetic", "ecology"], color: "#059669", label: "Biology" },
  { match: ["econom", "business"], color: "#ea580c", label: "Economics" },
  { match: ["computer", "coding", "programming", "science"], color: "#7c3aed", label: "Computer Science" },
];

function hashedColor(subject: string) {
  const hash = subject.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return SUBJECT_THEME_PRESETS[hash % SUBJECT_THEME_PRESETS.length];
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
    label: matchedTheme?.label || subject || "Class",
    gradient: `linear-gradient(135deg, ${color}, ${color}cc)`,
  };
}

export const CLASS_THEME_SWATCHES = SUBJECT_THEMES.map((theme) => theme.color);
