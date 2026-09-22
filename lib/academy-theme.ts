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
  blue: { label: "ScienceDojo blue", accent: "#1E5AA8", soft: "#EEF4FB", ink: "#173A63" },
  teal: { label: "Learning teal", accent: "#147D74", soft: "#ECF7F5", ink: "#174B46" },
  navy: { label: "Deep navy", accent: "#243C66", soft: "#EFF2F7", ink: "#172842" },
  amber: { label: "Warm amber", accent: "#A45B08", soft: "#FBF3E8", ink: "#593506" },
} as const;

export function resolveAcademyTheme(course: Pick<AcademyCourse, "theme">): AcademyTheme {
  return { ...defaultAcademyTheme, ...(course.theme || {}) };
}

export function academyThemeStyle(course: Pick<AcademyCourse, "theme">) {
  const theme = resolveAcademyTheme(course);
  const palette = academyAccentPalettes[theme.accent];
  return {
    "--academy-accent": palette.accent,
    "--academy-accent-soft": palette.soft,
    "--academy-accent-ink": palette.ink,
    "--academy-block-gap":
      theme.density === "compact" ? "2rem" : theme.density === "spacious" ? "5rem" : "3.5rem",
    "--academy-reading-leading": theme.density === "compact" ? "1.65" : "1.9",
  } as CSSProperties;
}

export function academyTypographyClass(course: Pick<AcademyCourse, "theme">) {
  const typography = resolveAcademyTheme(course).typography;
  if (typography === "editorial") return "academy-theme-editorial";
  if (typography === "friendly-sans") return "academy-theme-friendly";
  return "academy-theme-modern";
}
