"use client";

import { useId, useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
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
  ...tracking
}: { items: Item[] } & Tracking) {
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  return (
    <div className="grid gap-4 sm:grid-cols-2">
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
            className="min-h-44 border border-[#DEDFE1] bg-white p-6 text-left focus-visible:ring-2 focus-visible:ring-[#1E5AA8]"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1E5AA8]">
              {open ? "Answer" : "Think first, then reveal"}
            </span>
            <span
              className={`mt-4 block ${open ? "font-[family-name:var(--font-academy-serif)] text-base leading-7 text-[#4A4B4E]" : "text-xl font-bold text-[#252629]"}`}
            >
              {open ? item.body : item.title}
            </span>
          </button>
        );
      })}
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
