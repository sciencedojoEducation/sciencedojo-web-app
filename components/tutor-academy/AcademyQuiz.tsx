"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CheckCircle2, RotateCcw, Trophy, XCircle } from "lucide-react";
import { submitTutorAcademyQuiz, type QuizActionState } from "@/app/dashboard/tutor/academy/actions";
import type { QuizOption } from "@/lib/tutor-academy";

type PublicQuizQuestion = { id: string; prompt: string; options: QuizOption[] };

const initialState: QuizActionState = { status: "idle", message: "" };

export default function AcademyQuiz({ questions, previousBestScore }: { questions: PublicQuizQuestion[]; previousBestScore: number }) {
  const [state, formAction, pending] = useActionState(submitTutorAcademyQuiz, initialState);

  if (state.status === "passed") {
    return (
      <section className="border-y border-[#DEDFE1] py-10 text-center" aria-live="polite">
        <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#1E5AA8] text-white"><Trophy size={31} /></span>
        <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-[#1E5AA8]">Tutor Foundations complete</p>
        <h2 className="mt-3 text-3xl font-bold tracking-[-0.02em] text-[#101010]">You scored {state.score}%</h2>
        <p className="mx-auto mt-4 max-w-xl font-[family-name:var(--font-academy-serif)] text-[16px] leading-8 text-[#4A4B4E]">{state.message}</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/dashboard/tutor" className="inline-flex min-h-11 items-center justify-center bg-[#1E5AA8] px-7 text-xs font-bold uppercase tracking-[0.1em] text-white">Go to dashboard</Link>
          <Link href="/dashboard/tutor/academy" className="inline-flex min-h-11 items-center justify-center border border-[#C9CDD2] bg-white px-7 text-xs font-bold uppercase tracking-[0.1em] text-[#4A4B4E]">Review course</Link>
        </div>
      </section>
    );
  }

  const resultMap = new Map(state.results?.map((result) => [result.questionId, result]));

  return (
    <form action={formAction} className="space-y-5">
      {previousBestScore > 0 && (
        <div className="border-l-4 border-[#1E5AA8] bg-[#F1F6FC] px-5 py-4 text-sm font-semibold text-[#173A63]">Your best score so far is {previousBestScore}%.</div>
      )}
      {state.message && (
        <div role="alert" className={`border-l-4 px-5 py-4 text-sm font-semibold ${state.status === "error" ? "border-red-700 bg-red-50 text-red-900" : "border-[#C4943F] bg-[#FBF7EE] text-[#59451F]"}`}>
          {state.message}
        </div>
      )}

      {questions.map((question, index) => {
        const result = resultMap.get(question.id);
        return (
          <fieldset key={question.id} className="border-t border-[#DEDFE1] bg-white py-7 last:border-b">
            <legend className="w-full px-0 text-lg font-bold leading-7 text-[#252629]">
              <span className="mr-3 text-[#1E5AA8]">{String(index + 1).padStart(2, "0")}</span>{question.prompt}
            </legend>
            <div className="mt-5 grid gap-3">
              {question.options.map((option) => (
                <label key={option.id} className="flex cursor-pointer items-start gap-3 border border-[#DEDFE1] px-4 py-4 font-[family-name:var(--font-academy-serif)] text-sm leading-6 text-[#4A4B4E] transition-colors hover:border-[#1E5AA8] has-[:checked]:border-[#1E5AA8] has-[:checked]:bg-[#F1F6FC] has-[:checked]:text-[#173A63] motion-reduce:transition-none">
                  <input type="radio" name={question.id} value={option.id} required className="mt-0.5 h-4 w-4 accent-blue-600" />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            {result && (
              <div className={`mt-4 flex items-start gap-3 border-l-4 px-4 py-3 text-sm font-semibold leading-6 ${result.correct ? "border-[#438A7E] bg-[#F2F8F7] text-[#244743]" : "border-red-700 bg-red-50 text-red-900"}`}>
                {result.correct ? <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-teal-600" /> : <XCircle size={19} className="mt-0.5 shrink-0 text-red-600" />}
                <span>{result.explanation}</span>
              </div>
            )}
          </fieldset>
        );
      })}

      <button type="submit" disabled={pending} className="inline-flex min-h-12 w-full items-center justify-center gap-2 bg-[#1E5AA8] px-7 text-sm font-bold uppercase tracking-[0.1em] text-white hover:bg-[#174A8B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E5AA8] disabled:cursor-wait disabled:opacity-60">
        {state.status === "failed" ? <RotateCcw size={18} /> : <CheckCircle2 size={18} />}
        {pending ? "Checking answers..." : state.status === "failed" ? "Try again" : "Submit knowledge check"}
      </button>
    </form>
  );
}
