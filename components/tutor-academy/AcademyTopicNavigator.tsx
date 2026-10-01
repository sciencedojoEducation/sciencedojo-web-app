"use client";

import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { CheckCircle2, List, Menu, X } from "lucide-react";
import type { LessonJourneyStep } from "@/lib/academy-lesson-roadmap";
import { shouldCollapseAcademyTopicNavigator } from "@/lib/academy-topic-navigation";
import { academyScrollContainer, academyScrollOffset } from "@/lib/academy-scroll-container";

/** Topic controls are available from the start, not only after scrolling. */
export default function AcademyTopicNavigator({ children, startRef, navigatorRef, label, german, steps, active, completedIds, onSelect, courseOutline }: {
  children: ReactNode;
  startRef: RefObject<HTMLDivElement | null>;
  navigatorRef: RefObject<HTMLDivElement | null>;
  label: string;
  german: boolean;
  steps: LessonJourneyStep[];
  active: number;
  completedIds: string[];
  onSelect: (index: number) => void;
  courseOutline?: ReactNode;
}) {
  const docked = true;
  const [open, setOpen] = useState(false);
  const shell = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const openedAt = useRef(0);
  const scrollContainer = useRef<HTMLElement | Window | null>(null);
  const panelId = useId();
  const close = (restoreFocus = false) => {
    if (restoreFocus || navigatorRef.current?.contains(document.activeElement)) toggle.current?.focus({ preventScroll: true });
    setOpen(false);
  };

  useEffect(() => {
    const container = startRef.current ? academyScrollContainer(startRef.current) : window;
    scrollContainer.current = container;
    const update = () => {
      const start = startRef.current;
      const lesson = start?.closest("[data-academy-lesson]");
      const left = container === window ? 0 : (container as HTMLElement).getBoundingClientRect().left;
      shell.current?.style.setProperty("--academy-topic-dock-left", `${left + 16}px`);
      if (!lesson || shouldCollapseAcademyTopicNavigator(true, academyScrollOffset(container), openedAt.current)) {
        if (navigatorRef.current?.contains(document.activeElement)) toggle.current?.focus({ preventScroll: true });
        setOpen(false);
      }
    };
    update();
    container.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { container.removeEventListener("scroll", update); window.removeEventListener("resize", update); scrollContainer.current = null; };
  }, [navigatorRef, startRef]);

  useEffect(() => {
    if (!docked || !open) return;
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !shell.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [docked, open]);

  useEffect(() => {
    const lesson = startRef.current?.closest<HTMLElement>("[data-academy-lesson]");
    if (lesson) lesson.dataset.topicMenuOpen = String(docked && open);
    return () => { if (lesson) delete lesson.dataset.topicMenuOpen; };
  }, [docked, open, startRef]);

  return <div className="academy-topic-nav-slot">
    <div ref={shell} className="academy-topic-nav" data-docked={docked} data-open={open} data-course-outline={!!courseOutline} onKeyDown={(event) => {
      if (event.key === "Escape" && docked && open) { event.stopPropagation(); close(true); }
    }}>
      {docked ? <button ref={toggle} type="button" className="academy-topic-nav-toggle" aria-expanded={open} aria-controls={panelId}
        aria-label={courseOutline ? open ? german ? "Kursübersicht schließen" : "Close course outline" : german ? "Kursübersicht öffnen" : "Open course outline" : open ? german ? "Themenmenü schließen" : "Close topic menu" : `${german ? "Themenmenü öffnen" : "Open topic menu"}: ${label}`}
        title={label} onClick={() => {
          if (open) close(true);
          else { openedAt.current = academyScrollOffset(scrollContainer.current || window); setOpen(true); }
        }}>
        {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
      </button> : null}
      <div className="academy-topic-nav-body" inert={docked && !open} aria-hidden={docked && !open}>
        <div className="academy-topic-nav-clip">
          <div ref={navigatorRef} id={panelId} tabIndex={-1} className="academy-topic-nav-panel rounded-2xl border border-[#C7D9E9] bg-white/95 p-3 shadow-sm backdrop-blur-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--academy-accent)] sm:p-4">
            {courseOutline || children}
            {!courseOutline && docked ? <nav className="mt-5 border-t border-[#D5E1EB] pt-2" aria-label={german ? "Abschnittsübersicht" : "Topic outline"}>
              {steps.map((step, index) => {
                const complete = step.requiredIds.length > 0 && step.requiredIds.every((id) => completedIds.includes(id));
                return <button key={step.id} type="button" aria-current={index === active ? "step" : undefined}
                  onClick={() => { onSelect(index); close(true); }}
                  className={`flex min-h-12 w-full items-start gap-3 border-b border-[#E1E7ED] px-3 py-3 text-left text-sm leading-6 focus-visible:outline-2 focus-visible:outline-[var(--academy-accent)] ${index === active ? "border-l-4 border-l-[var(--academy-accent)] bg-[#EAF3FB] font-bold text-[#173A63]" : "text-[#344B60] hover:bg-[#F2F7FC]"}`}>
                  {complete ? <CheckCircle2 size={16} className="mt-1 shrink-0 text-emerald-700" aria-label={german ? "Gespeichert" : "Saved"} /> : <List size={16} className="mt-1 shrink-0" aria-hidden="true" />}
                  {step.label}
                </button>;
              })}
            </nav> : null}
          </div>
        </div>
      </div>
    </div>
  </div>;
}
