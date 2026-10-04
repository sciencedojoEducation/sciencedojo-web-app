export const academyTextColors = {
  red: "#B91C1C",
  green: "#166534",
  blue: "#1D4ED8",
} as const;

export function academyTextColor(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const color = value.trim().toLowerCase();
  const rgb = color.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
  const hex = rgb ? `#${rgb.slice(1).map((part) => Number(part).toString(16).padStart(2, "0")).join("")}` : color;
  return Object.values(academyTextColors).find((allowed) => allowed.toLowerCase() === hex);
}
