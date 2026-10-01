import { isAcademyBlockRequiredForCompletion } from "./tutor-academy.ts";
import type { LessonBlock } from "./tutor-academy.ts";

export type LessonPhase = "learn" | "try" | "use" | "review";
export type LessonRoadmapItem = { id: string; label: string; requiredIds: string[] };
export const academyBlockAnchor = (block: LessonBlock, index: number) => `academy-block-${block.id || `position-${index}`}`;

export function academyLessonRoadmap(blocks: LessonBlock[]) {
  const heading = (block: LessonBlock) => "heading" in block ? block.heading || "" : "";
  const review = (block: LessonBlock) => /rückblick|recap|kapitel geschafft|abschlusscheck|selbstcheck|checkliste|review/i.test(heading(block));
  const phaseIndices: Partial<Record<LessonPhase, number>> = {};
  const learn = blocks.findIndex((block) => ["text", "tabs", "worked-example", "comparison-table", "flashcards"].includes(block.type) && !review(block));
  const attempt = blocks.findIndex((block) => block.type === "knowledge-check");
  const use = blocks.findIndex((block) => block.type === "writing-practice" || block.type === "speaking-practice");
  const recap = blocks.findIndex((block, index) => index > use && review(block));
  for (const [phase, index] of [["learn", learn], ["try", attempt], ["use", use], ["review", recap]] as const) {
    if (index >= 0) phaseIndices[phase] = index;
  }
  let starts = blocks.flatMap((block, index) => block.type === "divider" && block.label?.trim()
    ? [{ index, label: block.label }] : []);
  if (!starts.length) starts = blocks.flatMap((block, index) => /^\d+\s*[·.]\s+/.test(heading(block))
    ? [{ index, label: heading(block) }] : []);
  const sections: LessonRoadmapItem[] = starts.map((item, index) => ({
    id: academyBlockAnchor(blocks[item.index], item.index),
    label: item.label,
    requiredIds: blocks.slice(item.index, starts[index + 1]?.index ?? blocks.length)
      .filter((block) => block.id && isAcademyBlockRequiredForCompletion(block)).map((block) => block.id!),
  }));
  return { sections, phases: Object.entries(phaseIndices).map(([phase, index]) => ({
    phase: phase as LessonPhase, id: academyBlockAnchor(blocks[index!], index!), index: index!,
  })) };
}

export function isRoadmapSectionComplete(section: LessonRoadmapItem, completedIds: string[]) {
  return section.requiredIds.length > 0 && section.requiredIds.every((id) => completedIds.includes(id));
}

export type LessonJourneyStep = LessonRoadmapItem & { start: number; end: number };

export function academyLessonJourneySteps(blocks: LessonBlock[], introLabel: string, german = true): LessonJourneyStep[] {
  const { sections, phases } = academyLessonRoadmap(blocks);
  const phaseLabels = german ? { learn: "Lernen", try: "Üben", use: "Anwenden", review: "Rückblick" }
    : { learn: "Learn", try: "Try", use: "Use", review: "Review" };
  const phaseSections = phases.sort((a, b) => a.index - b.index).map((phase, index, ordered) => ({
    id: phase.id, label: phaseLabels[phase.phase],
    requiredIds: blocks.slice(phase.index, ordered[index + 1]?.index ?? blocks.length)
      .filter((block) => block.id && isAcademyBlockRequiredForCompletion(block)).map((block) => block.id!),
  }));
  // Some exam/review lessons have no numbered dividers or multiple phase markers.
  // Their existing block headings still provide real topics for navigation.
  const headingSections = blocks.flatMap((block, index) => "heading" in block && block.heading?.trim()
    ? [{ id: academyBlockAnchor(block, index), label: block.heading, requiredIds: [] as string[] }] : []);
  const entries = sections.length ? sections : phaseSections.length > 1 ? phaseSections : headingSections.length > 1 ? headingSections : [];
  if (!entries.length) return [];
  const starts = entries.map((section) => ({ ...section, start: blocks.findIndex((block, index) => academyBlockAnchor(block, index) === section.id) }));
  if (starts[0].start > 0) starts.unshift({ id: academyBlockAnchor(blocks[0], 0), label: introLabel, start: 0,
    requiredIds: blocks.slice(0, starts[0].start).filter((block) => block.id && isAcademyBlockRequiredForCompletion(block)).map((block) => block.id!) });
  return starts.map((step, index) => ({ ...step, end: starts[index + 1]?.start ?? blocks.length,
    requiredIds: blocks.slice(step.start, starts[index + 1]?.start ?? blocks.length)
      .filter((block) => block.id && isAcademyBlockRequiredForCompletion(block)).map((block) => block.id!),
  }));
}
