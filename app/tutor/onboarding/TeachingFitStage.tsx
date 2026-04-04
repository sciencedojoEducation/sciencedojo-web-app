"use client";

import { motion } from "framer-motion";
import { Heart, Brain, Zap, Target, BookOpen } from "lucide-react";

interface TeachingFitStageProps {
  data: any;
  updateData: (fields: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function TeachingFitStage({ data, updateData, onNext, onBack }: TeachingFitStageProps) {
  
  const styles = [
    { id: "concept", label: "Concept-Based", desc: "First-principles approach", icon: <Brain size={18} /> },
    { id: "exam", label: "Exam-Focused", desc: "Strategy & spec mastery", icon: <Target size={18} /> },
    { id: "hybrid", label: "Hybrid / Adaptive", desc: "Fluid custom balance", icon: <Zap size={18} /> }
  ];

  const isComplete = 
    data.teaching_style && 
    data.weak_student_approach && 
    data.motivation && 
    data.disengagement_approach;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-10"
    >
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-4xl font-black text-navy tracking-tight">Teaching Philosophy 🧠</h2>
        <p className="text-navy/60 font-medium italic">"Methodology defines the distance between knowledge and understanding."</p>
      </div>

      <div className="space-y-10">
        {/* Teaching Style Grid */}
        <div className="space-y-6 text-left">
          <label className="flex items-center gap-2 text-[11px] font-black text-navy/30 uppercase tracking-[0.2em] ml-6">
             Primary Methodology
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {styles.map((s) => (
              <button
                key={s.id}
                onClick={() => updateData({ teaching_style: s.id })}
                className={`p-10 rounded-[3rem] border-4 transition-all flex flex-col items-center gap-4 group text-center transform active:scale-95 ${
                  data.teaching_style === s.id
                    ? "border-navy bg-white shadow-xl scale-[1.02]"
                    : "border-transparent bg-white text-navy/30 shadow-2xl shadow-navy/10 hover:bg-white/80"
                }`}
              >
                 <div className={`w-14 h-14 rounded-2xl transition-all flex items-center justify-center shadow-sm ${data.teaching_style === s.id ? "bg-blue-600 text-white shadow-blue-500/20 scale-110" : "bg-navy/5 text-navy/40 grayscale group-hover:grayscale-0 group-hover:bg-navy/10"}`}>
                   {s.icon}
                 </div>
                 <div className="space-y-1">
                   <p className="font-bold text-navy text-lg">{s.label}</p>
                   <p className="text-[10px] font-black uppercase text-navy/20 tracking-widest">{s.desc}</p>
                 </div>
              </button>
            ))}
          </div>
        </div>

        {/* Deep Analysis Questions */}
        <div className="grid grid-cols-1 gap-12 pt-4">
          <div className="space-y-4 text-left">
            <label className="flex items-center gap-2 text-[11px] font-black text-navy/30 uppercase tracking-[0.2em] ml-6">
               Scaffolding Strategy
            </label>
            <p className="text-[11px] font-bold text-navy/40 italic ml-6 mb-4">"How do you handle students who are consistently falling behind or struggle with fundamentals?"</p>
            <textarea
              placeholder="Describe your step-by-step approach to identifying and filling knowledge gaps..."
              value={data.weak_student_approach || ""}
              onChange={(e) => updateData({ weak_student_approach: e.target.value })}
              className="w-full bg-white/80 backdrop-blur-xl border border-white/60 rounded-[3rem] px-10 py-8 text-navy font-bold focus:ring-4 focus:ring-blue-400/10 outline-none transition-all placeholder:text-navy/10 shadow-sm min-h-[140px]"
            />
          </div>

          <div className="space-y-4 text-left border-l-4 border-blue-500/10 pl-8">
            <label className="flex items-center gap-2 text-[11px] font-black text-navy/30 uppercase tracking-[0.2em]">
               Engagement Protocol
            </label>
            <p className="text-[11px] font-bold text-navy/40 italic mb-4">"Describe a technique you use to re-engage a student who has lost focus or motivation during a lesson."</p>
            <textarea
              placeholder="Active recall, real-world analogies, gamification..."
              value={data.disengagement_approach || ""}
              onChange={(e) => updateData({ disengagement_approach: e.target.value })}
              className="w-full bg-white/80 backdrop-blur-xl border border-white/60 rounded-[3rem] px-10 py-8 text-navy font-bold focus:ring-4 focus:ring-blue-400/10 outline-none transition-all placeholder:text-navy/10 shadow-sm min-h-[140px]"
            />
          </div>

          <div className="space-y-4 text-left bg-navy/5 p-12 rounded-[4rem]">
            <label className="flex items-center gap-2 text-[11px] font-black text-navy/30 uppercase tracking-[0.2em] ml-2">
               <Heart size={16} className="text-red-400" /> Core Drive & Motivation
            </label>
            <p className="text-[11px] font-bold text-navy/40 italic ml-2 mb-4">"Beyond the subject matter, why do you choose to teach? What is the ScienceDojo impact you aim to make?"</p>
            <textarea
              placeholder="Share your personal philosophy and long-term goals as an educator..."
              value={data.motivation || ""}
              onChange={(e) => updateData({ motivation: e.target.value })}
              className="w-full bg-white border border-white/60 rounded-[3rem] px-10 py-8 text-navy font-bold focus:ring-4 focus:ring-blue-400/10 outline-none transition-all placeholder:text-navy/10 shadow-lg min-h-[160px]"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-6 pt-4">
        <button
          onClick={onBack}
          className="px-10 py-6 bg-white/40 backdrop-blur-md border border-white/60 text-navy/40 hover:text-navy hover:bg-white/60 rounded-[2.5rem] font-black text-lg transition-all shadow-sm active:scale-95"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!isComplete}
          className={`flex-1 py-6 rounded-[2.5rem] font-black text-xl tracking-tight transition-all transform active:scale-95 flex items-center justify-center gap-4 group relative overflow-hidden shadow-xl ${
            isComplete 
              ? "bg-blue-600 text-white hover:bg-blue-500 hover:shadow-2xl hover:shadow-blue-500/20 shadow-blue-900/10" 
              : "bg-blue-50 text-blue-200 cursor-not-allowed shadow-none grayscale opacity-60"
          }`}
        >
          <span className="relative z-10 flex items-center gap-3">
            Solidify Philosophy
            <motion.span 
              animate={isComplete ? { x: [0, 10, 0] } : {}} 
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              →
            </motion.span>
          </span>
          {isComplete && (
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
            />
          )}
        </button>
      </div>
    </motion.div>
  );
}
