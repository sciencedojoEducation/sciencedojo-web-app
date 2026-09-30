import type { AcademyBlockBackground } from "./tutor-academy.ts";

export const academyBlockBackgroundChoices = [
  { kind: "light", label: "Light", preview: "#FFFFFF" },
  { kind: "gray", label: "Gray", preview: "#F0F2F5" },
  { kind: "theme", label: "Theme", preview: "var(--academy-accent, #1E5AA8)" },
  { kind: "theme-tint", label: "Theme tint", preview: "var(--academy-accent-soft, #EEF4FB)" },
  { kind: "dark", label: "Dark", preview: "#29313D" },
  { kind: "black", label: "Black", preview: "#101318" },
] as const;

export const academyBlockBackgroundKinds = [
  ...academyBlockBackgroundChoices.map((choice) => choice.kind),
  "custom",
  "image",
] as const;

export function isValidAcademyBackgroundColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

export function isSafeAcademyBackgroundImageUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function academyBackgroundNeedsContentPanel(background?: AcademyBlockBackground): boolean {
  if (!background) return false;
  if (["theme", "dark", "black", "image"].includes(background.kind)) return true;
  if (background.kind !== "custom" || !isValidAcademyBackgroundColor(background.color)) return false;
  const channels = background.color.slice(1).match(/../g)!.map((value) => {
    const channel = Number.parseInt(value, 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2] < 0.3;
}
