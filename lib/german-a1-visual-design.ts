import type { AcademyBlockBackground, AcademyLesson, LessonBlock } from "./tutor-academy.ts";

const colours = {
  welcome: "#FFF4D8", listening: "#EAF4FF", reading: "#E8F6EF",
  language: "#F1EDFF", writing: "#FFF0E7", speaking: "#FCECF3",
  challenge: "#FFF6CD", review: "#E4F5EF",
};

function sectionColour(block: LessonBlock): string | undefined {
  const heading = "heading" in block ? block.heading || "" : "";
  if (/geschafft|rückblick|wiederholen|abruf|auswertung|bereitschaft/i.test(heading)) return colours.review;
  if (/challenge|alltagsaufgabe|prüfungsblick|prüfungssimulation|modelltraining|kapitelcheck|kapiteltest/i.test(heading)) return colours.challenge;
  if (block.type === "speaking-practice" || /sprechen|partnerkarten/i.test(heading)) return colours.speaking;
  if (block.type === "writing-practice" || /schreiben/i.test(heading)) return colours.writing;
  if (block.type === "audio" || /hören|hörverstehen|hören prüfen/i.test(heading)) return colours.listening;
  if (/lesen|leseverstehen/i.test(heading)) return colours.reading;
  if (block.type === "flashcards" || block.type === "worked-example" || /grammatik|sprache.*entdecken/i.test(heading)) return colours.language;
  if (/können sie am ende|lernziele|lernweg|ihr weg|prüfungstraining/i.test(heading)) return colours.welcome;
  return undefined;
}

/** Authoring defaults only: explicit backgrounds chosen in the builder win. */
export function styleGermanA1Lesson(lesson: AcademyLesson): AcademyLesson {
  const scene = lesson.blocks.find((block) => block.type === "image" && block.src);
  return {
    ...lesson,
    blocks: lesson.blocks.map((block) => {
      if (block.appearance?.background) return block;
      const heading = "heading" in block ? block.heading || "" : "";
      const context = /Ihre Aufgabe im Alltag|Ein Alltagstag mit Änderungen/.test(heading);
      const colour = sectionColour(block);
      const background: AcademyBlockBackground | undefined = context
        ? { kind: "image", imageUrl: scene?.type === "image" ? scene.src : "/images/academy/german-a1/grundlagen.jpg" }
        : colour ? { kind: "custom", color: colour } : undefined;
      if (!background) return block;
      return {
        ...block,
        appearance: {
          variant: "default", surface: "plain", width: "reading",
          ...block.appearance, spacing: "spacious", background,
        },
      };
    }),
  };
}
