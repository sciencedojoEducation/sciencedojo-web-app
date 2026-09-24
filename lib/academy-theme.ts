import type { CSSProperties } from "react";
import type { AcademyCourse, AcademyTheme } from "@/lib/tutor-academy";

export const defaultAcademyTheme: AcademyTheme = {
  preset: "editorial",
  accent: "blue",
  typography: "editorial",
  density: "comfortable",
  coverStyle: "full-image",
  lessonHeaderStyle: "editorial",
};

export const academyAccentPalettes = {
  blue: { label: "ScienceDojo blue", accent: "#1E5AA8", soft: "#EEF4FB", ink: "#173A63", spark: "#DDEAF8" },
  teal: { label: "Learning teal", accent: "#147D74", soft: "#ECF7F5", ink: "#174B46", spark: "#D9F0EB" },
  navy: { label: "Deep navy", accent: "#243C66", soft: "#EFF2F7", ink: "#172842", spark: "#E1E8F3" },
  amber: { label: "Warm amber", accent: "#A45B08", soft: "#FBF3E8", ink: "#593506", spark: "#F9E6C6" },
  "blue-citrus": { label: "Blue + citrus", accent: "#155BA8", soft: "#EAF4FF", ink: "#123D6C", spark: "#FFF06A" },
  "coral-navy": { label: "Coral + navy", accent: "#A72C54", soft: "#FFF0F3", ink: "#5B1834", spark: "#FFB89D" },
  "violet-mint": { label: "Violet + mint", accent: "#5B3FB2", soft: "#F3EEFF", ink: "#362371", spark: "#8AE4D0" },
} as const;

export const academyJourneyPaletteKeys = ["blue-citrus", "coral-navy", "violet-mint"] as const;

export function isAcademyJourneyPalette(value: string): value is (typeof academyJourneyPaletteKeys)[number] {
  return academyJourneyPaletteKeys.some((key) => key === value);
}

export function resolveAcademyTheme(course: Pick<AcademyCourse, "theme">): AcademyTheme {
  return { ...defaultAcademyTheme, ...(course.theme || {}) };
}

export function academyThemeStyle(course: Pick<AcademyCourse, "theme">) {
  const theme = resolveAcademyTheme(course);
  const palette = academyAccentPalettes[theme.accent] || academyAccentPalettes.blue;
  return {
    "--academy-accent": palette.accent,
    "--academy-accent-soft": palette.soft,
    "--academy-accent-ink": palette.ink,
    "--academy-spark": palette.spark,
    "--academy-block-gap":
      theme.density === "compact" ? "2rem" : theme.density === "spacious" ? "5rem" : "3.5rem",
    "--academy-reading-leading": theme.density === "compact" ? "1.65" : "1.9",
  } as CSSProperties;
}

export function academyTypographyClass(course: Pick<AcademyCourse, "theme">) {
  const theme = resolveAcademyTheme(course);
  const typography = theme.typography;
  if (theme.preset === "journey") return "academy-theme-journey academy-theme-modern";
  if (typography === "editorial") return "academy-theme-editorial";
  if (typography === "friendly-sans") return "academy-theme-friendly";
  return "academy-theme-modern";
}
