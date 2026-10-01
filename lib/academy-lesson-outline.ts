import type { AcademyLesson, LessonBlock } from "./tutor-academy.ts";
import { isAcademyBlockRequiredForCompletion } from "./tutor-academy.ts";

export type AcademyLessonOutlineItem = { id: string; label: string };

function linkFor(block: LessonBlock, label: string): AcademyLessonOutlineItem | null {
  return block.id ? { id: block.id, label } : null;
}

/** A short, stable jump list for long learner pages; never changes lesson IDs. */
export function getAcademyLessonOutline(lesson: AcademyLesson): AcademyLessonOutlineItem[] {
  if (lesson.blocks.length < 16) return [];

  const dividers = lesson.blocks.flatMap((block) =>
    block.type === "divider" && block.label && block.id
      ? [{ id: block.id, label: block.label }]
      : []);
  if (dividers.length >= 3) {
    const capstones = lesson.blocks.flatMap((block) => {
      if (!isAcademyBlockRequiredForCompletion(block)) return [];
      if (block.type === "writing-practice") return linkFor(block, "Direkt zu Schreiben") || [];
      if (block.type === "speaking-practice") return linkFor(block, "Direkt zu Sprechen") || [];
      return [];
    });
    return [...dividers, ...capstones];
  }

  const sections: Array<[string, (block: LessonBlock) => boolean]> = [
    ["Hören", (block) => block.type === "audio"],
    ["Lesen", (block) => block.type === "text" && /^Lesen\b/.test(block.heading || "")],
    ["Wortschatz", (block) => block.type === "flashcards"],
    ["Schreiben", (block) => block.type === "writing-practice" && isAcademyBlockRequiredForCompletion(block)],
    ["Sprechen", (block) => block.type === "speaking-practice" && isAcademyBlockRequiredForCompletion(block)],
    ["Alltags-Challenge", (block) => block.type === "text" && block.heading === "Alltags-Challenge"],
    ["Freiwilliger Wortschatz", (block) => block.type === "callout" && block.heading === "Freiwillige Wortschatz-Vertiefung"],
    ["Kapitelabschluss", (block) => block.type === "callout" && block.heading === "Kapitel geschafft"],
  ];
  return sections.flatMap(([label, matches]) => {
    const block = lesson.blocks.find((item) => matches(item) && item.id);
    return block ? linkFor(block, label) || [] : [];
  });
}
