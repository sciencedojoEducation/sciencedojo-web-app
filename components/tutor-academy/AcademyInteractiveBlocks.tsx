"use client";

import { isNicosWegCourse } from "@/lib/nicos-weg-course";
import AcademyGermanText from "./AcademyGermanText";
import { playAnswerSound } from "@/lib/academy-answer-sounds";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { animateAcademyPanel, observeAcademyDisclosure } from "@/lib/academy-interaction-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleHelp,
  Play,
  RotateCcw,
} from "lucide-react";
import type { QuizQuestion } from "@/lib/tutor-academy";
import { germanA1VocabularyImage } from "@/lib/german-a1-vocabulary-image";
import { nicosWegA1QuestionExplanation, resolveNicosWegA1Feedback } from "@/lib/nicos-weg-a1-feedback";
import { getNicosChoiceCheck } from "@/lib/nicos-weg-a1-answer-bank";
import { AcademyBilingualRule } from "./AcademyInstantAnswerCheck";
import { recordAcademyBlockCompletion } from "@/app/dashboard/tutor/academy/actions";

type Item = { id?: string; title: string; body: string };
type FlashcardItem = Item & {
  emoji?: string;
  eyebrow?: string;
  src?: string;
  alt?: string;
  sprite?: {
    row: number;
    column: number;
    rows: number;
    columns: number;
  };
};
type Tracking = {
  genderCues?: boolean;
  courseKey?: string;
  blockId?: string;
  completion?: "view" | "interact" | "pass";
  uiLanguage?: "de" | "en";
};

function FlashcardVisual({ item }: { item: FlashcardItem }) {
  if (!item.src) return null;
  const illustration = item.sprite ? null : germanA1VocabularyImage(item.src);
  if (illustration) {
    return (
      <span className="relative mx-auto flex aspect-square w-44 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#D8E2EA] bg-[#EAF1F7]">
        <span
          className="relative block overflow-hidden"
          style={{
            width: `${Math.min(1, illustration.width / illustration.height) * 100}%`,
            aspectRatio: `${illustration.width} / ${illustration.height}`,
          }}
        >
          <Image
            src={illustration.src}
            alt={item.alt || ""}
            width={illustration.sheetWidth}
            height={illustration.sheetHeight}
            unoptimized
            className="absolute block max-w-none"
            style={{
              width: `${(illustration.sheetWidth / illustration.width) * 100}%`,
              height: `${(illustration.sheetHeight / illustration.height) * 100}%`,
              left: `${(-illustration.left / illustration.width) * 100}%`,
              top: `${(-illustration.top / illustration.height) * 100}%`,
            }}
          />
        </span>
      </span>
    );
  }
  return (
    <span
      className="relative mx-auto block aspect-square w-44 shrink-0 overflow-hidden rounded-2xl border border-[#D8E2EA] bg-[#EAF1F7]"
      role={item.sprite ? "img" : undefined}
      aria-label={item.sprite ? item.alt || undefined : undefined}
    >
      {item.sprite ? (
        <span
          className="absolute inset-0 block bg-cover bg-no-repeat transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
          style={{
            backgroundImage: `url(${JSON.stringify(item.src)})`,
            backgroundSize: `${item.sprite.columns * 100}% ${item.sprite.rows * 100}%`,
            backgroundPosition: `${item.sprite.columns === 1 ? 0 : (item.sprite.column / (item.sprite.columns - 1)) * 100}% ${item.sprite.rows === 1 ? 0 : (item.sprite.row / (item.sprite.rows - 1)) * 100}%`,
          }}
        />
      ) : (
        <Image
          src={item.src}
          alt={item.alt || ""}
          fill
          sizes="176px"
          className="object-contain transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
        />
      )}
    </span>
  );
}

function record({ courseKey, blockId, completion }: Tracking) {
  if (
    (completion === "interact" || completion === "pass") &&
    courseKey &&
    blockId
  )
    void recordAcademyBlockCompletion(courseKey, blockId);
}

