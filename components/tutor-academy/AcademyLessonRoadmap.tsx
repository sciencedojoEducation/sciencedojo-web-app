"use client";

import { useContext, useEffect, useState } from "react";
import Image from "next/image";
import { BookOpen, Check, Flag, MessageCircle, PencilLine } from "lucide-react";
import { isRoadmapSectionComplete } from "@/lib/academy-lesson-roadmap";
import type { LessonPhase, LessonRoadmapItem } from "@/lib/academy-lesson-roadmap";
import { AcademyJourneyContext } from "./AcademyJourneyContext";

export const phaseDesign = {
  learn: { de: "Lernen", en: "Learn", icon: BookOpen, className: "border-[#C7D9E9] bg-[#EDF4FC] text-[#173A63]" },
  try: { de: "Üben", en: "Try", icon: PencilLine, className: "border-[#E7D6A4] bg-[#FFF8E3] text-[#59451F]" },
  use: { de: "Anwenden", en: "Use", icon: MessageCircle, className: "border-[#BFDCD0] bg-[#EAF6EF] text-[#245444]" },
  review: { de: "Rückblick", en: "Review", icon: Flag, className: "border-[#D5CBEB] bg-[#F2EEFA] text-[#4E3B73]" },
};

export function AcademyPhaseMarker({ phase, german }: { phase: LessonPhase; german: boolean }) {
  const design = phaseDesign[phase];
  const Icon = design.icon;
  return <div className={`academy-phase-marker mb-6 flex min-h-28 items-center justify-between gap-4 rounded-2xl border px-4 py-3 sm:px-6 ${design.className}`}>
    <div className="flex min-w-0 items-center gap-3">
      <Icon size={22} className="shrink-0" aria-hidden="true" />
      <span className="text-lg font-bold sm:text-xl">{german ? design.de : design.en}</span>
    </div>
    <Image src={`/images/academy/journey/${phase}-v1.webp`} alt="" aria-hidden="true"
      width={120} height={112} sizes="(max-width: 639px) 96px, 120px"
      className="h-24 w-24 shrink-0 object-contain sm:h-28 sm:w-30" />
  </div>;
}

export default function AcademyLessonRoadmap({ sections, phases, german, completedIds = [] }: {
  sections: LessonRoadmapItem[];
  phases: { phase: LessonPhase; id: string }[];
  german: boolean;
  completedIds?: string[];
}) {
  const [scrollCurrent, setCurrent] = useState("");
  const journeyCurrent = useContext(AcademyJourneyContext);
  const current = journeyCurrent ?? scrollCurrent;
  useEffect(() => {
    const targets = (sections.length ? sections : phases).map((item) => document.getElementById(item.id)).filter((node): node is HTMLElement => !!node);
    const update = () => {
      const visible = targets.filter((node) => node.getClientRects().length && node.getBoundingClientRect().top <= 240);
      setCurrent(visible.at(-1)?.id || "");
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [sections, phases]);
  if (!phases.length && !sections.length) return null;
  return <nav aria-label={german ? "Ihr Weg durch dieses Kapitel" : "Your path through this lesson"}
    className="academy-lesson-roadmap rounded-3xl border border-[#C7D9E9] bg-linear-to-br from-[#F0F6FC] to-[#F6FAF8] p-5 shadow-[0_6px_24px_rgba(23,58,99,0.05)] sm:p-7">
    <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="text-xl font-bold text-[#173A63]">{german ? "Ihr Lernweg" : "Your learning journey"}</h2>
      <span className="text-sm text-[#435164]">{german ? "Direkt zum Abschnitt springen" : "Jump to a section"}</span>
    </div>
    <ol className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {phases.map(({ phase, id }) => {
        const design = phaseDesign[phase]; const Icon = design.icon;
        return <li key={phase}><a href={`#${id}`} className={`flex min-h-16 flex-col items-start gap-2 rounded-2xl border px-4 py-3 font-bold transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--academy-accent)] motion-reduce:transition-none sm:flex-row sm:items-center sm:gap-3 ${design.className}`}>
          <Icon size={23} className="shrink-0" aria-hidden="true" /><span>{german ? design.de : design.en}</span>
        </a></li>;
      })}
    </ol>
    {sections.length ? <details open={sections.length <= 4} className="mt-5 border-t border-[#D5E1EB] pt-4">
      <summary className="cursor-pointer text-sm font-bold text-[#344B60]">{german ? "Alle Unterthemen" : "All topics"} · {sections.length}</summary>
      <ol className="mt-4 grid gap-2 sm:grid-cols-2">
        {sections.map((section, index) => {
          const complete = isRoadmapSectionComplete(section, completedIds);
          return <li key={section.id}><a href={`#${section.id}`} aria-current={current === section.id ? "location" : undefined}
            className={`flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--academy-accent)] ${current === section.id ? "border-[#AFC8E7] bg-white text-[#173A63] shadow-sm" : "border-transparent text-[#344B60] hover:bg-white"}`}>
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${complete ? "bg-[#D6EEDF] text-[#245444]" : "bg-[#E1EBF5] text-[#173A63]"}`} aria-hidden="true">{complete ? <Check size={15} /> : index + 1}</span>
            <span>{section.label}{complete ? <span className="sr-only"> · {german ? "Pflichtaufgaben gespeichert" : "Required activities saved"}</span> : null}</span>
          </a></li>;
        })}
      </ol>
    </details> : null}
  </nav>;
}
