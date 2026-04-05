"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Brain, Beaker, Bug } from "lucide-react";

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

export default function MissionViewer({ mission }: { mission: MissionData }) {
  const [activeStage, setActiveStage] = useState(1);
  const [s1Answers, setS1Answers] = useState<Record<number, number>>({});
  
  // Controlled fields for user input
  const [s2Answer, setS2Answer] = useState("");
  const [s3Answer, setS3Answer] = useState("");
  const [s4Answers, setS4Answers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Minimal checks
  const s1Complete = Object.keys(s1Answers).length === mission.stage1.questions.length;

  return (
    <div className="space-y-8 pb-20">
      
      {!isSubmitted ? (
      <>
      {/* Header */}
      <div className="text-center py-10 bg-gradient-to-br from-indigo-900 via-[#1E5AA8] to-emerald-900 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
         <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
         <div className="relative z-10 flex flex-col items-center">
            <h2 className="text-[10px] font-black tracking-[0.4em] uppercase text-emerald-300 mb-4 opacity-80">AI Mastery Mission</h2>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">{mission.topic}</h1>
         </div>
      </div>

      {/* Stage 1: The Scout */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50"
      >
        <div className="flex items-center gap-4 mb-6">
           <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center">
              <ShieldCheck size={24} />
           </div>
           <div>
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Stage 1</h3>
             <h2 className="text-2xl font-black text-slate-800">{mission.stage1.title || "The Scout"}</h2>
           </div>
        </div>

        <div className="space-y-8">
          {mission.stage1.questions.map((q, i) => (
            <div key={i} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
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

      {/* Stage 2 & 3 & 4 (Blurred out until Stage 1 is interacted with or just shown?) */}
      {/* For simplicity, we just show them with escalating aesthetic logic */}
      
      {/* Stage 2: The Specialist */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-slate-900 text-white rounded-[2rem] p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
             <div className="w-12 h-12 bg-emerald-950 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                <Brain size={24} />
             </div>
             <div>
               <h3 className="text-xs font-black text-emerald-500/50 uppercase tracking-widest">Stage 2</h3>
               <h2 className="text-2xl font-black text-white">{mission.stage2.title || "The Specialist"}</h2>
             </div>
          </div>
          <p className="text-slate-300 font-medium leading-relaxed bg-black/20 p-6 rounded-2xl border border-white/5">
            {mission.stage2.missionPrompt}
          </p>
          <textarea 
            value={s2Answer}
            onChange={(e) => setS2Answer(e.target.value)}
            className="w-full mt-6 bg-black/40 border border-white/10 rounded-2xl p-5 !text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
            rows={4}
            placeholder="Type your logical reasoning here..."
          />
        </div>
      </motion.section>

      {/* Stage 3: The Architect */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-indigo-950 text-white rounded-[2rem] p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-indigo-500/20 blur-3xl rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
             <div className="w-12 h-12 bg-indigo-900 border border-indigo-500/30 text-indigo-300 rounded-2xl flex items-center justify-center">
                <Beaker size={24} />
             </div>
             <div>
               <h3 className="text-xs font-black text-indigo-400/50 uppercase tracking-widest">Stage 3</h3>
               <h2 className="text-2xl font-black text-white">{mission.stage3.title || "The Architect"}</h2>
             </div>
          </div>
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-6">
            <p className="text-xs font-black tracking-widest text-indigo-300 uppercase mb-3">Scenario Context</p>
            <p className="text-slate-300 leading-relaxed font-medium">{mission.stage3.scenarioContext}</p>
          </div>
          <h4 className="font-bold text-indigo-100 mb-4">{mission.stage3.question}</h4>
          <textarea 
            value={s3Answer}
            onChange={(e) => setS3Answer(e.target.value)}
            className="w-full bg-black/40 border border-indigo-500/50 rounded-2xl p-5 !text-white placeholder-indigo-400 focus:outline-none focus:border-indigo-400 transition-colors"
            rows={4}
            placeholder="Build your solution..."
          />
        </div>
      </motion.section>

      {/* Stage 4: The Master */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-red-950 text-white rounded-[2rem] p-8 shadow-2xl relative overflow-hidden border border-red-500/20"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-500/10 via-transparent to-transparent opacity-50" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
             <div className="w-12 h-12 bg-red-900/50 border border-red-500/50 text-red-400 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(248,113,113,0.3)]">
                <Bug size={24} />
             </div>
             <div>
               <h3 className="text-xs font-black text-red-500/70 uppercase tracking-widest">Final Stage</h3>
               <h2 className="text-2xl font-black text-white">{mission.stage4.title || "The Master"}</h2>
             </div>
          </div>
          <p className="text-red-200/80 font-medium mb-6">{mission.stage4.missionPrompt}</p>
          
          <div className="bg-black/40 p-6 rounded-2xl border border-red-500/20 text-red-100 font-mono text-sm leading-relaxed tracking-tight relative mb-8">
             <div className="absolute -top-3 right-6 bg-red-500 text-white text-[9px] font-black tracking-widest px-3 py-1 rounded-full shadow-lg shadow-red-500/50">CORRUPTED DATA</div>
             "{mission.stage4.corruptedText}"
          </div>

          <div className="space-y-4">
             {mission.stage4.errors.map((err, idx) => (
                <div key={idx} className="flex flex-col md:flex-row gap-3">
                   <div className="flex-1 bg-red-900/40 border border-red-500/20 rounded-xl p-4 flex flex-col justify-center">
                     <p className="text-[10px] font-black text-red-400/50 uppercase tracking-wider mb-1">Target Error</p>
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
            onClick={() => setIsSubmitted(true)}
            className="w-full mt-10 py-5 rounded-2xl bg-gradient-to-r from-red-600 to-[#1E5AA8] hover:shadow-[0_0_30px_rgba(30,90,168,0.4)] text-white font-black tracking-widest uppercase transition-all shadow-xl shadow-red-900/20"
          >
            Submit Final Mission
          </button>
        </div>
      </motion.section>
      </>
      ) : (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 rounded-[3rem] p-12 text-center text-white shadow-2xl border border-emerald-500/30 relative overflow-hidden"
      >
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent opacity-50" />
         <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.6)] mb-8">
               <ShieldCheck size={48} />
            </div>
            <h2 className="text-xl font-black text-emerald-400 uppercase tracking-[0.3em] mb-2">Operation Successful</h2>
            <h1 className="text-5xl font-black tracking-tight mb-8">Topic Master</h1>
            
            <div className="bg-black/40 border border-white/10 rounded-3xl p-8 w-full max-w-md mb-8">
               <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-slate-400">Recall Score (Stage 1)</span>
                  <span className="font-black text-2xl text-emerald-300">
                    {Object.keys(s1Answers).reduce((acc, idx) => {
                       const numIdx = Number(idx);
                       return acc + (s1Answers[numIdx] === mission.stage1.questions[numIdx].correctIndex ? 1 : 0);
                    }, 0)} / {mission.stage1.questions.length}
                  </span>
               </div>
               <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-slate-400">Critical Analysis</span>
                  <span className="font-black text-xl text-sky-300">Logged</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-400">Data Correction</span>
                  <span className="font-black text-xl text-indigo-300">Submitted</span>
               </div>
            </div>

            <p className="text-emerald-100/70 font-medium mb-10 max-w-lg">
              Excellent work! Your logical framework and error correction sequences have been securely logged. Your Sensei will review your architectural blueprints.
            </p>

            <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black px-8 py-3 rounded-full text-sm tracking-widest shadow-lg shadow-orange-500/30">
               +500 XP EARNED
            </div>
         </div>
      </motion.div>
      )}

    </div>
  );
}
