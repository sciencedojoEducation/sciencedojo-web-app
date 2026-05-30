"use client";

import { useActionState, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import AiPracticeStudioCtaLink from "@/components/analytics/AiPracticeStudioCtaLink";
import {
  allowedQuestionCounts,
  educationalStages,
  getCurriculaForStage,
  getLevelsForCurriculum,
  getSubjectsForSelection,
  getTopicsForSubject,
} from "@/lib/educationTaxonomy";
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
      className="mt-6 w-full rounded-2xl bg-primary px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover disabled:cursor-wait disabled:opacity-70"
    >
      {isPending ? "Preparing Practice..." : "Create Practice Set"}
    </button>
  );
}

export default function QuestionGenerator() {
  const pathname = usePathname();
  const [state, formAction, isPending] = useActionState(generatePracticeQuestions, initialState);
  const [stage, setStage] = useState("GCSE / IGCSE");
  const curricula = useMemo(() => getCurriculaForStage(stage), [stage]);
  const [curriculum, setCurriculum] = useState("Edexcel GCSE");
  const levels = useMemo(() => getLevelsForCurriculum(stage, curriculum), [curriculum, stage]);
  const [level, setLevel] = useState("Higher");
  const subjects = useMemo(() => getSubjectsForSelection(stage, curriculum, level), [curriculum, level, stage]);
  const [subject, setSubject] = useState("Mathematics");
  const topics = useMemo(() => getTopicsForSubject(subject), [subject]);
  const [topic, setTopic] = useState("Mixed Topics");
  const questions = state.questions;

  function handleStageChange(nextStage: string) {
    const nextCurricula = getCurriculaForStage(nextStage);
    const nextCurriculum = nextCurricula.includes(curriculum) ? curriculum : nextCurricula[0];
    const nextLevels = getLevelsForCurriculum(nextStage, nextCurriculum);
    const nextLevel = nextLevels.includes(level) ? level : nextLevels[0];
    const nextSubjects = getSubjectsForSelection(nextStage, nextCurriculum, nextLevel);
    const nextSubject = nextSubjects.includes(subject) ? subject : nextSubjects[0];
    const nextTopics = getTopicsForSubject(nextSubject);

    setStage(nextStage);
    setCurriculum(nextCurriculum);
    setLevel(nextLevel);
    setSubject(nextSubject);
    setTopic(nextTopics.includes(topic) ? topic : nextTopics[0]);
  }

  function handleCurriculumChange(nextCurriculum: string) {
    const nextLevels = getLevelsForCurriculum(stage, nextCurriculum);
    const nextLevel = nextLevels.includes(level) ? level : nextLevels[0];
    const nextSubjects = getSubjectsForSelection(stage, nextCurriculum, nextLevel);
    const nextSubject = nextSubjects.includes(subject) ? subject : nextSubjects[0];
    const nextTopics = getTopicsForSubject(nextSubject);

    setCurriculum(nextCurriculum);
    setLevel(nextLevel);
    setSubject(nextSubject);
    setTopic(nextTopics.includes(topic) ? topic : nextTopics[0]);
  }

  function handleLevelChange(nextLevel: string) {
    const nextSubjects = getSubjectsForSelection(stage, curriculum, nextLevel);
    const nextSubject = nextSubjects.includes(subject) ? subject : nextSubjects[0];
    const nextTopics = getTopicsForSubject(nextSubject);

    setLevel(nextLevel);
    setSubject(nextSubject);
    setTopic(nextTopics.includes(topic) ? topic : nextTopics[0]);
  }

  function handleSubjectChange(nextSubject: string) {
    const nextTopics = getTopicsForSubject(nextSubject);

    setSubject(nextSubject);
    setTopic(nextTopics[0] || "");
  }

  function handleGenerate() {
    trackEvent("ai_practice_studio_generate", {
      stage,
      curriculum,
      level,
      subject,
      topic,
      source_page: getPublicSource(pathname),
    });
  }

  return (
    <div className="rounded-3xl border border-secondary/10 bg-white p-6 shadow-xl md:p-8">
      <form action={formAction} onSubmit={handleGenerate}>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-black text-secondary">
            Educational Stage
            <select
              name="stage"
              value={stage}
              onChange={(event) => handleStageChange(event.target.value)}
              className="rounded-2xl border border-secondary/10 bg-surface px-4 py-3 font-bold outline-none focus:border-primary"
            >
              {educationalStages.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-black text-secondary">
            Curriculum / Qualification
            <select
              name="curriculum"
              value={curriculum}
              onChange={(event) => handleCurriculumChange(event.target.value)}
              className="rounded-2xl border border-secondary/10 bg-surface px-4 py-3 font-bold outline-none focus:border-primary"
            >
              {curricula.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-black text-secondary">
            Level
            <select
              name="level"
              value={level}
              onChange={(event) => handleLevelChange(event.target.value)}
              className="rounded-2xl border border-secondary/10 bg-surface px-4 py-3 font-bold outline-none focus:border-primary"
            >
              {levels.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-black text-secondary">
            Subject
            <select
              name="subject"
              value={subject}
              onChange={(event) => handleSubjectChange(event.target.value)}
              className="rounded-2xl border border-secondary/10 bg-surface px-4 py-3 font-bold outline-none focus:border-primary"
            >
              {subjects.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-black text-secondary">
            Topic
            <select
              name="topic"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              disabled={topics.length === 0}
              className="rounded-2xl border border-secondary/10 bg-surface px-4 py-3 font-bold outline-none focus:border-primary"
            >
              {topics.length === 0 && <option>Choose a topic</option>}
              {topics.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            {topics.length === 0 && <span className="text-xs font-bold text-secondary/45">No topics are available for this subject yet.</span>}
          </label>

          <label className="flex flex-col gap-2 text-sm font-black text-secondary">
            Practice Questions
            <select
              name="count"
              defaultValue="6"
              className="rounded-2xl border border-secondary/10 bg-surface px-4 py-3 font-bold outline-none focus:border-primary"
            >
              {allowedQuestionCounts.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="mt-5 text-sm font-bold leading-6 text-secondary/55">
          Choose your stage, curriculum, subject, and topic to create a focused knowledge check.
        </p>
        <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-primary/70">
          Supports major pathways including UK National Curriculum, Cambridge, Edexcel, AQA, SQA, and IB.
        </p>

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

      <div className="mt-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">
              {questions.length > 0 ? "Structured practice set" : "Ready when you are"}
            </p>
            <h2 className="mt-2 text-2xl font-black">{questions.length ? "Your practice questions" : "Create curriculum-aligned practice"}</h2>
          </div>
          {questions.length > 0 && <p className="text-sm font-bold text-secondary/45">{questions.length} questions with answers</p>}
        </div>

        {questions.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-secondary/10 bg-surface p-6">
            <p className="font-bold leading-7 text-secondary/65">
              Practice Dojo creates structured practice questions by stage, curriculum, level, subject, and topic.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            {questions.map((question, index) => (
              <details key={`${question.question}-${index}`} className="group rounded-xl border border-secondary/12 bg-white p-4 shadow-sm shadow-secondary/5 md:p-5">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 pt-0.5 text-sm font-semibold text-secondary/45">{index + 1}.</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-semibold leading-7 text-secondary md:text-xl md:leading-8">{question.question}</p>
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
                <div className="mt-4 rounded-xl border border-secondary/8 bg-surface px-4 py-4 md:px-5">
                  <p className="text-xs font-semibold text-emerald-700">Answer</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-secondary md:text-base md:leading-7">{question.answer}</p>
                  <p className="mt-4 text-xs font-semibold text-primary/75">Working / marking guidance</p>
                  <p className="mt-2 text-sm leading-6 text-secondary/65 md:text-base md:leading-7">{question.working}</p>
                </div>
              </details>
            ))}
          </div>
        )}
      </div>

      {questions.length > 0 && (
        <div className="mt-8 rounded-3xl bg-secondary p-6 text-white shadow-xl">
          <h2 className="text-2xl font-black">Need help understanding these questions?</h2>
          <p className="mt-3 leading-7 text-white/70">
            A ScienceDojo tutor can help your child turn uncertain topics into a clear learning plan. Enrolled students can also receive personalized Missions between lessons.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <AiPracticeStudioCtaLink
              href="/free-assessment"
              cta="request_free_assessment"
              source="ai_practice_studio_after_generation"
              className="inline-flex justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-white transition-all hover:bg-primary-hover"
            >
              Book Free Assessment
            </AiPracticeStudioCtaLink>
            <AiPracticeStudioCtaLink
              href="/#directory"
              cta="find_tutor"
              source="ai_practice_studio_after_generation"
              className="inline-flex justify-center rounded-2xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-white transition-all hover:bg-white/15"
            >
              Find a Tutor
            </AiPracticeStudioCtaLink>
          </div>
        </div>
      )}
    </div>
  );
}
