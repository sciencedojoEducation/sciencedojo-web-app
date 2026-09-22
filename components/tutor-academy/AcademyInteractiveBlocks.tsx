"use client";

import { useId, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Play,
  RotateCcw,
} from "lucide-react";
import type { QuizQuestion } from "@/lib/tutor-academy";
import { recordAcademyBlockCompletion } from "@/app/dashboard/tutor/academy/actions";

type Item = { id?: string; title: string; body: string };
type Tracking = {
  courseKey?: string;
  blockId?: string;
  completion?: "view" | "interact" | "pass";
};

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
  return (
    <div className="border border-[#DEDFE1] bg-white">
      <div
        role="tablist"
        aria-label="Content tabs"
        className="flex overflow-x-auto border-b border-[#DEDFE1] bg-[#F7F8FA]"
      >
        {items.map((item, index) => (
          <button
            key={item.id || item.title}
            id={`${baseId}-tab-${index}`}
            role="tab"
            aria-selected={active === index}
            aria-controls={`${baseId}-panel-${index}`}
            onClick={() => {
              setActive(index);
              record(tracking);
            }}
            className={`min-h-12 shrink-0 border-b-2 px-5 text-sm font-bold ${active === index ? "border-[#1E5AA8] bg-white text-[#1E5AA8]" : "border-transparent text-[#717376]"}`}
          >
            {item.title}
          </button>
        ))}
      </div>
      <div
        id={`${baseId}-panel-${active}`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${active}`}
        className="p-6 font-[family-name:var(--font-academy-serif)] text-[16px] leading-8 text-[#4A4B4E]"
      >
        {items[active]?.body}
      </div>
    </div>
  );
}

export function AcademyAccordion({
  items,
  ...tracking
}: { items: Item[] } & Tracking) {
  return (
    <div className="border-y border-[#DEDFE1] bg-white">
      {items.map((item, index) => (
        <details
          key={item.id || item.title}
          className="group"
          open={index === 0}
          onToggle={(event) => {
            if (event.currentTarget.open) record(tracking);
          }}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 border-b border-[#DEDFE1] px-1 py-5 font-bold text-[#252629] outline-none hover:text-[#1E5AA8] focus-visible:ring-2 focus-visible:ring-[#1E5AA8]">
            <span>{item.title}</span>
            <span
              className="text-xl text-primary transition-transform group-open:rotate-45"
              aria-hidden="true"
            >
              +
            </span>
          </summary>
          <p className="border-b border-[#DEDFE1] px-1 pb-6 font-[family-name:var(--font-academy-serif)] text-[15px] leading-7 text-[#4A4B4E]">
            {item.body}
          </p>
        </details>
      ))}
    </div>
  );
}

export function AcademyFlashcards({
  items,
  variant = "flip-grid",
  ...tracking
}: { items: Item[]; variant?: "flip-grid" | "stack" } & Tracking) {
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  return (
    <div
      className={`grid gap-5 ${variant === "stack" ? "mx-auto max-w-2xl grid-cols-1" : "sm:grid-cols-2"}`}
    >
      {items.map((item, index) => {
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
            className="group relative min-h-52 [perspective:1000px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E5AA8] focus-visible:ring-offset-4"
          >
            <span
              className={`absolute inset-0 block transition-transform duration-500 [transform-style:preserve-3d] motion-reduce:transition-none ${open ? "[transform:rotateY(180deg)]" : ""}`}
            >
              <span className="absolute inset-0 flex flex-col justify-between border border-[#DEDFE1] bg-white p-6 text-left shadow-[0_10px_30px_rgba(20,35,60,0.08)] [backface-visibility:hidden]">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1E5AA8]">
                  Think first, then reveal
                </span>
                <span className="text-xl font-bold text-[#252629]">
                  {item.title}
                </span>
                <span className="inline-flex items-center gap-2 text-xs font-bold text-[#717376]">
                  <RotateCcw size={14} /> Flip card
                </span>
              </span>
              <span className="absolute inset-0 flex flex-col justify-between border border-[#1E5AA8] bg-[#173A63] p-6 text-left text-white shadow-[0_10px_30px_rgba(20,35,60,0.14)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/65">
                  Answer
                </span>
                <span className="font-[family-name:var(--font-academy-serif)] text-base leading-7">
                  {item.body}
                </span>
                <span className="inline-flex items-center gap-2 text-xs font-bold text-white/70">
                  <RotateCcw size={14} /> Show front
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
  const total = items.length + 1;
  const goTo = (next: number) => {
    setStep(Math.max(0, Math.min(next, total - 1)));
    if (next > 0) record(tracking);
  };
  return (
    <div className="overflow-hidden border border-[#DEDFE1] bg-[#F6F7F8]">
      <div
        className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
        style={{ transform: `translateX(-${step * 100}%)` }}
      >
        <div className="flex min-h-72 w-full shrink-0 flex-col items-center justify-center bg-white p-8 text-center sm:p-12">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1E5AA8]">
            Guided process
          </p>
          <h3 className="mt-3 text-2xl font-black text-[#252629]">
            {heading || "Explore this process"}
          </h3>
          <p className="mt-3 max-w-lg font-[family-name:var(--font-academy-serif)] text-[16px] leading-8 text-[#4A4B4E]">
            Move through each step at your own pace.
          </p>
          <button
            type="button"
            onClick={() => goTo(1)}
            className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#1E5AA8] px-7 text-xs font-bold uppercase tracking-[0.1em] text-white"
          >
            Start <Play size={14} fill="currentColor" />
          </button>
        </div>
        {items.map((item, index) => (
          <div
            key={item.id || index}
            className="flex min-h-72 w-full shrink-0 flex-col justify-center bg-white p-8 sm:p-12"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1E5AA8]">
              Step {index + 1} of {items.length}
            </p>
            <h3 className="mt-3 text-2xl font-black text-[#252629]">
              {item.title}
            </h3>
            <p className="mt-4 max-w-2xl font-[family-name:var(--font-academy-serif)] text-[17px] leading-8 text-[#4A4B4E]">
              {item.body}
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
          aria-label="Previous process step"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2" aria-label={`Process position ${step + 1} of ${total}`}>
          {Array.from({ length: total }, (_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goTo(index)}
              aria-label={index === 0 ? "Process introduction" : `Process step ${index}`}
              aria-current={step === index ? "step" : undefined}
              className={`h-2.5 rounded-full transition-all motion-reduce:transition-none ${step === index ? "w-7 bg-[#1E5AA8]" : "w-2.5 bg-[#CED1D5]"}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => goTo(step + 1)}
          disabled={step === total - 1}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#171719] text-white disabled:bg-emerald-600"
          aria-label={step === total - 1 ? "Process complete" : "Next process step"}
        >
          {step === total - 1 ? <Check size={18} /> : <ArrowRight size={18} />}
        </button>
      </div>
    </div>
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
      className={`border border-[#DEDFE1] bg-white ${variant === "compact" ? "p-5 sm:p-6" : "p-6 sm:p-9"}`}
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
                className="h-6 w-6 accent-[#1E5AA8]"
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
        className="mx-auto mt-8 flex min-h-11 min-w-40 items-center justify-center rounded-full bg-[#1E5AA8] px-7 text-xs font-bold uppercase tracking-[0.1em] text-white disabled:opacity-40"
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
  const [answers, setAnswers] = useState<string[]>([]);
  const [reflection, setReflection] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const type = question.type || "single-choice";
  const correct =
    type === "reflection" ||
    (type === "multiple-response"
      ? [...answers].sort().join("|") ===
        [...(question.correctOptionIds || [])].sort().join("|")
      : answers[0] === question.correctOptionId);
  if (type === "reflection")
    return (
      <div className="border-l-4 border-[#1E5AA8] bg-[#F1F6FC] p-6">
        <p className="text-lg font-bold text-[#173A63]">{question.prompt}</p>
        <textarea
          value={reflection}
          onChange={(event) => setReflection(event.target.value)}
          rows={4}
          className="mt-4 w-full border border-[#AFC8E7] bg-white p-3 text-sm"
          placeholder="Write your reflection…"
        />
        <button
          type="button"
          disabled={!reflection.trim()}
          onClick={() => {
            setSubmitted(true);
            record(tracking);
          }}
          className="mt-3 bg-[#1E5AA8] px-5 py-2.5 text-xs font-bold uppercase text-white disabled:opacity-40"
        >
          Save reflection
        </button>
        {submitted ? (
          <p className="mt-4 text-sm font-semibold text-[#173A63]">
            {question.explanation}
          </p>
        ) : null}
      </div>
    );
  return (
    <div className="border border-[#DEDFE1] bg-white p-6">
      <p className="text-lg font-bold text-[#252629]">{question.prompt}</p>
      <div className="mt-4 space-y-2">
        {question.options.map((option) => (
          <label
            key={option.id}
            className="flex cursor-pointer gap-3 border border-[#DEDFE1] p-3 text-sm font-semibold"
          >
            <input
              type={type === "multiple-response" ? "checkbox" : "radio"}
              name={question.id}
              checked={answers.includes(option.id)}
              onChange={() => {
                setSubmitted(false);
                setAnswers((current) =>
                  type === "multiple-response"
                    ? current.includes(option.id)
                      ? current.filter((id) => id !== option.id)
                      : [...current, option.id]
                    : [option.id],
                );
              }}
            />
            {option.label}
          </label>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={!answers.length}
          onClick={() => {
            setSubmitted(true);
            if (tracking.completion === "interact" || correct) record(tracking);
          }}
          className="bg-[#1E5AA8] px-5 py-2.5 text-xs font-bold uppercase text-white disabled:opacity-40"
        >
          Check answer
        </button>
        {submitted ? (
          <button
            type="button"
            onClick={() => {
              setAnswers([]);
              setSubmitted(false);
            }}
            className="inline-flex items-center gap-2 border px-4 text-xs font-bold"
          >
            <RotateCcw size={14} />
            Try again
          </button>
        ) : null}
      </div>
      {submitted ? (
        <div
          role="status"
          className={`mt-4 border-l-4 p-4 text-sm ${correct ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-amber-600 bg-amber-50 text-amber-950"}`}
        >
          <p className="flex items-center gap-2 font-bold">
            {correct ? <CheckCircle2 size={17} /> : null}
            {correct ? "Correct" : "Not quite yet"}
          </p>
          <p className="mt-1">{question.explanation}</p>
        </div>
      ) : null}
    </div>
  );
}
