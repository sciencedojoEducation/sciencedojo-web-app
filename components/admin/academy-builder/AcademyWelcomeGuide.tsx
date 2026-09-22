"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileCheck2,
  Image as ImageIcon,
  LayoutGrid,
  Monitor,
  Play,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tablet,
  X,
  Zap,
} from "lucide-react";
import AcademyBlockIcon from "@/components/admin/academy-builder/AcademyBlockIcon";
import type { AcademyBlockIconKey } from "@/lib/academy-schema";

const STORAGE_KEY = "science-dojo-academy-welcome-v1";

const slides = [
  {
    eyebrow: "Choose the right starting point",
    title: "Create learning that fits the goal",
    body: "Start with a complete course, a focused microlearning lesson, or a guided induction template. Every option remains fully editable.",
    visual: "formats",
  },
  {
    eyebrow: "Build visually",
    title: "Add one purposeful block at a time",
    body: "Use the quick-add row for common blocks or search the full library. Edit content, style, format and completion from the selected block.",
    visual: "blocks",
  },
  {
    eyebrow: "Preview with confidence",
    title: "See the learner experience before publishing",
    body: "Check desktop, tablet and mobile views, resolve readiness issues, then publish an immutable version when the course is ready.",
    visual: "publish",
  },
] as const;

