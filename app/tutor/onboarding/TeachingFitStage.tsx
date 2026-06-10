"use client";

import { motion } from "framer-motion";
import { Heart, Brain, Zap, Target, BookOpen } from "lucide-react";

interface TeachingFitStageProps {
  data: any;
  updateData: (fields: any) => void;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft: () => void;
  isSavingDraft: boolean;
}

export default function TeachingFitStage({ data, updateData, onNext, onBack, onSaveDraft, isSavingDraft }: TeachingFitStageProps) {
  
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
      className="rounded-[1.75rem] border border-blue-100 bg-white/92 p-5 shadow-xl shadow-navy/5 backdrop-blur-xl sm:p-7 md:p-10"
    >
      <div className="space-y-2 text-left">
        <p className="text-sm font-black text-primary">Step 3 of 6</p>
        <h2 className="text-2xl font-black tracking-tight text-navy md:text-3xl">Teaching Style</h2>
        <p className="text-sm font-medium text-navy/60 md:text-base">Help us understand how you support students during real lessons.</p>
      </div>

      <div className="mt-8 space-y-8">
        {/* Teaching Style Grid */}
        <div className="space-y-6 text-left">
          <label className="flex items-center gap-2 text-xs font-bold text-navy/55">
             Primary teaching approach
          </label>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {styles.map((s) => (
              <button
                key={s.id}
                onClick={() => updateData({ teaching_style: s.id })}
                className={`flex flex-col items-center gap-4 rounded-[1.5rem] border p-5 text-center transition-all active:scale-95 ${
                  data.teaching_style === s.id
                    ? "border-primary bg-primary/5 text-navy shadow-sm"
                    : "border-navy/10 bg-white text-navy/45 hover:border-primary/30 hover:text-navy"
                }`}
              >
                 <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all ${data.teaching_style === s.id ? "bg-primary text-white shadow-blue-500/20" : "bg-navy/5 text-navy/40"}`}>
                   {s.icon}
                 </div>
                 <div className="space-y-1">
                   <p className="text-base font-bold text-navy">{s.label}</p>
                   <p className="text-xs font-semibold text-navy/40">{s.desc}</p>
                 </div>
              </button>
            ))}
          </div>
        </div>

        {/* Deep Analysis Questions */}
        <div className="grid grid-cols-1 gap-6 pt-2">
          <div className="space-y-4 text-left">
            <label className="flex items-center gap-2 text-xs font-bold text-navy/55">
               Supporting students
            </label>
            <p className="mb-4 text-sm font-medium text-navy/45">How do you support students who are falling behind or struggling with fundamentals?</p>
            <textarea
              placeholder="Describe your step-by-step approach to identifying and filling knowledge gaps..."
              value={data.weak_student_approach || ""}
              onChange={(e) => updateData({ weak_student_approach: e.target.value })}
              className="min-h-[130px] w-full rounded-2xl border border-navy/10 bg-white px-5 py-4 text-base font-semibold text-navy shadow-sm outline-none transition-all placeholder:text-navy/25 focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div className="space-y-4 text-left">
            <label className="flex items-center gap-2 text-xs font-bold text-navy/55">
               Re-engaging students
            </label>
            <p className="mb-4 text-sm font-medium text-navy/45">Describe a technique you use when a student loses focus or motivation during a lesson.</p>
            <textarea
              placeholder="Active recall, real-world analogies, gamification..."
              value={data.disengagement_approach || ""}
              onChange={(e) => updateData({ disengagement_approach: e.target.value })}
              className="min-h-[130px] w-full rounded-2xl border border-navy/10 bg-white px-5 py-4 text-base font-semibold text-navy shadow-sm outline-none transition-all placeholder:text-navy/25 focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div className="space-y-4 rounded-[1.5rem] border border-navy/8 bg-slate-50/70 p-5 text-left md:p-6">
            <label className="flex items-center gap-2 text-xs font-bold text-navy/55">
               <Heart size={16} className="text-red-400" /> Core Drive & Motivation
            </label>
            <p className="mb-4 text-sm font-medium text-navy/45">Beyond the subject matter, why do you choose to teach? What impact do you hope to make?</p>
            <textarea
              placeholder="Share your personal philosophy and long-term goals as an educator..."
              value={data.motivation || ""}
              onChange={(e) => updateData({ motivation: e.target.value })}
              className="min-h-[140px] w-full rounded-2xl border border-navy/10 bg-white px-5 py-4 text-base font-semibold text-navy shadow-sm outline-none transition-all placeholder:text-navy/25 focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4 border-t border-navy/8 pt-6 md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-semibold text-navy/55">You can save and continue later</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button onClick={onBack} className="min-h-11 rounded-xl border border-navy/10 bg-white px-5 py-3 text-sm font-bold text-navy/65 transition-colors hover:border-primary/30 hover:text-navy">Back</button>
          <button onClick={onSaveDraft} disabled={isSavingDraft} className="min-h-11 rounded-xl border border-navy/10 bg-white px-5 py-3 text-sm font-bold text-navy/65 transition-colors hover:border-primary/30 hover:text-navy disabled:opacity-60">{isSavingDraft ? "Saving..." : "Save Draft"}</button>
          <button onClick={onNext} disabled={!isComplete} className={`min-h-11 rounded-xl px-6 py-3 text-sm font-black transition-all active:scale-95 ${isComplete ? "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-blue-500" : "cursor-not-allowed bg-blue-50 text-blue-200"}`}>
            Next step →
          </button>
        </div>
      </div>
    </motion.div>
  );
}
