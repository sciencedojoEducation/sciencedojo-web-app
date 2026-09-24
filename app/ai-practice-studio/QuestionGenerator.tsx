"use client";

import { useActionState, useState } from "react";
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
      className="mt-6 w-full rounded-xl bg-primary px-6 py-4 text-sm font-black text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover disabled:cursor-wait disabled:opacity-70"
    >
      {isPending ? "Preparing questions..." : "Get my practice questions"}
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
    <div className="min-w-0 max-w-full overflow-hidden rounded-3xl border border-secondary/10 bg-white p-6 shadow-xl md:p-8">
      <p className="text-sm font-bold text-primary">Free practice · no sign-up needed</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">Build a practice set</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary/65">Choose a subject, stage and topic. You’ll get questions with answers you can reveal when you’re ready.</p>
      <form action={formAction} onSubmit={handleGenerate} className="min-w-0 max-w-full">
        <EducationPathwayFields value={education} onChange={setEducation} topicRequired progressive className="mt-6 rounded-2xl bg-surface p-5" advancedFields={
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
        <div className="mt-8 rounded-2xl border border-primary/15 bg-primary/5 p-5 font-bold text-primary">
          Preparing curriculum-aligned practice questions...
        </div>
      )}

      {state.message && (
        <div className={`mt-8 rounded-2xl border p-5 font-bold ${state.status === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
          {state.message}
        </div>
      )}

      {questions.length > 0 && <div className="mt-8 min-w-0 max-w-full">
        <div className="flex min-w-0 max-w-full flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0 max-w-full">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Your practice set</p>
            <h2 className="mt-2 text-2xl font-black">Your practice questions</h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-secondary/55">Try each question before revealing its answer and worked guidance.</p>
          </div>
          <p className="text-sm font-bold text-secondary/45">{questions.length} questions with answers</p>
        </div>

          <div className="mt-5 grid min-w-0 max-w-full gap-3">
            {questions.map((question, index) => (
              <details key={`${question.question}-${index}`} className="group min-w-0 max-w-full overflow-hidden rounded-xl border border-secondary/12 bg-white p-4 shadow-sm shadow-secondary/5 md:p-5">
                <summary className="max-w-full cursor-pointer list-none overflow-hidden">
                  <div className="flex min-w-0 max-w-full items-start gap-3">
                    <span className="shrink-0 pt-0.5 text-sm font-semibold text-secondary/45">{index + 1}.</span>
                    <div className="min-w-0 max-w-full flex-1 overflow-hidden">
                      <MathText
                        text={question.question}
                        className="min-w-0 max-w-full text-lg font-semibold leading-7 text-secondary md:text-xl md:leading-8"
                      />
                      <p className="mt-3 text-xs font-medium leading-5 text-secondary/42">
                        Topic: {question.skill} <span className="text-secondary/25">&middot;</span> Difficulty: {question.difficulty}{" "}
                        <span className="text-secondary/25">&middot;</span>{" "}
                        <span className="text-primary/70 group-open:hidden">Show answer</span>
                        <span className="hidden text-primary/70 group-open:inline">Hide answer</span>
                      </p>
                      <div className="mt-4 border-b border-dashed border-secondary/25 pb-2 text-sm font-medium text-secondary/38">
                        Answer: <span className="text-secondary/20">____________________________</span>
                      </div>
                    </div>
                  </div>
                </summary>
                <div className="mt-4 min-w-0 max-w-full overflow-hidden rounded-xl border border-secondary/8 bg-surface px-4 py-4 md:px-5">
                  <p className="text-xs font-semibold text-emerald-700">Answer</p>
                  <MathText
                    text={question.answer}
                    className="mt-2 min-w-0 max-w-full text-sm font-semibold leading-6 text-secondary md:text-base md:leading-7"
                  />
                  <p className="mt-4 text-xs font-semibold text-primary/75">Working / marking guidance</p>
                  <MathText
                    text={question.working}
                    className="mt-2 min-w-0 max-w-full text-sm leading-6 text-secondary/65 md:text-base md:leading-7"
                  />
                </div>
              </details>
            ))}
          </div>
      </div>}

    </div>
  );
}
