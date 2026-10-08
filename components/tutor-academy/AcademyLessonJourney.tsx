"use client";

import { Children, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, List } from "lucide-react";
import type { LessonJourneyStep } from "@/lib/academy-lesson-roadmap";
import { AcademyJourneyContext } from "./AcademyJourneyContext";
import AcademyTopicNavigator from "./AcademyTopicNavigator";
import { celebrateAcademyTopic } from "@/lib/academy-topic-celebration";
import { academyScrollContainer } from "@/lib/academy-scroll-container";

export default function AcademyLessonJourney({ children, roadmap, tracker, resumeAnchor, steps, anchors, completedIds, german, canCompleteLesson, courseOutline, lessonEnd, celebrateTopicChanges = false }: {
  children: ReactNode;
  roadmap: ReactNode;
  tracker?: ReactNode;
  resumeAnchor?: string;
  steps: LessonJourneyStep[];
  anchors: string[];
  completedIds: string[];
  german: boolean;
  canCompleteLesson: boolean;
  courseOutline?: ReactNode;
  lessonEnd?: ReactNode;
  celebrateTopicChanges?: boolean;
}) {
  const [active, setActive] = useState(0);
  // Mount a topic on first use, then keep it mounted to preserve unsaved work.
  const [visited, setVisited] = useState<number[]>([0]);
  const [whole, setWhole] = useState(false);
  const [celebration, setCelebration] = useState("");
  useEffect(() => {
    if (!celebration) return;
    const timer = window.setTimeout(() => setCelebration(""), 1800);
    return () => window.clearTimeout(timer);
  }, [celebration]);
  const [notice, setNotice] = useState("");
  const [scrollRequest, setScrollRequest] = useState<{ anchor?: string; focus: boolean } | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const navigator = useRef<HTMLDivElement>(null);
  const topicStart = useRef<HTMLDivElement>(null);
  const restoredInitialPosition = useRef(false);
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
      if (step >= 0) {
        setActive(step);
        setVisited(current => current.includes(step) ? current : [...current, step]);
      }
      setScrollRequest({ anchor, focus: false });
    };
    // Saving refreshes progress and recreates anchors/steps. Restore the initial
    // bookmark once per lesson, rather than scrolling again on those refreshes.
    // The journey is keyed by lesson; explicit hash navigation still follows links.
    if (!restoredInitialPosition.current) {
      restoredInitialPosition.current = true;
      followHash();
    }
    window.addEventListener("hashchange", followHash);
    return () => window.removeEventListener("hashchange", followHash);
  }, [anchors, steps, resumeAnchor]);
  useEffect(() => {
    if (!whole) return;
    const container = root.current ? academyScrollContainer(root.current) : window;
    const followScroll = () => {
      const visible = steps.flatMap((step, index) => {
        const node = document.getElementById(step.id);
        return node?.getClientRects().length && node.getBoundingClientRect().top <= 260 ? [index] : [];
      });
      if (visible.length) setActive(visible.at(-1)!);
    };
    container.addEventListener("scroll", followScroll, { passive: true });
    return () => container.removeEventListener("scroll", followScroll);
  }, [whole, steps]);
  useLayoutEffect(() => {
    if (!scrollRequest) return;
    // Wait for React to show the destination before measuring it. Focusing the
    // footer (or the hidden preview navigator) can otherwise retain the old scroll.
    const scrollToDestination = () => {
      const target = scrollRequest.anchor ? document.getElementById(scrollRequest.anchor) : topicStart.current;
      target?.scrollIntoView({ block: "start", behavior: "instant" });
      if (scrollRequest.focus) {
        root.current?.querySelector<HTMLElement>('.academy-topic-content:not([hidden])')?.focus({ preventScroll: true });
      }
    };
    scrollToDestination();
    // Repeat once after browser scroll anchoring settles the changed page height.
    const frame = requestAnimationFrame(scrollToDestination);
    return () => cancelAnimationFrame(frame);
  }, [scrollRequest]);
  const move = (index: number, celebrate = false) => {
    if (index < 0 || index >= steps.length || !canNavigate()) return;
    setCelebration(celebrate && celebrateTopicChanges ? steps[index].label : "");
    if (celebrate && celebrateTopicChanges) celebrateAcademyTopic();
    root.current?.querySelectorAll<HTMLMediaElement>("audio, video").forEach((media) => media.pause());
    setActive(index);
    setVisited(current => current.includes(index) ? current : [...current, index]);
    setWhole(false);
    window.history.replaceState(null, "", `#${steps[index].id}`);
    setScrollRequest({ focus: true });
  };
  if (steps.length < 2 && courseOutline) return <div ref={root} data-academy-lesson className="academy-block-stack flex flex-col">
    {tracker}{roadmap}
    <div ref={topicStart} aria-hidden="true" className="h-0 scroll-mt-16" />
    <AcademyTopicNavigator startRef={topicStart} navigatorRef={navigator} label={german ? "Kursübersicht" : "Course outline"} german={german} steps={[]} active={0} completedIds={completedIds} onSelect={() => {}} courseOutline={courseOutline}>{null}</AcademyTopicNavigator>
    <div className="academy-topic-body academy-block-stack flex flex-col">{nodes}</div>{lessonEnd}
  </div>;
  if (steps.length < 2) return <div ref={root} data-academy-lesson className="academy-block-stack flex flex-col">{tracker}{roadmap}{nodes}{lessonEnd}</div>;
  const current = steps[active] || steps[0];
  const saved = current.requiredIds.filter((id) => completedIds.includes(id)).length;
  return <AcademyJourneyContext.Provider value={current.id}><div ref={root} data-academy-lesson className="space-y-6">
    <div role="status" aria-live="polite" aria-atomic="true" className={celebration ? "pointer-events-none fixed left-1/2 top-24 z-50 w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-full border border-[#B8CADA] bg-white px-5 py-3 text-center text-sm font-bold text-[#245444] shadow-lg" : "sr-only"}>
      {celebration ? `🎉 ${german ? "Weiter geht’s!" : "On to the next topic!"} · ${celebration}` : ""}
    </div>
    {tracker}
    {roadmap}
    <div ref={topicStart} aria-hidden="true" className="h-0 scroll-mt-16" />
    <AcademyTopicNavigator startRef={topicStart} navigatorRef={navigator} label={current.label} german={german} steps={steps} active={active} completedIds={completedIds} onSelect={move} courseOutline={courseOutline}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1 basis-48">
          <label htmlFor={selectId} className="block text-xs font-bold text-[#435164]">{german ? "Aktueller Abschnitt" : "Current section"} · {active + 1}/{steps.length}</label>
          <select id={selectId} value={active} onChange={(event) => move(Number(event.target.value))} className="mt-1 min-h-11 w-full rounded-lg border border-[#D5E1EB] bg-white px-2 text-base font-bold text-[#173A63] focus-visible:outline-2 focus-visible:outline-[var(--academy-accent)]">
            {steps.map((step, index) => <option key={step.id} value={index}>{step.label}</option>)}
          </select>
        </div>
        <button type="button" aria-pressed={whole} aria-controls={contentId} onClick={() => {
          if (!canNavigate()) return;
          if (!whole) setVisited(steps.map((_, index) => index));
          setWhole(!whole);
          if (whole) setScrollRequest({ focus: true });
        }} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#B8CADA] px-4 text-sm font-bold text-[#173A63] focus-visible:outline-2 focus-visible:outline-[var(--academy-accent)]">
          <List size={18} aria-hidden="true" />{whole ? german ? "Einzelansicht" : "One topic" : german ? "Ganzes Kapitel" : "Whole chapter"}
        </button>
      </div>
      <p role="status" className="mt-2 text-sm text-[#435164]">{notice || (current.requiredIds.length
        ? `${saved}/${current.requiredIds.length} ${german ? "Pflichtaktivitäten gespeichert" : "required activities saved"}`
        : german ? "Lesen und entdecken · Weiter markiert keine Aktivität als abgeschlossen." : "Read and explore · Next does not mark activities complete.")}</p>
    </AcademyTopicNavigator>
    <div id={contentId} className="academy-topic-body space-y-8">
      {steps.map((step, index) => <div key={step.id} hidden={!whole && active !== index} tabIndex={-1} className="academy-topic-content flex flex-col gap-8 focus:outline-none sm:gap-10">
        {whole || active === index || visited.includes(index) ? nodes.slice(step.start, step.end) : null}
      </div>)}
    </div>
    <nav aria-label={german ? "Unterthemen wechseln" : "Topic navigation"} className="rounded-2xl border border-[#C7D9E9] bg-[#F0F6FC] p-5">
      <p className="mb-4 flex items-center gap-2 text-sm text-[#344B60]">
        {saved > 0 ? <CheckCircle2 size={18} aria-hidden="true" /> : null}
        {!whole && active + 1 < steps.length ? `${german ? "Als Nächstes" : "Next"}: ${steps[active + 1].label}` : lessonEnd
          ? german ? "Letzter Abschnitt · Weiter zum nächsten Kapitel nach dem Speichern der Pflichtaktivitäten." : "Last section · Save required activities to move to the next chapter."
          : canCompleteLesson
          ? german ? "Letzter Abschnitt. Zum Abschließen nutzen Sie die Kapitel-Schaltfläche unten." : "Last section. Use the lesson completion button below to finish."
          : german ? "Letzter Abschnitt · In der Vorschau wird kein Lernfortschritt gespeichert." : "Last section · Preview does not save learner progress."}
      </p>
      <div className="grid grid-cols-2 gap-3 sm:flex sm:justify-between">
        <button type="button" disabled={active === 0} onClick={() => move(active - 1)} className="inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-full border border-[#B8CADA] bg-white px-3 text-sm font-bold text-[#173A63] disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-[var(--academy-accent)] sm:px-5"><ArrowLeft className="shrink-0" size={18} aria-hidden="true" />{german ? "Zurück" : "Previous"}</button>
        {lessonEnd && (whole || active + 1 >= steps.length) ? <div className="min-w-0 sm:max-w-sm">{lessonEnd}</div> : <button type="button" data-academy-action="primary" aria-label={german ? "Nächstes Unterthema" : "Next topic"} disabled={active + 1 >= steps.length} onClick={() => move(active + 1, true)} className="inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-full bg-[var(--academy-accent)] px-3 text-sm font-bold text-white disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--academy-accent)] sm:px-5"><span className="sm:hidden">{german ? "Nächstes" : "Next"}</span><span className="hidden sm:inline">{german ? "Nächstes Unterthema" : "Next topic"}</span><ArrowRight className="shrink-0" size={18} aria-hidden="true" /></button>}
      </div>
    </nav>
  </div></AcademyJourneyContext.Provider>;
}
