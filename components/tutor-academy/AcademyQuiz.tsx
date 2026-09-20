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
      <section className="rounded-[2rem] border border-teal-100 bg-gradient-to-br from-white to-teal-50 p-7 text-center shadow-xl shadow-teal-900/5 sm:p-10" aria-live="polite">
        <span className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-teal-500 text-white shadow-lg shadow-teal-500/20"><Trophy size={38} /></span>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-teal-600">Tutor Foundations complete</p>
        <h2 className="mt-3 text-4xl font-black tracking-tight text-secondary">You scored {state.score}%</h2>
        <p className="mx-auto mt-4 max-w-xl font-medium leading-7 text-secondary/62">{state.message}</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/dashboard/tutor" className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-7 text-xs font-black uppercase tracking-[0.13em] text-white">Go to dashboard</Link>
          <Link href="/dashboard/tutor/academy" className="inline-flex min-h-12 items-center justify-center rounded-full border border-secondary/10 bg-white px-7 text-xs font-black uppercase tracking-[0.13em] text-secondary/60">Review course</Link>
        </div>
      </section>
    );
  }

  const resultMap = new Map(state.results?.map((result) => [result.questionId, result]));

  return (
    <form action={formAction} className="space-y-5">
      {previousBestScore > 0 && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-900">Your best score so far is {previousBestScore}%.</div>
      )}
      {state.message && (
        <div role="alert" className={`rounded-2xl border px-5 py-4 text-sm font-bold ${state.status === "error" ? "border-red-100 bg-red-50 text-red-800" : "border-amber-100 bg-amber-50 text-amber-900"}`}>
          {state.message}
        </div>
      )}

      {questions.map((question, index) => {
        const result = resultMap.get(question.id);
        return (
          <fieldset key={question.id} className="rounded-[1.5rem] border border-secondary/8 bg-white p-5 shadow-sm sm:p-6">
            <legend className="w-full px-0 text-lg font-black leading-7 text-secondary">
              <span className="mr-3 text-primary/50">{String(index + 1).padStart(2, "0")}</span>{question.prompt}
            </legend>
            <div className="mt-5 grid gap-3">
              {question.options.map((option) => (
                <label key={option.id} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-secondary/10 px-4 py-4 text-sm font-bold text-secondary/68 transition-colors hover:border-primary/30 hover:bg-primary/5 has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:text-primary">
                  <input type="radio" name={question.id} value={option.id} required className="mt-0.5 h-4 w-4 accent-blue-600" />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            {result && (
              <div className={`mt-4 flex items-start gap-3 rounded-2xl px-4 py-3 text-sm font-semibold leading-6 ${result.correct ? "bg-teal-50 text-teal-900" : "bg-red-50 text-red-900"}`}>
                {result.correct ? <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-teal-600" /> : <XCircle size={19} className="mt-0.5 shrink-0 text-red-600" />}
                <span>{result.explanation}</span>
              </div>
            )}
          </fieldset>
        );
      })}

      <button type="submit" disabled={pending} className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-7 text-sm font-black uppercase tracking-[0.14em] text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">
        {state.status === "failed" ? <RotateCcw size={18} /> : <CheckCircle2 size={18} />}
        {pending ? "Checking answers..." : state.status === "failed" ? "Try again" : "Submit knowledge check"}
      </button>
    </form>
  );
}
