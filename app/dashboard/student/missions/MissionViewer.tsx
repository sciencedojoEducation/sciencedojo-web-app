"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
  const [activeStage, setActiveStage] = useState(1);
  const [s1Answers, setS1Answers] = useState<Record<number, number>>({});
  
  // Controlled fields for user input
  const [s2Answer, setS2Answer] = useState("");
  const [s3Answer, setS3Answer] = useState("");
  const [s4Answers, setS4Answers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [scoreAchieved, setScoreAchieved] = useState(0);
  
  // Minimal checks
  const s1Complete = Object.keys(s1Answers).length === mission.stage1.questions.length;

  return (
    <div className="space-y-5 pb-20 md:space-y-8">
      
      {!isSubmitted ? (
      <>
      {/* Header */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-900 via-[#1E5AA8] to-emerald-900 px-5 py-8 text-center text-white shadow-xl md:rounded-[3rem] md:py-10 md:shadow-2xl">
         <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
         <div className="relative z-10 flex flex-col items-center">
            <h2 className="mb-3 text-[10px] font-black uppercase tracking-[0.28em] text-emerald-300 opacity-80 md:mb-4 md:tracking-[0.4em]">Guided learning pathway</h2>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">{mission.topic}</h1>
            <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed text-white/70">
              Work through each stage calmly. Your tutor will review the thinking, not just the final answers.
            </p>
         </div>
      </div>

      {/* Stage 1: Recall Check */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-sm shadow-slate-200/50 md:rounded-[2rem] md:p-8 md:shadow-xl"
      >
        <div className="mb-5 flex items-center gap-4 md:mb-6">
           <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 md:h-12 md:w-12">
             <ShieldCheck size={24} />
           </div>
           <div>
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Stage 1</h3>
             <h2 className="text-xl font-black text-slate-800 md:text-2xl">{mission.stage1.title || "Recall Check"}</h2>
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
                      className={`text-left px-5 py-3 rounded-xl border text-sm font-semibold transition-all ${
                        isSelected 
                          ? "bg-sky-100 border-sky-400 text-sky-800 shadow-sm" 
                          : "bg-white border-slate-200 text-slate-600 hover:border-sky-300 hover:shadow-md"
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
      </motion.section>

      {/* Stage 2: Reasoning Practice */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-[1.5rem] bg-slate-900 p-5 text-white shadow-xl md:rounded-[2rem] md:p-8 md:shadow-2xl"
      >
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full" />
        <div className="relative z-10">
          <div className="mb-5 flex items-center gap-4 md:mb-6">
             <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-950 text-emerald-400 md:h-12 md:w-12">
               <Brain size={24} />
             </div>
             <div>
               <h3 className="text-xs font-black text-emerald-500/50 uppercase tracking-widest">Stage 2</h3>
               <h2 className="text-xl font-black text-white md:text-2xl">{mission.stage2.title || "Reasoning Practice"}</h2>
             </div>
          </div>
          <p className="rounded-2xl border border-white/5 bg-black/20 p-4 text-sm font-medium leading-relaxed text-slate-300 md:p-6 md:text-base">
            {mission.stage2.missionPrompt}
          </p>
          <textarea 
            value={s2Answer}
            onChange={(e) => setS2Answer(e.target.value)}
            className="w-full mt-6 bg-black/40 border border-white/10 rounded-2xl p-5 !text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
            rows={4}
            placeholder="Explain your reasoning here..."
          />
        </div>
      </motion.section>

      {/* Stage 3: Applied Understanding */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="relative overflow-hidden rounded-[1.5rem] bg-indigo-950 p-5 text-white shadow-xl md:rounded-[2rem] md:p-8 md:shadow-2xl"
      >
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-indigo-500/20 blur-3xl rounded-full" />
        <div className="relative z-10">
          <div className="mb-5 flex items-center gap-4 md:mb-6">
             <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-900 text-indigo-300 md:h-12 md:w-12">
                <Beaker size={24} />
             </div>
             <div>
               <h3 className="text-xs font-black text-indigo-400/50 uppercase tracking-widest">Stage 3</h3>
               <h2 className="text-xl font-black text-white md:text-2xl">{mission.stage3.title || "Applied Understanding"}</h2>
             </div>
          </div>
          <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-4 md:mb-6 md:p-6">
            <p className="text-xs font-black tracking-widest text-indigo-300 uppercase mb-3">Scenario Context</p>
            <p className="text-slate-300 leading-relaxed font-medium">{mission.stage3.scenarioContext}</p>
          </div>
          <h4 className="font-bold text-indigo-100 mb-4">{mission.stage3.question}</h4>
          <textarea 
            value={s3Answer}
            onChange={(e) => setS3Answer(e.target.value)}
            className="w-full bg-black/40 border border-indigo-500/50 rounded-2xl p-5 !text-white placeholder-indigo-400 focus:outline-none focus:border-indigo-400 transition-colors"
            rows={4}
            placeholder="Write your solution..."
          />
        </div>
      </motion.section>

      {/* Stage 4: Mastery Checkpoint */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="relative overflow-hidden rounded-[1.5rem] border border-cyan-500/15 bg-slate-950 p-5 text-white shadow-xl md:rounded-[2rem] md:p-8 md:shadow-2xl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent opacity-50" />
        <div className="relative z-10">
          <div className="mb-5 flex items-center gap-4 md:mb-6">
             <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-950/70 text-cyan-300 md:h-12 md:w-12">
                <CheckCircle2 size={24} />
             </div>
             <div>
               <h3 className="text-xs font-black text-cyan-300/70 uppercase tracking-widest">Final Stage</h3>
               <h2 className="text-xl font-black text-white md:text-2xl">{mission.stage4.title || "Mastery Checkpoint"}</h2>
             </div>
          </div>
          <p className="text-cyan-100/75 font-medium mb-6">{mission.stage4.missionPrompt}</p>
          
          <div className="bg-black/40 p-6 rounded-2xl border border-cyan-500/20 text-cyan-50 font-mono text-sm leading-relaxed tracking-tight relative mb-8">
             <div className="absolute -top-3 right-6 bg-cyan-500 text-slate-950 text-[9px] font-black tracking-widest px-3 py-1 rounded-full">REVIEW TEXT</div>
             "{mission.stage4.corruptedText}"
          </div>

          <div className="space-y-4">
             {mission.stage4.errors.map((err, idx) => (
                <div key={idx} className="flex flex-col md:flex-row gap-3">
                   <div className="flex-1 bg-red-900/40 border border-red-500/20 rounded-xl p-4 flex flex-col justify-center">
                     <p className="text-[10px] font-black text-red-400/50 uppercase tracking-wider mb-1">Check this part</p>
                     <p className="font-bold text-red-200 line-through decoration-red-500/50">{err.wrongWord}</p>
                   </div>
                   <div className="flex-1 bg-emerald-900/40 border border-emerald-500/20 rounded-xl p-4">
                     <p className="text-[10px] font-black text-emerald-400/50 uppercase tracking-wider mb-1">Your Correction</p>
                     <input 
                       value={s4Answers[idx] || ""}
                       onChange={(e) => setS4Answers(prev => ({ ...prev, [idx]: e.target.value }))}
                       className="w-full bg-transparent font-bold !text-white placeholder-emerald-900 border-none outline-none focus:ring-0" 
                       placeholder="Type correction here..."
                     />
                   </div>
                </div>
             ))}
          </div>

          <button 
            onClick={async () => {
                setIsEvaluating(true);
                try {
                    const res = await evaluateMission(missionId, s1Answers, s2Answer, s3Answer, s4Answers);
                    if (res.error) alert(res.error);
                    else {
                        setScoreAchieved(res.score || 0);
                        setIsSubmitted(true);
                    }
                } catch(e) {
                    console.error(e);
                }
                setIsEvaluating(false);
            }}
            disabled={isEvaluating}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#1E5AA8] py-4 font-black uppercase tracking-widest text-white shadow-xl shadow-slate-900/20 transition-all hover:bg-[#174a8b] disabled:opacity-50 md:mt-10 md:py-5"
          >
            {isEvaluating ? <Loader2 className="animate-spin" size={20} /> : null}
            {isEvaluating ? "Reviewing your responses..." : "Submit for Tutor Review"}
          </button>
        </div>
      </motion.section>
      </>
      ) : (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[3rem] p-12 text-center text-slate-800 shadow-2xl border border-emerald-100 relative overflow-hidden"
      >
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-100 via-transparent to-transparent opacity-80" />
         <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/20 mb-8">
               <ShieldCheck size={48} />
            </div>
            <h2 className="text-xl font-black text-emerald-600 uppercase tracking-[0.3em] mb-2">Practice Submitted</h2>
            <h1 className="text-5xl font-black tracking-tight mb-8 text-slate-900">{scoreAchieved}% completed</h1>
            
            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 w-full max-w-md mb-8">
               <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-slate-400">Status</span>
                  <span className="font-black text-xl text-amber-600">Tutor review next</span>
               </div>
            </div>

            <p className="text-slate-600 font-medium mb-10 max-w-lg leading-7">
              Well done. Your responses have been saved so your tutor can review your thinking, add guidance, and help decide the next recommended area.
            </p>

            <div className="inline-block px-8 py-3 bg-primary/10 rounded-full font-black text-primary mb-10">
               Confidence grows through clear next steps.
            </div>

            <div>
               <button 
                 onClick={() => onComplete && onComplete()}
                 className="px-10 py-5 bg-[#1E5AA8] text-white rounded-2xl font-black tracking-widest uppercase hover:bg-[#174a8b] transition-colors shadow-xl"
               >
                  Return to Learning Journeys
               </button>
            </div>
         </div>
      </motion.div>
      )}

    </div>
  );
}
