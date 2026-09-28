"use client";

import { useActionState, useState } from "react";
import { ArrowRight, ChevronDown, LoaderCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import MathText from "@/components/MathText";
import {
  allowedQuestionCounts,
  getLevelsForEducationSelection,
  getSubjectVariants,
  getTopicsForSubject,
} from "@/lib/educationTaxonomy";
import EducationPathwayFields, { type EducationPathwayValue } from "@/components/EducationPathwayFields";
import { getPublicSource, trackEvent } from "@/lib/analytics";
import { generatePracticeQuestions } from "./actions";
import type { QuestionGeneratorResult } from "@/lib/question-generator";

const initialState: QuestionGeneratorResult = {
  status: "idle",
  questions: [],
};

function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className="mt-6 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-black text-white shadow-[0_10px_24px_rgba(0,102,255,.2)] transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-70"
    >
      {isPending ? "Preparing questions..." : "Get my practice questions"}
      {isPending ? <LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
    </button>
  );
}

const suggestedSubjects = ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "English"];

export default function QuestionGenerator({ initialSubject }: { initialSubject?: string }) {
  const pathname = usePathname();
  const [state, formAction, isPending] = useActionState(generatePracticeQuestions, initialState);
  const subject = initialSubject && suggestedSubjects.includes(initialSubject) ? initialSubject : "Mathematics";
  const [education, setEducation] = useState<EducationPathwayValue>({
    curriculumKey: "england",
    stage: "gcse",
    awardingBodyKey: "pearson_edexcel",
    subject,
    subjectVariant: getSubjectVariants(subject, "england", "gcse")[0]?.key || "",
    level: getLevelsForEducationSelection("england", "gcse", subject)[0]?.key || "",
    topic: getTopicsForSubject(subject)[0] || "",
    specificationCode: "",
  });
  const questions = state.questions;

  function handleGenerate() {
    trackEvent("ai_practice_studio_generate", {
      stage: education.stage,
      curriculum: education.curriculumKey,
      exam_board: education.awardingBodyKey,
      level: education.level,
      subject: education.subject,
      topic: education.topic,
      source_page: getPublicSource(pathname),
    });
  }

  return (
    <div className="min-w-0 max-w-full rounded-[1.75rem] border border-[#dce8f2] bg-white p-5 shadow-[0_24px_70px_rgba(18,59,95,.09)] sm:p-7 md:p-9">
      <div className="mx-auto max-w-4xl">
        <p className="inline-flex items-center gap-2 rounded-full bg-[#eaf4ff] px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-primary">Practice builder</p>
        <h2 className="mt-5 text-2xl font-black tracking-tight md:text-3xl">Make a practice set</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary/65">Choose your subject, stage and topic. Answers stay hidden until you reveal them.</p>
        <form action={formAction} onSubmit={handleGenerate} className="min-w-0 max-w-full">
          <EducationPathwayFields value={education} onChange={setEducation} topicRequired progressive className="mt-6 rounded-2xl border border-[#dceaf5] bg-[#f7fbff] p-4 sm:p-5" advancedFields={
            <label className="text-xs font-black uppercase tracking-widest text-secondary/60">
              Number of questions
              <select name="count" defaultValue="6" className="mt-2 w-full rounded-xl border border-secondary/10 bg-white px-4 py-3 text-sm font-bold text-secondary outline-none focus:border-primary">
                {allowedQuestionCounts.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
          } />
          <SubmitButton isPending={isPending} />
        </form>

        {isPending && (
          <div role="status" className="mt-8 rounded-2xl border border-primary/15 bg-primary/5 p-5 font-bold text-primary">
            Preparing curriculum-aligned practice questions...
          </div>
        )}

        {state.message && (
          <div role={state.status === "error" ? "alert" : "status"} className={`mt-8 rounded-2xl border p-5 font-bold ${state.status === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
            {state.message}
          </div>
        )}
      </div>

      {questions.length > 0 && <section className="mt-9 min-w-0 max-w-full border-t border-secondary/10 pt-8" aria-labelledby="practice-results-heading">
        <div className="flex min-w-0 max-w-full flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0 max-w-full">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Your practice set</p>
            <h2 id="practice-results-heading" className="mt-2 text-2xl font-black">Your questions are ready.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary/60">Try each one before opening the worked answer.</p>
          </div>
          <p className="text-sm font-bold text-secondary/50">{questions.length} questions</p>
        </div>

        <div className="mt-5 grid min-w-0 max-w-full gap-3">
          {questions.map((question, index) => (
            <details key={`${question.question}-${index}`} className="group min-w-0 max-w-full overflow-hidden rounded-2xl border border-[#dce8f2] bg-white shadow-sm">
              <summary className="max-w-full cursor-pointer list-none p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:p-5 [&::-webkit-details-marker]:hidden">
                <div className="flex min-w-0 max-w-full items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e9f4ff] text-sm font-black text-primary">{index + 1}</span>
                  <div className="min-w-0 max-w-full flex-1">
                    <MathText text={question.question} className="min-w-0 max-w-full text-lg font-semibold leading-7 text-secondary md:text-xl md:leading-8" />
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-secondary/60">
                      <span className="max-w-full rounded-full bg-[#f0f5f9] px-3 py-1">{question.skill}</span>
                      <span className="rounded-full bg-[#f0f5f9] px-3 py-1">{question.difficulty}</span>
                    </div>
                  </div>
                  <ChevronDown className="mt-2 h-4 w-4 shrink-0 text-primary transition-transform group-open:rotate-180" aria-hidden="true" />
                </div>
                <p className="mt-4 border-t border-secondary/10 pt-4 text-sm font-bold text-primary"><span className="group-open:hidden">Reveal answer and steps</span><span className="hidden group-open:inline">Hide answer and steps</span></p>
              </summary>
              <div className="min-w-0 max-w-full border-t border-[#dce8f2] bg-[#f6fbff] px-4 py-5 sm:px-6">
                <p className="text-xs font-black uppercase tracking-wider text-[#177451]">Answer</p>
                <MathText text={question.answer} className="mt-2 min-w-0 max-w-full text-sm font-semibold leading-6 text-secondary md:text-base md:leading-7" />
                <p className="mt-5 text-xs font-black uppercase tracking-wider text-primary">Working and guidance</p>
                <MathText text={question.working} className="mt-2 min-w-0 max-w-full text-sm leading-6 text-secondary/75 md:text-base md:leading-7" />
              </div>
            </details>
          ))}
        </div>
      </section>}

    </div>
  );
}