function SlideVisual({ kind }: { kind: (typeof slides)[number]["visual"] }) {
  if (kind === "formats")
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          [BookOpen, "Course", "Lessons and assessment", "bg-sky-50 text-sky-700"],
          [Zap, "Microlearning", "One focused objective", "bg-amber-50 text-amber-700"],
          [Sparkles, "Guided induction", "A proven onboarding flow", "bg-violet-50 text-violet-700"],
        ].map(([Icon, label, detail, colour]) => {
          const VisualIcon = Icon as typeof BookOpen;
          return (
            <div key={String(label)} className="rounded-2xl border border-secondary/10 bg-white p-4">
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${colour}`}>
                <VisualIcon size={19} />
              </span>
              <strong className="mt-4 block text-sm text-secondary">{String(label)}</strong>
              <span className="mt-1 block text-xs leading-5 text-secondary/45">{String(detail)}</span>
            </div>
          );
        })}
      </div>
    );
  if (kind === "blocks")
    return (
      <div className="rounded-2xl border border-dashed border-secondary/20 bg-white p-4">
        <div className="flex gap-3 overflow-hidden">
          <span className="flex min-h-24 min-w-24 flex-col items-center justify-center gap-2 rounded-xl bg-secondary text-[10px] font-black text-white">
            <LayoutGrid size={20} /> Block library
          </span>
          {(
            [
              ["text", "Text"],
              ["list", "List"],
              ["image", "Image"],
              ["process", "Process"],
              ["flashcards", "Flashcards"],
              ["survey", "Survey"],
            ] as Array<[AcademyBlockIconKey, string]>
          ).map(([icon, label], index) => (
            <span
              key={label}
              className="flex min-h-24 min-w-20 flex-col items-center justify-center gap-3 rounded-xl text-[10px] font-black text-secondary/65"
            >
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${index % 2 ? "bg-primary/10 text-primary" : "bg-slate-100 text-secondary/70"}`}
              >
                <AcademyBlockIcon name={icon} size={20} />
              </span>
              {label}
            </span>
          ))}
        </div>
      </div>
    );
  return (
    <div className="grid gap-3 sm:grid-cols-[1.35fr_0.65fr]">
      <div className="rounded-2xl border border-secondary/10 bg-white p-4">
        <div className="overflow-hidden rounded-xl border border-secondary/10 bg-white shadow-sm">
          <div className="flex h-10 items-center gap-2 border-b border-secondary/10 bg-slate-50 px-3">
            <span className="h-2 w-2 rounded-full bg-red-300" />
            <span className="h-2 w-2 rounded-full bg-amber-300" />
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            <span className="ml-auto inline-flex items-center gap-2 rounded-full bg-white px-2.5 py-1 text-primary shadow-sm">
              <Monitor size={11} />
              <Tablet size={11} className="opacity-45" />
              <Smartphone size={11} className="opacity-45" />
            </span>
          </div>
          <div className="grid min-h-52 grid-cols-[76px_1fr]">
            <div className="border-r border-secondary/10 bg-[#092A5C] p-3 text-white">
              <div className="h-2 w-10 rounded bg-white/80" />
              <div className="mt-5 space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-full border ${item === 1 ? "border-white bg-white" : "border-white/35"}`} />
                    <span className={`h-1.5 rounded ${item === 1 ? "w-8 bg-white/80" : "w-7 bg-white/25"}`} />
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary/[0.07] via-white to-teal-50/60 p-5">
              <div className="flex items-center justify-between">
                <span className="text-[7px] font-black uppercase tracking-[0.16em] text-primary">Lesson 1 of 3</span>
                <span className="rounded-full bg-white px-2 py-1 text-[7px] font-black text-secondary/45 shadow-sm">6 min</span>
              </div>
              <div className="mt-3 h-3 w-3/5 rounded bg-secondary/75" />
              <div className="mt-2 h-1 w-8 rounded bg-primary" />
              <div className="mt-4 grid grid-cols-[1fr_92px] gap-4">
                <div className="space-y-2">
                  <div className="h-1.5 w-full rounded bg-secondary/15" />
                  <div className="h-1.5 w-11/12 rounded bg-secondary/15" />
                  <div className="h-1.5 w-4/5 rounded bg-secondary/15" />
                  <div className="mt-4 flex gap-2">
                    <span className="h-7 w-16 rounded-full bg-primary" />
                    <span className="h-7 w-16 rounded-full border border-secondary/10 bg-white" />
                  </div>
                </div>
                <div className="flex items-center justify-center rounded-lg bg-[#DDEAF8] text-primary">
                  <ImageIcon size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col rounded-2xl bg-emerald-50 p-5 text-emerald-950">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-700 text-white">
            <CheckCircle2 size={23} />
          </span>
          <span>
            <strong className="block text-sm">Ready to publish</strong>
            <span className="text-[10px] font-bold text-emerald-800/60">3 of 3 checks passed</span>
          </span>
        </div>
        <div className="mt-5 space-y-2.5">
          {[
            [ShieldCheck, "Accessibility", "Alt text and structure"],
            [FileCheck2, "Course content", "Lessons are complete"],
            [BookOpen, "Assessment", "Answers are configured"],
          ].map(([Icon, label, detail]) => {
            const CheckIcon = Icon as typeof ShieldCheck;
            return (
              <div key={String(label)} className="flex items-center gap-3 rounded-xl bg-white/75 p-3">
                <CheckIcon size={16} className="shrink-0 text-emerald-700" />
                <span className="min-w-0">
                  <strong className="block text-[11px]">{String(label)}</strong>
                  <span className="block truncate text-[9px] text-emerald-900/55">{String(detail)}</span>
                </span>
                <CheckCircle2 size={14} className="ml-auto shrink-0 text-emerald-600" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function AcademyWelcomeGuide() {
  const [open, setOpen] = useState(false);
  const [slide, setSlide] = useState(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let frame = 0;
    try {
      if (!window.localStorage.getItem(STORAGE_KEY))
        frame = window.requestAnimationFrame(() => setOpen(true));
    } catch {
      // The tour is optional when browser storage is unavailable.
    }
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "ArrowRight") setSlide((value) => Math.min(value + 1, slides.length - 1));
      if (event.key === "ArrowLeft") setSlide((value) => Math.max(value - 1, 0));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const close = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "seen");
    } catch {
      // Closing the tour must never depend on storage.
    }
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setSlide(0);
          setOpen(true);
        }}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-secondary/10 bg-white px-4 text-xs font-black text-secondary/60 hover:border-primary/30 hover:text-primary"
      >
        <Play size={14} /> Quick tour
      </button>
      {open ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-secondary/55 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label="Academy builder introduction">
          <div className="w-full max-w-4xl overflow-hidden rounded-[1.75rem] bg-white shadow-2xl">
            <div className="flex items-start justify-between px-6 pt-6 sm:px-8 sm:pt-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/65">Welcome to Academy Builder</p>
                <p className="mt-1 text-sm font-semibold text-secondary/45">A short tour of the authoring flow</p>
              </div>
              <button ref={closeButtonRef} type="button" onClick={close} className="inline-flex h-11 w-11 items-center justify-center rounded-xl hover:bg-slate-100" aria-label="Close welcome tour"><X size={20} /></button>
            </div>
            <div className="overflow-hidden px-6 py-7 sm:px-8">
              <div key={slide} className="academy-guide-enter">
                <SlideVisual kind={slides[slide].visual} />
                <p className="mt-7 text-[10px] font-black uppercase tracking-[0.16em] text-primary/65">{slides[slide].eyebrow}</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-secondary sm:text-4xl">{slides[slide].title}</h2>
                <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-secondary/55">{slides[slide].body}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-secondary/10 px-6 py-5 sm:px-8">
              <div className="flex gap-2" aria-label={`Tour slide ${slide + 1} of ${slides.length}`}>
                {slides.map((item, index) => <button key={item.title} type="button" onClick={() => setSlide(index)} aria-label={`Show tour slide ${index + 1}`} aria-current={slide === index ? "step" : undefined} className={`h-2.5 rounded-full transition-all ${slide === index ? "w-7 bg-primary" : "w-2.5 bg-secondary/15"}`} />)}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button type="button" disabled={slide === 0} onClick={() => setSlide((value) => value - 1)} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-secondary/10 disabled:opacity-25" aria-label="Previous tour slide"><ArrowLeft size={18} /></button>
                {slide < slides.length - 1 ? (
                  <button type="button" onClick={() => setSlide((value) => value + 1)} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-secondary px-5 text-xs font-black text-white">Next <ArrowRight size={16} /></button>
                ) : (
                  <Link href="/dashboard/admin/academy/new" onClick={close} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-xs font-black text-white">Create a course <ArrowRight size={16} /></Link>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
