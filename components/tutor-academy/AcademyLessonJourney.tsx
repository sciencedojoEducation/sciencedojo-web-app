"use client";

import { Children, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, List } from "lucide-react";
import type { LessonJourneyStep } from "@/lib/academy-lesson-roadmap";
import { AcademyJourneyContext } from "./AcademyJourneyContext";

export default function AcademyLessonJourney({ children, roadmap, tracker, resumeAnchor, steps, anchors, completedIds, german, canCompleteLesson }: {
  children: ReactNode;
  roadmap: ReactNode;
  tracker?: ReactNode;
  resumeAnchor?: string;
  steps: LessonJourneyStep[];
  anchors: string[];
  completedIds: string[];
  german: boolean;
  canCompleteLesson: boolean;
}) {
  const [active, setActive] = useState(0);
  const [whole, setWhole] = useState(false);
  const [notice, setNotice] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const navigator = useRef<HTMLDivElement>(null);
  const topicStart = useRef<HTMLDivElement>(null);
  const selectId = useId();
  const contentId = useId();
  const nodes = Children.toArray(children);
  const canNavigate = () => {
    if (!root.current?.querySelector('[data-academy-recording="true"]')) { setNotice(""); return true; }
    setNotice(german ? "Bitte stoppen Sie zuerst die laufende Aufnahme." : "Please stop the recording before changing topics.");
    return false;
  };
  useEffect(() => {
    const followHash = () => {
      let anchor = "";
      try { anchor = decodeURIComponent(window.location.hash.slice(1)) || resumeAnchor || ""; } catch { return; }
      const index = anchors.indexOf(anchor);
      const step = steps.findIndex((item) => index >= item.start && index < item.end);
      if (index < 0) return;
      if (root.current?.querySelector('[data-academy-recording="true"]')) return;
      if (step >= 0) setActive(step);
      requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView({ block: "start" }));
    };
    followHash();
    window.addEventListener("hashchange", followHash);
    return () => window.removeEventListener("hashchange", followHash);
  }, [anchors, steps, resumeAnchor]);
  useEffect(() => {
    if (!whole) return;
    const followScroll = () => {
      const visible = steps.flatMap((step, index) => {
        const node = document.getElementById(step.id);
        return node?.getClientRects().length && node.getBoundingClientRect().top <= 260 ? [index] : [];
      });
      if (visible.length) setActive(visible.at(-1)!);
    };
    window.addEventListener("scroll", followScroll, { passive: true });
    return () => window.removeEventListener("scroll", followScroll);
  }, [whole, steps]);
  const move = (index: number) => {
    if (!canNavigate()) return;
    root.current?.querySelectorAll<HTMLMediaElement>("audio, video").forEach((media) => media.pause());
    setActive(index);
    setWhole(false);
    window.history.replaceState(null, "", `#${steps[index].id}`);
    requestAnimationFrame(() => {
      topicStart.current?.scrollIntoView({ block: "start", behavior: "instant" });
      navigator.current?.focus({ preventScroll: true });
    });
  };
  if (steps.length < 2) return <div ref={root} data-academy-lesson className="academy-block-stack flex flex-col">{tracker}{roadmap}{nodes}</div>;
  const current = steps[active] || steps[0];
  const saved = current.requiredIds.filter((id) => completedIds.includes(id)).length;
  return <AcademyJourneyContext.Provider value={current.id}><div ref={root} data-academy-lesson className="space-y-6">
    {tracker}
    {roadmap}
    <div ref={topicStart} aria-hidden="true" className="h-0 scroll-mt-16" />
    <div ref={navigator} tabIndex={-1} className="sticky top-16 z-20 scroll-mt-20 rounded-2xl border border-[#C7D9E9] bg-white/95 p-3 shadow-sm backdrop-blur-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--academy-accent)] sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1 basis-48">
          <label htmlFor={selectId} className="block text-xs font-bold text-[#435164]">{german ? "Aktueller Abschnitt" : "Current section"} · {active + 1}/{steps.length}</label>
          <select id={selectId} value={active} onChange={(event) => move(Number(event.target.value))} className="mt-1 min-h-11 w-full rounded-lg border border-[#D5E1EB] bg-white px-2 text-base font-bold text-[#173A63] focus-visible:outline-2 focus-visible:outline-[var(--academy-accent)]">
            {steps.map((step, index) => <option key={step.id} value={index}>{step.label}</option>)}
          </select>
        </div>
        <button type="button" aria-pressed={whole} aria-controls={contentId} onClick={() => {
          if (!canNavigate()) return;
          setWhole(!whole);
          if (whole) requestAnimationFrame(() => topicStart.current?.scrollIntoView({ block: "start", behavior: "instant" }));
        }} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#B8CADA] px-4 text-sm font-bold text-[#173A63] focus-visible:outline-2 focus-visible:outline-[var(--academy-accent)]">
          <List size={18} aria-hidden="true" />{whole ? german ? "Einzelansicht" : "One topic" : german ? "Ganzes Kapitel" : "Whole chapter"}
        </button>
      </div>
      <p role="status" className="mt-2 text-sm text-[#435164]">{notice || (current.requiredIds.length
        ? `${saved}/${current.requiredIds.length} ${german ? "Pflichtaktivitäten gespeichert" : "required activities saved"}`
        : german ? "Lesen und entdecken · Weiter markiert keine Aktivität als abgeschlossen." : "Read and explore · Next does not mark activities complete.")}</p>
    </div>
    <div id={contentId} className="space-y-8">
      {steps.map((step, index) => <div key={step.id} hidden={!whole && active !== index} className="academy-topic-content flex flex-col gap-8 sm:gap-10">
        {nodes.slice(step.start, step.end)}
      </div>)}
    </div>
    <nav aria-label={german ? "Unterthemen wechseln" : "Topic navigation"} className="rounded-2xl border border-[#C7D9E9] bg-[#F0F6FC] p-5">
      <p className="mb-4 flex items-center gap-2 text-sm text-[#344B60]">
        {saved > 0 ? <CheckCircle2 size={18} aria-hidden="true" /> : null}
        {active + 1 < steps.length ? `${german ? "Als Nächstes" : "Next"}: ${steps[active + 1].label}` : canCompleteLesson
          ? german ? "Letzter Abschnitt. Zum Abschließen nutzen Sie die Kapitel-Schaltfläche unten." : "Last section. Use the lesson completion button below to finish."
          : german ? "Letzter Abschnitt · In der Vorschau wird kein Lernfortschritt gespeichert." : "Last section · Preview does not save learner progress."}
      </p>
      <div className="flex flex-wrap justify-between gap-3">
        <button type="button" disabled={active === 0} onClick={() => move(active - 1)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#B8CADA] bg-white px-5 text-sm font-bold text-[#173A63] disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-[var(--academy-accent)]"><ArrowLeft size={18} aria-hidden="true" />{german ? "Zurück" : "Previous"}</button>
        <button type="button" disabled={active + 1 >= steps.length} onClick={() => move(active + 1)} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--academy-accent)] px-5 text-sm font-bold text-white disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--academy-accent)]">{german ? "Nächstes Unterthema" : "Next topic"}<ArrowRight size={18} aria-hidden="true" /></button>
      </div>
    </nav>
  </div></AcademyJourneyContext.Provider>;
}
