"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import type { QuizQuestion } from "@/lib/tutor-academy";

export default function AcademyDraftQuizPreview({
  questions,
  passMark,
}: {
  questions: QuizQuestion[];
  passMark: number;
}) {
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const result = useMemo(() => {
    if (!submitted || !questions.length) return null;
    let correct = 0;
    for (const question of questions) {
      if (question.type === "reflection") {
        if (answers[question.id]?.[0]?.trim()) correct += 1;
        continue;
      }
      const expected = new Set(
        question.correctOptionIds?.length
          ? question.correctOptionIds
          : [question.correctOptionId],
      );
      const selected = new Set(answers[question.id] || []);
      if (
        expected.size === selected.size &&
        [...expected].every((value) => selected.has(value))
      )
        correct += 1;
    }
    const score = Math.round((correct / questions.length) * 100);
    return { score, passed: score >= passMark };
  }, [answers, passMark, questions, submitted]);

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
    >
      {result ? (
        <div
          role="status"
          className={`border-l-4 px-5 py-4 text-sm font-semibold ${result.passed ? "border-emerald-600 bg-emerald-50 text-emerald-950" : "border-amber-600 bg-amber-50 text-amber-950"}`}
        >
          Draft result: {result.score}% — {result.passed ? "pass" : "not yet passed"}. Preview answers are temporary and never update learner progress.
        </div>
      ) : null}
      {questions.map((question, index) => {
        const selected = answers[question.id] || [];
        const expected = new Set(
          question.correctOptionIds?.length
            ? question.correctOptionIds
            : [question.correctOptionId],
        );
        const isCorrect =
          question.type === "reflection"
            ? Boolean(selected[0]?.trim())
            : expected.size === selected.length &&
              selected.every((value) => expected.has(value));
        return (
          <fieldset
            key={question.id}
            className="border-t border-[#DEDFE1] bg-white py-7 last:border-b"
          >
            <legend className="w-full text-lg font-bold leading-7 text-[#252629]">
              <span className="mr-3 text-[var(--academy-accent)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              {question.prompt}
            </legend>
            {question.type === "reflection" ? (
              <textarea
                rows={5}
                value={selected[0] || ""}
                onChange={(event) => {
                  setSubmitted(false);
                  setAnswers((current) => ({
                    ...current,
                    [question.id]: [event.target.value],
                  }));
                }}
                className="academy-reading-copy mt-5 w-full border border-[#DEDFE1] p-4 text-sm leading-6 outline-none focus:border-[var(--academy-accent)] focus:ring-2 focus:ring-[var(--academy-accent-soft)]"
                placeholder="Write your reflection…"
              />
            ) : (
              <div className="mt-5 grid gap-3">
                {question.options.map((option) => {
                  const checked = selected.includes(option.id);
                  return (
                    <label
                      key={option.id}
                      className="academy-reading-copy flex min-h-12 cursor-pointer items-start gap-3 border border-[#DEDFE1] px-4 py-3 text-sm leading-6 text-[#4A4B4E] hover:border-[var(--academy-accent)] has-[:checked]:border-[var(--academy-accent)] has-[:checked]:bg-[var(--academy-accent-soft)]"
                    >
                      <input
                        type={question.type === "multiple-response" ? "checkbox" : "radio"}
                        name={question.id}
                        value={option.id}
                        checked={checked}
                        onChange={() => {
                          setSubmitted(false);
                          setAnswers((current) => ({
                            ...current,
                            [question.id]:
                              question.type === "multiple-response"
                                ? checked
                                  ? selected.filter((value) => value !== option.id)
                                  : [...selected, option.id]
                                : [option.id],
                          }));
                        }}
                        className="mt-1 h-4 w-4"
                      />
                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>
            )}
            {submitted ? (
              <div
                className={`mt-4 flex items-start gap-3 border-l-4 px-4 py-3 text-sm font-semibold leading-6 ${isCorrect ? "border-emerald-600 bg-emerald-50 text-emerald-950" : "border-red-700 bg-red-50 text-red-900"}`}
              >
                {isCorrect ? <CheckCircle2 size={19} /> : <XCircle size={19} />}
                <span>{question.explanation}</span>
              </div>
            ) : null}
          </fieldset>
        );
      })}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          className="inline-flex min-h-12 flex-1 items-center justify-center bg-[var(--academy-accent)] px-7 text-sm font-bold uppercase tracking-[0.1em] text-white"
        >
          Check preview answers
        </button>
        <button
          type="button"
          onClick={() => {
            setAnswers({});
            setSubmitted(false);
          }}
          className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#C9CDD2] px-6 text-xs font-bold uppercase tracking-[0.1em]"
        >
          <RotateCcw size={16} aria-hidden="true" /> Reset
        </button>
      </div>
    </form>
  );
}
