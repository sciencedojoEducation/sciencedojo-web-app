"use client";

import { useState } from "react";
import { ShieldCheck, Brain, Beaker, CheckCircle2, Loader2 } from "lucide-react";
import { evaluateMission } from "../../classes/[id]/missions/actions";

type MissionData = {
  topic: string;
  stage1: {
    title: string;
    questions: { question: string; options: string[]; correctIndex: number }[];
  };
  stage2: { title: string; missionPrompt: string };
  stage3: { title: string; scenarioContext: string; question: string };
  stage4: {
    title: string;
    missionPrompt: string;
    corruptedText: string;
    errors: { wrongWord: string; correctWord: string }[];
  };
};

export default function MissionViewer({ mission, missionId, onComplete }: { mission: MissionData, missionId: string, onComplete?: () => void }) {
  const [s1Answers, setS1Answers] = useState<Record<number, number>>({});
  
  // Controlled fields for user input
  const [s2Answer, setS2Answer] = useState("");
  const [s3Answer, setS3Answer] = useState("");
  const [s4Answers, setS4Answers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [scoreAchieved, setScoreAchieved] = useState(0);
  const [submissionError, setSubmissionError] = useState("");
  
  // Minimal checks
  const s1Complete = Object.keys(s1Answers).length === mission.stage1.questions.length;
  const s4Complete = mission.stage4.errors.every((_, index) => Boolean(s4Answers[index]?.trim()));
  const currentStage = !s1Complete ? 1 : !s2Answer.trim() ? 2 : !s3Answer.trim() ? 3 : !s4Complete ? 4 : 4;

  return (
    <div className="space-y-5 pb-16">
      
      {!isSubmitted ? (
      <>
      {/* Header */}
      <header className="rounded-xl border border-slate-200 bg-white px-5 py-6 md:px-7">
         <div>
            <p className="text-sm font-semibold text-[#4f53a5]">Guided learning pathway</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{mission.topic}</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
              Work through each stage calmly. Your tutor will review the thinking, not just the final answers.
            </p>
         </div>
         <ol aria-label="Mission stages" className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
           {["Recall", "Reason", "Apply", "Review"].map((label, index) => (
             <li key={label} aria-current={currentStage === index + 1 ? "step" : undefined} className={`rounded-lg px-3 py-2 text-xs font-semibold ${currentStage === index + 1 ? "bg-[#eeefff] text-[#4f53a5]" : "bg-slate-100 text-slate-600"}`}>
               {index + 1}. {label}
             </li>
           ))}
         </ol>
      </header>

      {/* Stage 1: Recall Check */}
      <section
        className="rounded-xl border border-slate-200 bg-white p-5 md:p-7"
      >
        <div className="mb-5 flex items-center gap-4 md:mb-6">
           <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 md:h-12 md:w-12">
             <ShieldCheck size={24} />
           </div>
           <div>
             <p className="text-xs font-semibold text-slate-600">Stage 1 · Recall</p>
             <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">{mission.stage1.title || "Recall Check"}</h2>
           </div>
        </div>

        <div className="space-y-4 md:space-y-8">
          {mission.stage1.questions.map((q, i) => (
            <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 md:p-6">
              <p className="font-bold text-slate-700 tracking-tight mb-4">{i + 1}. {q.question}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {q.options.map((opt, optIdx) => {
                  const isSelected = s1Answers[i] === optIdx;
                  
                  return (
                    <button 
                      key={optIdx}
                      onClick={() => setS1Answers(prev => ({ ...prev, [i]: optIdx }))}
                      aria-pressed={isSelected}
                      className={`min-h-11 rounded-xl border px-5 py-3 text-left text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f53a5] ${
                        isSelected 
                          ? "border-sky-400 bg-sky-100 text-sky-900"
                          : "border-slate-200 bg-white text-slate-700 hover:border-sky-300"
                      }`}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stage 2: Reasoning Practice */}
      <section
        className="rounded-xl border border-slate-200 bg-white p-5 md:p-7"
      >
        <div>
          <div className="mb-5 flex items-center gap-4 md:mb-6">
             <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 md:h-12 md:w-12">
               <Brain size={24} />
             </div>
             <div>
               <p className="text-xs font-semibold text-slate-600">Stage 2 · Reason</p>
               <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">{mission.stage2.title || "Reasoning Practice"}</h2>
             </div>
          </div>
          <p className="rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-700 md:p-5">
            {mission.stage2.missionPrompt}
          </p>
          <label htmlFor="mission-reasoning" className="mt-5 block text-sm font-semibold text-slate-800">Your reasoning</label>
          <textarea 
            id="mission-reasoning"
            value={s2Answer}
            onChange={(e) => setS2Answer(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-4 !text-slate-900 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f53a5]"
            rows={4}
            placeholder="Explain your reasoning here..."
          />
        </div>
      </section>

      {/* Stage 3: Applied Understanding */}
      <section
        className="rounded-xl border border-slate-200 bg-white p-5 md:p-7"
      >
        <div>
          <div className="mb-5 flex items-center gap-4 md:mb-6">
             <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 md:h-12 md:w-12">
                <Beaker size={24} />
             </div>
             <div>
               <p className="text-xs font-semibold text-slate-600">Stage 3 · Apply</p>
               <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">{mission.stage3.title || "Applied Understanding"}</h2>
             </div>
          </div>
          <div className="mb-5 rounded-xl bg-slate-50 p-4 md:p-5">
            <p className="mb-2 text-xs font-semibold text-[#4f53a5]">Scenario context</p>
            <p className="leading-7 text-slate-700">{mission.stage3.scenarioContext}</p>
          </div>
          <label htmlFor="mission-application" className="mb-2 block font-semibold text-slate-800">{mission.stage3.question}</label>
          <textarea 
            id="mission-application"
            value={s3Answer}
            onChange={(e) => setS3Answer(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white p-4 !text-slate-900 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f53a5]"
            rows={4}
            placeholder="Write your solution..."
          />
        </div>
      </section>

      {/* Stage 4: Mastery Checkpoint */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 md:p-7">
        <div>
          <div className="mb-5 flex items-center gap-4 md:mb-6">
             <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 md:h-12 md:w-12">
                <CheckCircle2 size={24} />
             </div>
             <div>
               <p className="text-xs font-semibold text-slate-600">Stage 4 · Review</p>
               <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">{mission.stage4.title || "Mastery Checkpoint"}</h2>
             </div>
          </div>
          <p className="mb-5 text-sm leading-7 text-slate-700">{mission.stage4.missionPrompt}</p>
          
          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-800">
             <p className="mb-2 text-xs font-semibold text-[#4f53a5]">Text to review</p>
             <p>{mission.stage4.corruptedText}</p>
          </div>

          <div className="space-y-4">
             {mission.stage4.errors.map((err, idx) => (
                <div key={idx} className="flex flex-col gap-3 md:flex-row">
                   <div className="flex flex-1 flex-col justify-center rounded-xl border border-slate-200 bg-slate-50 p-4">
                     <p className="mb-1 text-xs font-semibold text-slate-600">Check this part</p>
                     <p className="font-semibold text-slate-800 line-through decoration-red-600">{err.wrongWord}</p>
                   </div>
                   <div className="flex-1 rounded-xl border border-slate-200 bg-white p-4">
                     <label htmlFor={`mission-correction-${idx}`} className="mb-2 block text-xs font-semibold text-slate-700">Your correction</label>
                     <input 
                       id={`mission-correction-${idx}`}
                       value={s4Answers[idx] || ""}
                       onChange={(e) => setS4Answers(prev => ({ ...prev, [idx]: e.target.value }))}
                       className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-medium text-slate-900 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f53a5]"
                       placeholder="Type correction here..."
                     />
                   </div>
                </div>
             ))}
          </div>

          {submissionError && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{submissionError}</p>}
          <button 
            onClick={async () => {
                setIsEvaluating(true);
                setSubmissionError("");
                try {
                    const res = await evaluateMission(missionId, s1Answers, s2Answer, s3Answer, s4Answers);
                    if (res.error) setSubmissionError(res.error);
                    else {
                        setScoreAchieved(res.score || 0);
                        setIsSubmitted(true);
                    }
                } catch(e) {
                    console.error(e);
                    setSubmissionError("We couldn’t submit your practice. Please try again.");
                }
                setIsEvaluating(false);
            }}
            disabled={isEvaluating}
            className="mt-7 flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#1E5AA8] px-5 py-3 text-sm font-semibold text-white hover:bg-[#174a8b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f53a5] focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {isEvaluating ? <Loader2 className="animate-spin" size={20} /> : null}
            {isEvaluating ? "Reviewing your responses..." : "Submit for Tutor Review"}
          </button>
        </div>
      </section>
      </>
      ) : (
      <div role="status" className="rounded-xl border border-emerald-200 bg-white p-6 text-center text-slate-800 md:p-10">
         <div className="flex flex-col items-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
               <ShieldCheck size={32} />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900">Practice submitted</h2>
            <p className="mt-2 text-lg font-medium text-emerald-800">{scoreAchieved}% completed</p>
            
            <div className="my-6 w-full max-w-md rounded-lg border border-slate-200 bg-slate-50 p-4">
               <p className="text-sm font-semibold text-slate-700">Status: Tutor review next</p>
            </div>

            <p className="mb-7 max-w-lg text-sm leading-7 text-slate-600">
              Well done. Your responses have been saved so your tutor can review your thinking, add guidance, and help decide the next recommended area.
            </p>

            <div>
               <button 
                 onClick={() => onComplete && onComplete()}
                 className="min-h-11 rounded-xl bg-[#1E5AA8] px-6 py-3 text-sm font-semibold text-white hover:bg-[#174a8b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f53a5] focus-visible:ring-offset-2"
               >
                  Return to Learning Journeys
               </button>
            </div>
         </div>
      </div>
      )}

    </div>
  );
}