export function AcademyTabs({
  items,
  ...tracking
}: { items: Item[] } & Tracking) {
  const [active, setActive] = useState(0);
  const baseId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const previous = useRef(active);
  useLayoutEffect(() => {
    const direction = Math.sign(active - previous.current);
    previous.current = active;
    if (direction && panel.current) return animateAcademyPanel(panel.current, direction);
  }, [active]);
  const selectTab = (index: number) => { setActive(index); record(tracking); };
  return (
    <div className="academy-tabs overflow-hidden rounded-2xl border border-[#C7D9E9] bg-white shadow-[0_4px_18px_rgba(23,58,99,0.05)]">
      <div
        role="tablist"
        aria-label={tracking.uiLanguage === "de" ? "Inhaltsbereiche" : "Content tabs"}
        className="flex gap-2 overflow-x-auto border-b border-[#D8E5F0] bg-linear-to-r from-[#EAF3FB] to-[#F2F7FC] p-3 sm:p-4"
      >
        {items.map((item, index) => (
          <button
            key={item.id || item.title}
            id={`${baseId}-tab-${index}`}
            role="tab"
            aria-selected={active === index}
            aria-controls={`${baseId}-panel-${index}`}
            tabIndex={active === index ? 0 : -1}
            onClick={() => selectTab(index)}
            onKeyDown={(event) => {
              const next = event.key === "ArrowRight" ? (index + 1) % items.length
                : event.key === "ArrowLeft" ? (index + items.length - 1) % items.length
                : event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : null;
              if (next === null) return;
              event.preventDefault();
              selectTab(next);
              document.getElementById(`${baseId}-tab-${next}`)?.focus({ preventScroll: true });
            }}
            className={`min-h-12 shrink-0 rounded-xl border px-5 text-base font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--academy-accent)] focus-visible:ring-offset-2 motion-reduce:transition-none ${active === index ? "border-[var(--academy-accent)] bg-[var(--academy-accent)] text-white shadow-sm" : "border-transparent text-[#344B60] hover:border-[#C7D9E9] hover:bg-white"}`}
          >
            {item.title}
          </button>
        ))}
      </div>
      <div className="grid">
        {items.map((item, index) => (
          <div
            key={item.id || index}
            ref={active === index ? panel : undefined}
            id={`${baseId}-panel-${index}`}
            role="tabpanel"
            tabIndex={active === index ? 0 : -1}
            aria-hidden={active !== index}
            inert={active !== index}
            aria-labelledby={`${baseId}-tab-${index}`}
            className={`academy-reading-copy min-h-28 col-start-1 row-start-1 p-6 font-[family-name:var(--font-academy-body)] text-[17px] leading-8 text-[#27313B] sm:p-8 ${active !== index ? "invisible" : ""}`}
          >
            <AcademyGermanText text={item.body} enabled={tracking.genderCues || isNicosWegCourse(tracking.courseKey)} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AcademyAccordion({
  items,
  initiallyOpen = true,
  ...tracking
}: { items: Item[]; initiallyOpen?: boolean } & Tracking) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const cleanups = Array.from(container.current?.querySelectorAll("details") || []).map(observeAcademyDisclosure);
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [items]);
  return (
    <div ref={container} className="academy-accordion space-y-3">
      {items.map((item, index) => (
        <details
          key={item.id || item.title}
          className="group overflow-hidden rounded-2xl border border-[#D5E1EB] bg-white shadow-[0_2px_10px_rgba(23,58,99,0.03)] open:border-[#AFC8E7] open:bg-[#F2F7FC]"
          open={initiallyOpen && index === 0}
          onToggle={(event) => {
            if (event.currentTarget.open) record(tracking);
          }}
        >
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-base font-bold text-[#252629] outline-none hover:bg-[#F2F7FC] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--academy-accent)] sm:px-6">
            <span className="flex items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E4EEF8] text-sm text-[#173A63]" aria-hidden="true">{index + 1}</span><AcademyGermanText text={item.title} enabled={tracking.genderCues || isNicosWegCourse(tracking.courseKey)} /></span>
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E4EEF8] text-xl text-[#173A63] transition-transform group-open:rotate-45 motion-reduce:transition-none"
              aria-hidden="true"
            >
              +
            </span>
          </summary>
          <p className="academy-reading-copy whitespace-pre-line px-5 pb-6 font-[family-name:var(--font-academy-body)] text-[17px] leading-8 text-[#27313B] sm:px-6">
            <AcademyGermanText text={item.body} enabled={tracking.genderCues || isNicosWegCourse(tracking.courseKey)} />
          </p>
        </details>
      ))}
    </div>
  );
}

export function AcademyFlashcards({
  items,
  variant = "flip-grid",
  genderCues,
  ...tracking
}: {
  items: FlashcardItem[];
  genderCues?: boolean;
  variant?: "flip-grid" | "stack" | "picture-grid";
} & Tracking) {
  const showGender = genderCues ?? isNicosWegCourse(tracking.courseKey);
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  return (
    <div
      className={`academy-flashcards grid gap-5 ${variant === "stack" ? "mx-auto max-w-2xl grid-cols-1" : "sm:grid-cols-2"}`}
      data-card-layout={variant}
    >
      {items.map((item, index) => {
        if (variant === "picture-grid")
          return (
            <article
              key={item.id || item.title}
              className="group border border-[#DEDFE1] bg-white p-5 text-center shadow-[0_10px_30px_rgba(20,35,60,0.08)]"
            >
              <FlashcardVisual item={item} />
              {item.emoji ? <span aria-hidden="true" className="mt-3 block text-4xl">{item.emoji}</span> : null}
              <h3 className="mt-4 text-xl font-black text-[#252629]">
                <AcademyGermanText text={item.title} enabled={showGender} genderHint={item.title === "der" || item.title === "die" || item.title === "das" ? item.title : undefined} />
              </h3>
            </article>
          );
        const open = flipped.has(index);
        return (
          <button
            key={item.id || item.title}
            type="button"
            aria-pressed={open}
            onClick={() => {
              setFlipped((current) => {
                const next = new Set(current);
                if (next.has(index)) next.delete(index);
                else next.add(index);
                return next;
              });
              record(tracking);
            }}
            className="academy-flashcard group relative min-h-80 touch-manipulation [perspective:1000px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--academy-accent)] focus-visible:ring-offset-4"
            style={{ WebkitPerspective: "1000px" }}
          >
            <span
              className="academy-flashcard-rotor relative grid [min-height:inherit] transition-transform duration-500 [transform-style:preserve-3d] motion-reduce:transition-none"
              style={{
                WebkitTransformStyle: "preserve-3d",
                transform: `rotateY(${open ? 180 : 0}deg)`,
              }}
            >
              <span data-academy-card-face="front" style={{ WebkitBackfaceVisibility: "hidden", transform: "rotateY(0deg) translateZ(1px)" }} className="col-start-1 row-start-1 flex min-w-0 flex-col overflow-hidden border border-[#DEDFE1] bg-white text-left shadow-[0_10px_30px_rgba(20,35,60,0.08)] [backface-visibility:hidden]">
                {item.src ? (
                  <span className="mt-5 block">
                    <FlashcardVisual item={item} />
                  </span>
                ) : null}
                <span className="flex min-h-28 flex-1 flex-col justify-between gap-3 p-5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--academy-accent)]">
                    {item.eyebrow || (tracking.uiLanguage === "de" ? "Erst überlegen, dann aufdecken" : "Think first, then reveal")}
                  </span>
                  <span className="flex items-center gap-4 text-2xl font-black text-[#252629]">
                    {item.emoji ? <span aria-hidden="true" className="shrink-0 text-4xl leading-none">{item.emoji}</span> : null}
                    <span><AcademyGermanText text={item.title} enabled={showGender} genderHint={item.title === "der" || item.title === "die" || item.title === "das" ? item.title : undefined} /></span>
                  </span>
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-[#717376]">
                    <RotateCcw size={14} /> Karte umdrehen
                  </span>
                </span>
              </span>
              <span data-academy-card-face="back" style={{ WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg) translateZ(1px)" }} className="col-start-1 row-start-1 flex min-w-0 flex-col justify-between gap-4 border border-[var(--academy-accent)] bg-[var(--academy-accent-ink)] p-6 text-left text-white [--academy-gender-der:#93c5fd] [--academy-gender-die:#fca5a5] [--academy-gender-das:#86efac] shadow-[0_10px_30px_rgba(20,35,60,0.14)] [backface-visibility:hidden]">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/65">
                  Laut sprechen
                </span>
                <span className="whitespace-pre-line break-words font-[family-name:var(--font-academy-body)] text-xl font-semibold leading-8 sm:text-2xl sm:leading-9">
                  <AcademyGermanText text={item.body} enabled={showGender} />
                </span>
                <span className="inline-flex items-center gap-2 text-xs font-bold text-white/70">
                  <RotateCcw size={14} /> Vorderseite zeigen
                </span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function AcademyProcess({
  items,
  heading,
  ...tracking
}: { items: Item[]; heading?: string } & Tracking) {
  const [step, setStep] = useState(0);
  const german = tracking.uiLanguage === "de";
  const total = items.length + 1;
  const goTo = (next: number) => {
    setStep(Math.max(0, Math.min(next, total - 1)));
    if (next > 0) record(tracking);
  };
  return (
    <div className="academy-process overflow-hidden border border-[#DEDFE1] bg-[#F6F7F8]">
      <div
        className="flex transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={{ transform: `translateX(-${step * 100}%)` }}
      >
        <div inert={step !== 0} aria-hidden={step !== 0} className="flex min-h-72 w-full shrink-0 flex-col items-center justify-center bg-white p-8 text-center sm:p-12">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--academy-accent)]">
            {german ? "Lernschritte" : "Guided process"}
          </p>
          <h3 className="mt-3 text-2xl font-black text-[#252629]">
            {heading || (german ? "Diese Schritte entdecken" : "Explore this process")}
          </h3>
          <p className="academy-reading-copy mt-3 max-w-lg font-[family-name:var(--font-academy-body)] text-[16px] leading-8 text-[#27313B]">
            {german ? "Gehen Sie die Schritte in Ihrem Tempo durch." : "Move through each step at your own pace."}
          </p>
          <button
            type="button"
            onClick={() => goTo(1)}
            className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--academy-accent)] px-7 text-xs font-bold uppercase tracking-[0.1em] text-white"
          >
            {german ? "Starten" : "Start"} <Play size={14} fill="currentColor" />
          </button>
        </div>
        {items.map((item, index) => (
          <div
            key={item.id || index}
            inert={step !== index + 1}
            aria-hidden={step !== index + 1}
            className="flex min-h-72 w-full shrink-0 flex-col justify-center bg-white p-8 sm:p-12"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--academy-accent)]">
              {german ? `Schritt ${index + 1} von ${items.length}` : `Step ${index + 1} of ${items.length}`}
            </p>
            <h3 className="mt-3 text-2xl font-black text-[#252629]">
              {item.title}
            </h3>
            <p className="academy-reading-copy mt-4 max-w-2xl font-[family-name:var(--font-academy-body)] text-[17px] leading-8 text-[#27313B]">
              <AcademyGermanText text={item.body} enabled={tracking.genderCues || isNicosWegCourse(tracking.courseKey)} />
            </p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-[#DEDFE1] bg-white px-4 py-3">
        <button
          type="button"
          onClick={() => goTo(step - 1)}
          disabled={step === 0}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#DEDFE1] disabled:opacity-25"
          aria-label={german ? "Vorheriger Schritt" : "Previous process step"}
        >
          <ArrowLeft size={18} />
        </button>
        <div className="academy-process-pagination flex min-w-0 flex-1 flex-wrap justify-center gap-1" aria-label={german ? `Position ${step + 1} von ${total}` : `Process position ${step + 1} of ${total}`}>
          {Array.from({ length: total }, (_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goTo(index)}
              aria-label={index === 0
                ? german ? "Einführung" : "Process introduction"
                : german ? `Schritt ${index}` : `Process step ${index}`}
              aria-current={step === index ? "step" : undefined}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-[var(--academy-accent)]"
            ><span aria-hidden="true" className={`h-2.5 rounded-full transition-all motion-reduce:transition-none ${step === index ? "w-7 bg-[var(--academy-accent)]" : "w-2.5 bg-[#CED1D5]"}`} /></button>
          ))}
        </div>
        <span className="academy-process-count hidden text-sm font-semibold text-[#435164]" aria-live="polite">{step + 1} / {total}</span>
        <button
          type="button"
          onClick={() => goTo(step + 1)}
          disabled={step === total - 1}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#171719] text-white disabled:bg-emerald-600"
          aria-label={step === total - 1
            ? german ? "Schritte abgeschlossen" : "Process complete"
            : german ? "Nächster Schritt" : "Next process step"}
        >
          {step === total - 1 ? <Check size={18} /> : <ArrowRight size={18} />}
        </button>
      </div>
    </div>
  );
}

export function AcademyProcessBuildUp({
  items,
  heading,
  ...tracking
}: { items: Item[]; heading?: string } & Tracking) {
  const german = tracking.uiLanguage === "de";
  const [revealedCount, setRevealedCount] = useState(1);
  const [finished, setFinished] = useState(false);
  const focusNewStep = useRef(false);
  const newestHeading = useRef<HTMLHeadingElement>(null);
  const listId = useId();
  const visibleCount = Math.min(revealedCount, items.length);

  useEffect(() => {
    if (!focusNewStep.current) return;
    focusNewStep.current = false;
    const target = newestHeading.current;
    if (!target) return;
    target.focus({ preventScroll: true });
    target.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "nearest",
    });
  }, [visibleCount]);

  const revealNext = () => {
    if (visibleCount < items.length) {
      focusNewStep.current = true;
      setRevealedCount(visibleCount + 1);
      if (visibleCount + 1 === items.length && !finished) {
        setFinished(true);
        record(tracking);
      }
    } else if (items.length === 1 && !finished) {
      setFinished(true);
      record(tracking);
    }
  };

  return (
    <section className="border border-[#DEDFE1] bg-white p-5 sm:p-8" aria-label={heading || (german ? "Schritt-für-Schritt-Anleitung" : "Step-by-step process")}>
      {heading ? (
        <h3 className="text-2xl font-bold leading-tight text-[#252629]">{heading}</h3>
      ) : null}
      <p className="mt-2 text-sm text-[#62666C]">
        {german ? "Gehen Sie der Reihe nach vor. Jeder neue Schritt bleibt sichtbar." : "Follow the steps in order. Each new step stays visible for reference."}
      </p>
      <ol id={listId} className="mt-6 space-y-3">
        {items.slice(0, visibleCount).map((item, index) => (
          <li key={item.id || index} className="flex gap-3 rounded-2xl bg-[#F5F6FA] p-4 sm:gap-4 sm:p-5">
            <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--academy-accent)] text-sm font-bold text-white">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <h4
                ref={index === visibleCount - 1 ? newestHeading : undefined}
                tabIndex={-1}
                className="text-lg font-bold text-[#252629] outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[var(--academy-accent)]"
              >
                <span className="sr-only">{german ? `Schritt ${index + 1} von ${items.length}: ` : `Step ${index + 1} of ${items.length}: `}</span>
                {item.title}
              </h4>
              <p className="academy-reading-copy mt-2 whitespace-pre-wrap font-[family-name:var(--font-academy-body)] text-[15px] leading-7 text-[#27313B]">
                <AcademyGermanText text={item.body} enabled={tracking.genderCues || isNicosWegCourse(tracking.courseKey)} />
              </p>
            </div>
          </li>
        ))}
      </ol>
      <p className="sr-only" role="status" aria-live="polite">
        {finished
          ? german ? "Alle Schritte abgeschlossen." : "Process complete."
          : german ? `${visibleCount} von ${items.length} Schritten sichtbar.` : `${visibleCount} of ${items.length} steps visible.`}
      </p>
      {items.length === 0 ? (
        <p className="mt-6 text-sm text-[#62666C]">{german ? "Noch keine Schritte vorhanden." : "No steps have been added yet."}</p>
      ) : (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#DEDFE1] pt-5">
          <button
            type="button"
            onClick={() => setRevealedCount(Math.max(1, visibleCount - 1))}
            disabled={visibleCount <= 1}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#C9CDD2] px-4 text-sm font-semibold text-[#252629] outline-none focus-visible:ring-2 focus-visible:ring-[var(--academy-accent)] disabled:opacity-40"
            aria-label={german ? "Einen Schritt weniger anzeigen" : "Show one fewer process step"}
          >
            <ArrowLeft size={17} /> {german ? "Zurück" : "Previous"}
          </button>
          <span className="text-xs font-semibold text-[#62666C]" aria-hidden="true">
            {visibleCount} {german ? "von" : "of"} {items.length}
          </span>
          <button
            type="button"
            onClick={revealNext}
            disabled={finished && visibleCount === items.length}
            aria-controls={listId}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--academy-accent)] px-5 text-sm font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--academy-accent)] focus-visible:ring-offset-2 disabled:bg-[#39766C]"
          >
            {finished && visibleCount === items.length
              ? german ? "Abgeschlossen" : "Process complete"
              : visibleCount === items.length
                ? german ? "Abschließen" : "Finish process"
                : german ? "Nächster Schritt" : "Next step"}
            {finished && visibleCount === items.length ? <Check size={17} /> : <ArrowRight size={17} />}
          </button>
        </div>
      )}
    </section>
  );
}

export function AcademySurvey({
  prompt,
  lowLabel,
  highLabel,
  scale,
  submitLabel = "Submit",
  variant = "scale",
  ...tracking
}: {
  prompt: string;
  lowLabel: string;
  highLabel: string;
  scale: 3 | 5 | 7;
  submitLabel?: string;
  variant?: "scale" | "compact";
} & Tracking) {
  const name = useId();
  const [answer, setAnswer] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  return (
    <div
      className={`academy-rating-card border border-[#DEDFE1] bg-white ${variant === "compact" ? "p-5 sm:p-6" : "p-6 sm:p-9"}`}
    >
      <p className="text-xl font-bold text-[#252629]">{prompt}</p>
      <fieldset className="mt-7">
        <legend className="sr-only">Choose a rating from 1 to {scale}</legend>
        <div className="flex items-end justify-between gap-2">
          <span className="hidden max-w-28 text-xs font-bold text-[#717376] sm:block">{lowLabel}</span>
          {Array.from({ length: scale }, (_, index) => index + 1).map((value) => (
            <label key={value} className="flex min-w-10 flex-col items-center gap-2 text-xs font-bold text-[#4A4B4E]">
              <span>{value}</span>
              <input
                type="radio"
                name={name}
                value={value}
                checked={answer === value}
                onChange={() => {
                  setAnswer(value);
                  setSubmitted(false);
                }}
                className="h-6 w-6 accent-[var(--academy-accent)]"
              />
            </label>
          ))}
          <span className="hidden max-w-28 text-right text-xs font-bold text-[#717376] sm:block">{highLabel}</span>
        </div>
        <div className="mt-3 flex justify-between text-[11px] font-bold text-[#717376] sm:hidden">
          <span>{lowLabel}</span><span>{highLabel}</span>
        </div>
      </fieldset>
      <button
        type="button"
        disabled={answer === null || submitted}
        onClick={() => {
          setSubmitted(true);
          record(tracking);
        }}
        className="mx-auto mt-8 flex min-h-11 min-w-40 items-center justify-center rounded-full bg-[var(--academy-accent)] px-7 text-xs font-bold uppercase tracking-[0.1em] text-white disabled:opacity-40"
      >
        {submitted ? "Response noted" : submitLabel}
      </button>
      {submitted ? (
        <p role="status" className="mt-4 text-center text-sm font-semibold text-emerald-700">
          Thank you—your response is complete.
        </p>
      ) : null}
    </div>
  );
}

export function AcademyKnowledgeCheck({
  question,
  ...tracking
}: { question: QuizQuestion } & Tracking) {
  const german = tracking.uiLanguage === "de";
  const soundEnabled = isNicosWegCourse(tracking.courseKey);
  const explanation = resolveNicosWegA1Feedback(question.id, question.explanation);
  const choiceSpec = getNicosChoiceCheck(tracking.courseKey, tracking.blockId, question);
  const useBilingualRule = choiceSpec && (explanation !== question.explanation
    || explanation === nicosWegA1QuestionExplanation(question.id, "") || explanation === choiceSpec.explanation);
  const [answers, setAnswers] = useState<string[]>([]);
  const [reflection, setReflection] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [progressSaved, setProgressSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const feedback = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (submitted && feedback.current) return animateAcademyPanel(feedback.current);
  }, [submitted]);
  const router = useRouter();
  const type = question.type || "single-choice";
  const correct =
    type === "reflection" ||
    (type === "multiple-response"
      ? [...answers].sort().join("|") ===
        [...(question.correctOptionIds || [])].sort().join("|")
      : answers[0] === question.correctOptionId);
  const saveCompletion = async (answer: string | string[]) => {
    if (!tracking.courseKey || !tracking.blockId ||
      (tracking.completion !== "interact" && tracking.completion !== "pass")) return;
    setPending(true);
    setSaveError("");
    try {
      const result = await recordAcademyBlockCompletion(tracking.courseKey, tracking.blockId, answer);
      if (result.error) setSaveError(result.error);
      else { setProgressSaved(true); router.refresh(); }
    } catch {
      setSaveError(german
        ? "Der Lernfortschritt konnte nicht gespeichert werden. Bitte versuchen Sie es noch einmal."
        : "Activity progress could not be saved. Please try again.");
    } finally {
      setPending(false);
    }
  };
  if (type === "reflection")
    return (
      <div className="border-l-4 border-[var(--academy-accent)] bg-[var(--academy-accent-soft)] p-6">
        <p className="text-lg font-bold text-[var(--academy-accent-ink)]"><AcademyGermanText text={question.prompt} enabled={soundEnabled}/></p>
        <textarea
          value={reflection}
          onChange={(event) => setReflection(event.target.value)}
          rows={4}
          className="mt-4 w-full border border-[#AFC8E7] bg-white p-3 text-sm"
          placeholder={german ? "Schreiben Sie Ihre Antwort …" : "Write your reflection…"}
        />
        <button
          type="button"
          disabled={!reflection.trim() || pending}
          onClick={() => {
            setSubmitted(true);
            void saveCompletion(reflection);
          }}
          className="mt-3 bg-[var(--academy-accent)] px-5 py-2.5 text-xs font-bold uppercase text-white disabled:opacity-40"
        >
          {german ? "Antwort speichern" : "Save reflection"}
        </button>
        {submitted ? (
          <p className="mt-4 text-sm font-semibold text-[var(--academy-accent-ink)]">
            {explanation}
          </p>
        ) : null}
        {saveError ? <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{saveError}</p> : null}
      </div>
    );
  return (
    <div className="academy-knowledge-card overflow-hidden rounded-2xl border border-[#D9DEC8] bg-linear-to-br from-[#FFF9E7] via-[#FFFCF3] to-white p-5 shadow-[0_4px_18px_rgba(89,69,31,0.05)] sm:p-7">
      <div className="mb-4 flex items-center gap-2 text-sm font-bold text-[#59451F]">
        <CircleHelp size={20} aria-hidden="true" /> {german ? "Kurz üben" : "Quick practice"}
      </div>
      <p className="text-lg font-bold leading-7 text-[#252629]"><AcademyGermanText text={question.prompt} enabled={soundEnabled}/></p>
      <div className="mt-5 space-y-3">
        {question.options.map((option) => (
          <label
            key={option.id}
            data-academy-choice={answers.includes(option.id) ? "selected" : "idle"}
            className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border p-4 font-[family-name:var(--font-academy-body)] text-base text-[#27313B] transition-colors focus-within:ring-2 focus-within:ring-[var(--academy-accent)] motion-reduce:transition-none ${answers.includes(option.id) ? "border-[var(--academy-accent)] bg-[#EAF3FB] shadow-[0_0_0_1px_var(--academy-accent)]" : "border-[#D9DFE4] bg-white hover:border-[#AFC8E7] hover:bg-[#F2F7FC]"}`}
          >
            <input
              type={type === "multiple-response" ? "checkbox" : "radio"}
              name={question.id}
              className="h-5 w-5 shrink-0 accent-[var(--academy-accent)]"
              checked={answers.includes(option.id)}
              onChange={() => {
                setSubmitted(false);
                setSaveError("");
                setProgressSaved(false);
                setAnswers((current) =>
                  type === "multiple-response"
                    ? current.includes(option.id)
                      ? current.filter((id) => id !== option.id)
                      : [...current, option.id]
                    : [option.id],
                );
              }}
            />
            <AcademyGermanText text={option.label} enabled={soundEnabled}/>
          </label>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          data-academy-action="primary"
          disabled={!answers.length || pending}
          onClick={() => {
            setSubmitted(true);
            if (soundEnabled) playAnswerSound(correct ? "correct" : "retry");
            if (tracking.completion === "interact" || correct)
              void saveCompletion(type === "multiple-response" ? answers : answers[0]);
          }}
          className="min-h-11 rounded-full bg-[var(--academy-accent)] px-6 py-3 text-sm font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--academy-accent)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#DCE5EE] disabled:text-[#52677B]"
        >
          {german ? "Antwort prüfen" : "Check answer"}
        </button>
        {submitted ? (
          <button
            type="button"
            onClick={() => {
              setAnswers([]);
              setSubmitted(false);
              setProgressSaved(false);
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#B8CADA] bg-white px-4 text-sm font-bold text-[#344B60] outline-none focus-visible:ring-2 focus-visible:ring-[var(--academy-accent)]"
          >
            <RotateCcw size={14} />
            {german ? "Erneut versuchen" : "Try again"}
          </button>
        ) : null}
      </div>
      {saveError ? <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{saveError}</p> : null}
      {submitted ? (
        <div
          ref={feedback}
          data-academy-feedback={correct ? "correct" : "retry"}
          role="status"
          className={`mt-5 rounded-xl border-l-4 p-4 font-[family-name:var(--font-academy-body)] text-base ${correct ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-amber-600 bg-amber-50 text-amber-950"}`}
        >
          <p className="flex items-center gap-2 font-bold">
            {correct ? <CheckCircle2 size={17} /> : null}
            {correct
              ? german ? "Richtig" : "Correct"
              : german ? "Noch nicht ganz" : "Not quite yet"}
          </p>
          {useBilingualRule && choiceSpec ? <AcademyBilingualRule explanation={choiceSpec.explanation} explanationSinhala={choiceSpec.explanationSinhala} /> : <p className="mt-1"><AcademyGermanText text={explanation} enabled={soundEnabled}/></p>}
          <p className="mt-3 text-sm">{pending ? german ? "Fortschritt wird gespeichert …" : "Saving progress …" : progressSaved
            ? german ? "Fortschritt gespeichert. Weiter mit der nächsten Aktivität." : "Progress saved. Continue with the next activity."
            : correct ? german ? "Weiter mit der nächsten Aktivität." : "Continue with the next activity."
            : german ? "Lesen Sie den Hinweis und versuchen Sie es erneut." : "Read the explanation and try again."}</p>
        </div>
      ) : null}
    </div>
  );
}
