import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, FileText, Info, AlertTriangle, ExternalLink, Scissors, ShieldCheck, User, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import PrivateUploader from "./PrivateUploader";
import YouTubeLite from "@/components/YouTubeLite";

interface DemoSkillStageProps {
  data: any;
  userId: string;
  updateData: (fields: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function DemoSkillStage({ data, userId, updateData, onNext, onBack }: DemoSkillStageProps) {
  const [showInstructions, setShowInstructions] = useState(false);
  
  const isComplete = !!data.demo_video_url;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-4xl mx-auto space-y-12 pb-20"
    >
      <div className="space-y-4 text-center">
        <h2 className="text-5xl font-black text-navy tracking-tight leading-none">Skill Exhibition 📽️</h2>
        <p className="text-navy/60 font-medium italic text-lg leading-relaxed max-w-2xl mx-auto">"Teaching is the highest form of understanding. Show us your spark."</p>
      </div>

      <div className="space-y-16">
        {/* Step 1: Instructions */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-navy/5 border-2 border-navy/10 text-navy flex items-center justify-center font-black text-2xl shadow-sm">1</div>
            <h3 className="text-xl font-black text-navy uppercase tracking-tight">View instructions for the video</h3>
          </div>
          
          <div className="flex justify-start pl-14">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className={`flex items-center gap-3 px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest transition-all transform active:scale-95 shadow-xl ${
                showInstructions 
                  ? "bg-blue-50 text-navy border-2 border-blue-200 shadow-none" 
                  : "bg-white text-navy border-2 border-navy/5 hover:border-blue-500/30 hover:shadow-blue-500/10"
              }`}
            >
              <Sparkles size={18} className={showInstructions ? "text-blue-400" : "text-blue-500"} />
              {showInstructions ? "Hide Detailed Blueprint" : "Open Teaching Blueprint & Guidelines"}
              {showInstructions ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>

          <AnimatePresence>
            {showInstructions && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden pl-14"
              >
                <div className="bg-white/60 backdrop-blur-3xl border border-white p-12 rounded-[3.5rem] shadow-2xl space-y-12 text-left relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] translate-x-1/4 -translate-y-1/4">
                     <Video size={400} />
                  </div>

                  <div className="space-y-6 relative z-10">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                          <Video size={24} />
                        </div>
                        <h3 className="text-2xl font-black text-navy tracking-tight">Introduction & Teaching Demo</h3>
                     </div>
                     <p className="text-navy/70 text-lg font-bold leading-relaxed">Combine a brief introduction with your teaching demo. Record a **3–6 minute video** where you introduce yourself and explain a concept clearly.</p>
                  </div>

                  <div className="w-full h-px bg-navy/5" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                     <div className="space-y-4">
                        <h4 className="text-[11px] font-black text-navy/30 uppercase tracking-[0.3em]">🎯 What we're looking for</h4>
                        <ul className="space-y-3">
                           {["Clear explanation", "Step-by-step breakdown", "Engaging communication", "Ability to simplify"].map((item) => (
                             <li key={item} className="flex items-center gap-3 text-sm font-black text-navy/70">
                               <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/30" /> {item}
                             </li>
                           ))}
                        </ul>
                     </div>
                     <div className="space-y-4 bg-blue-50/50 p-6 rounded-[2.5rem] border border-blue-100/50">
                        <h4 className="text-[11px] font-black text-blue-600/40 uppercase tracking-[0.3em]">⏱️ Recommended structure</h4>
                        <div className="space-y-2 text-xs font-black text-blue-900/60 leading-relaxed italic">
                           <p>• Introduction (30–60s)</p>
                           <p>• Concept Explanation (2–3 minutes)</p>
                           <p>• Worked Example (1–2 minutes)</p>
                           <p>• Summary (30s)</p>
                        </div>
                     </div>
                  </div>

                  <div className="text-center italic text-navy/10 text-2xl font-serif">⸻</div>

                  {/* The 6-Step Blueprint */}
                  <div className="space-y-10 relative z-10">
                     {[
                       { n: "1", title: "Choose one topic", desc: "Select a concept relevant to your subject and level. (e.g. fractions, algebra, derivatives, forces, essay structure)." },
                       { n: "2", title: "Teach it simply", desc: "Explain as if the student is learning it for the first time. Use phrases like: \"Let's understand this step by step...\" or \"Think of it like this...\"" },
                       { n: "3", title: "Use visuals (Required)", desc: "Use a whiteboard (digital/physical), slides, or clear writing. Students learn with their eyes first." },
                       { n: "4", title: "Show an example", desc: "Include at least one worked example or application of the theory." },
                       { n: "5", title: "Keep it engaging", desc: "Speak clearly, maintain high energy, and avoid reading directly from notes. Be the Sensei you'd want to have." },
                       { n: "6", title: "Summary", desc: "Wrap up the key idea in 1–2 sentences." }
                     ].map((step) => (
                       <div key={step.n} className="flex gap-8 group">
                         <div className="shrink-0 w-10 h-10 rounded-full border-2 border-navy/5 flex items-center justify-center text-sm font-black text-navy/20 group-hover:border-blue-500 group-hover:text-blue-500 transition-all">{step.n}</div>
                         <div className="space-y-2">
                           <h5 className="font-black text-navy text-lg leading-none">{step.title}</h5>
                           <p className="text-sm font-bold text-navy/40 leading-relaxed">{step.desc}</p>
                         </div>
                       </div>
                     ))}
                  </div>

                  {/* Gold Standard */}
                  <div className="p-10 rounded-[3rem] bg-blue-50 border border-blue-100/50 text-navy space-y-8 shadow-xl relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-8 opacity-10 text-blue-500">
                       <ShieldCheck size={160} />
                     </div>
                     <div className="space-y-2 relative z-10">
                       <h4 className="flex items-center gap-2 text-xl font-black italic tracking-tight">⭐ The Dojo Gold Standard</h4>
                       <p className="text-navy/40 text-[10px] font-black uppercase tracking-[0.2em]">Our Application Evaluation Criteria</p>
                     </div>
                     <div className="space-y-6 relative z-10">
                        <p className="text-sm font-bold text-navy/70">We evaluate your demo based on:</p>
                        <div className="grid grid-cols-1 gap-4">
                           {[
                             { l: "Communication Clarity", d: "Can students easily understand you?" },
                             { l: "Visual Engagement", d: "Do you use visuals effectively?" },
                             { l: "Pedagogical Depth", d: "Do you explain the why, not just the how?" }
                           ].map((c) => (
                             <div key={c.l} className="flex items-start gap-3">
                               <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                               <p className="text-sm font-bold leading-tight">
                                 <span className="text-navy">{c.l}</span>
                                 <span className="text-navy/40 font-medium"> — {c.d}</span>
                               </p>
                             </div>
                           ))}
                        </div>
                        <div className="pt-4 border-t border-navy/5">
                           <p className="text-xs font-black italic text-blue-600">A strong demo may lead to direct shortlisting or fast-track onboarding.</p>
                        </div>
                     </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Step 2: Exhibition Link */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-navy/5 border-2 border-navy/10 text-navy flex items-center justify-center font-black text-2xl shadow-sm">2</div>
            <h3 className="text-xl font-black text-navy uppercase tracking-tight">Introduction and teaching demo</h3>
          </div>
          
          <div className="pl-14">
            <div className="bg-white/80 backdrop-blur-xl border border-white p-10 rounded-[3.5rem] shadow-2xl space-y-8 group max-w-2xl">
               <div className="space-y-6">
                  <div className="space-y-2">
                     <h4 className="text-lg font-black text-navy tracking-tight uppercase">Sharing Link</h4>
                     <p className="text-[10px] font-black text-navy/20 uppercase tracking-[0.2em]">YouTube or Vimeo Required (Include Intro + Demo)</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={data.demo_video_url || ""}
                        onChange={(e) => updateData({ demo_video_url: e.target.value })}
                        className="w-full bg-white border border-navy/5 rounded-[2.5rem] pl-20 pr-10 py-6 text-navy font-black focus:ring-4 focus:ring-blue-400/10 outline-none transition-all placeholder:text-navy/10 shadow-sm"
                      />
                      <div className="absolute left-8 top-1/2 -translate-y-1/2 text-navy/20">
                         <Video size={20} />
                      </div>
                    </div>

                    <div className="space-y-4">
                       <YouTubeLite url={data.demo_video_url} label="Preview Teaching Demo" />
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Step 3: Supplementary Zone */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-navy/5 border-2 border-navy/10 text-navy flex items-center justify-center font-black text-2xl shadow-sm">3</div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-navy uppercase tracking-tight leading-none">Supplementary zone</h3>
              <p className="text-[11px] font-bold text-navy/40 leading-relaxed italic">Upload any lesson materials that showcase your teaching style. This can include slides, worksheets, or structured lesson plans.</p>
            </div>
          </div>

          <div className="pl-14">
            <div className="max-w-2xl bg-white border border-navy/5 p-10 rounded-[3.5rem] shadow-2xl space-y-8">
               <div className="space-y-6">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-navy/30 uppercase tracking-[0.3em] ml-2">Lesson Handouts (Optional)</label>
                     <PrivateUploader 
                       userId={userId} 
                       docType="past_materials" 
                       label="Upload Slides / Plans"
                       onUploadSuccess={() => {}}
                     />
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex justify-between items-center pt-10 border-t border-navy/5">
        <button
          onClick={onBack}
          className="px-10 py-6 bg-white border border-navy/5 text-navy/40 hover:text-navy rounded-[2.5rem] font-black text-lg transition-all shadow-sm active:scale-95"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!isComplete}
          className={`px-16 py-6 rounded-[2.5rem] font-black text-xl tracking-tight transition-all transform active:scale-95 flex items-center justify-center gap-4 group relative overflow-hidden shadow-xl ${
            isComplete 
              ? "bg-blue-600 text-white hover:bg-blue-500 hover:shadow-2xl hover:shadow-blue-500/20 shadow-blue-900/10" 
              : "bg-blue-50 text-blue-200 cursor-not-allowed shadow-none grayscale opacity-60"
          }`}
        >
          <span className="relative z-10 flex items-center gap-3">
            Submit Exhibition →
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
