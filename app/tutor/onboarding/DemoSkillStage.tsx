import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, ShieldCheck, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import PrivateUploader from "./PrivateUploader";
import YouTubeLite from "@/components/YouTubeLite";

interface DemoSkillStageData {
  demo_video_url?: string;
}

interface DemoSkillStageProps {
  data: DemoSkillStageData;
  userId: string;
  updateData: (fields: Partial<DemoSkillStageData>) => void;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft: () => void;
  isSavingDraft: boolean;
}

export default function DemoSkillStage({ data, userId, updateData, onNext, onBack, onSaveDraft, isSavingDraft }: DemoSkillStageProps) {
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="rounded-[1.75rem] border border-blue-100 bg-white/92 p-5 shadow-xl shadow-navy/5 backdrop-blur-xl sm:p-7 md:p-10"
    >
      <div className="space-y-2 text-left">
        <p className="text-sm font-black text-primary">Step 4 of 6</p>
        <h2 className="text-2xl font-black tracking-tight text-navy md:text-3xl">Demo Lesson</h2>
        <p className="text-sm font-medium text-navy/60 md:text-base">Add a short teaching demo now, or continue and share it later.</p>
      </div>

      <div className="mt-8 space-y-8">
        {/* Step 1: Instructions */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-navy/10 bg-white text-sm font-black text-navy shadow-sm">1</div>
            <h3 className="text-lg font-black text-navy">View instructions for the video</h3>
          </div>
          
          <div className="flex justify-start md:pl-12">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className={`flex items-center gap-3 rounded-xl border px-5 py-3 text-sm font-bold transition-all active:scale-95 ${
                showInstructions 
                  ? "border-blue-200 bg-blue-50 text-navy" 
                  : "border-navy/10 bg-white text-navy hover:border-blue-500/30"
              }`}
            >
              <Sparkles size={18} className={showInstructions ? "text-blue-400" : "text-blue-500"} />
              {showInstructions ? "Hide guidelines" : "Open teaching demo guidelines"}
              {showInstructions ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>

          <AnimatePresence>
            {showInstructions && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden md:pl-12"
              >
                <div className="relative space-y-8 overflow-hidden rounded-[1.5rem] border border-navy/8 bg-slate-50/80 p-5 text-left md:p-6">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] translate-x-1/4 -translate-y-1/4">
                     <Video size={400} />
                  </div>

                  <div className="space-y-6 relative z-10">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                          <Video size={24} />
                        </div>
                        <h3 className="text-xl font-black tracking-tight text-navy">Introduction & teaching demo</h3>
                     </div>
                     <p className="text-sm font-semibold leading-relaxed text-navy/65">Combine a brief introduction with your teaching demo. Record a 3-6 minute video where you introduce yourself and explain a concept clearly. Upload it to YouTube as an unlisted video if you do not want it suggested publicly; only people with the link will be able to view it.</p>
                  </div>

                  <div className="w-full h-px bg-navy/5" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                     <div className="space-y-4">
                        <h4 className="text-xs font-bold text-navy/55">What we&apos;re looking for</h4>
                        <ul className="space-y-3">
                           {["Clear explanation", "Step-by-step breakdown", "Engaging communication", "Ability to simplify"].map((item) => (
                             <li key={item} className="flex items-center gap-3 text-sm font-black text-navy/70">
                               <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/30" /> {item}
                             </li>
                           ))}
                        </ul>
                     </div>
                     <div className="space-y-4 rounded-[1.25rem] border border-blue-100/50 bg-blue-50/50 p-5">
                        <h4 className="text-xs font-bold text-blue-700/60">Recommended structure</h4>
                        <div className="space-y-2 text-xs font-black text-blue-900/60 leading-relaxed italic">
                           <p>• Introduction (30–60s)</p>
                           <p>• Concept Explanation (2–3 minutes)</p>
                           <p>• Worked Example (1–2 minutes)</p>
                           <p>• Summary (30s)</p>
                        </div>
                     </div>
                  </div>

                  <div className="text-center italic text-navy/10 text-2xl font-serif">⸻</div>

                  {/* The 6-step guide */}
                  <div className="space-y-10 relative z-10">
                     {[
                       { n: "1", title: "Choose one topic", desc: "Select a concept relevant to your subject and level. (e.g. fractions, algebra, derivatives, forces, essay structure)." },
                       { n: "2", title: "Teach it simply", desc: "Explain as if the student is learning it for the first time. Use phrases like: \"Let's understand this step by step...\" or \"Think of it like this...\"" },
                       { n: "3", title: "Use visuals (Required)", desc: "Use a whiteboard (digital/physical), slides, or clear writing. Students learn with their eyes first." },
                       { n: "4", title: "Show an example", desc: "Include at least one worked example or application of the theory." },
                       { n: "5", title: "Keep it engaging", desc: "Speak clearly, maintain steady energy, and avoid reading directly from notes. Be the tutor you would want to learn from." },
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

                  {/* Review criteria */}
                  <div className="relative space-y-6 overflow-hidden rounded-[1.5rem] border border-blue-100/50 bg-blue-50 p-5 text-navy md:p-6">
                     <div className="absolute top-0 right-0 p-8 opacity-10 text-blue-500">
                       <ShieldCheck size={160} />
                     </div>
                     <div className="space-y-2 relative z-10">
                       <h4 className="flex items-center gap-2 text-lg font-black tracking-tight">What we review</h4>
                       <p className="text-xs font-bold text-navy/40">Our application evaluation criteria</p>
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
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-navy/10 bg-white text-sm font-black text-navy shadow-sm">2</div>
            <h3 className="text-lg font-black text-navy">Introduction and teaching demo</h3>
          </div>
          
          <div className="md:pl-12">
            <div className="max-w-2xl space-y-8 rounded-[1.5rem] border border-navy/8 bg-white p-5 shadow-sm md:p-6">
               <div className="space-y-6">
                  <div className="space-y-2">
                     <h4 className="text-lg font-black tracking-tight text-navy">Sharing Link</h4>
                     <p className="text-xs font-bold text-navy/40">Optional YouTube or Vimeo link with introduction and demo</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={data.demo_video_url || ""}
                        onChange={(e) => updateData({ demo_video_url: e.target.value })}
                        className="w-full rounded-2xl border border-navy/10 bg-white py-4 pl-14 pr-5 text-base font-semibold text-navy shadow-sm outline-none transition-all placeholder:text-navy/25 focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                      />
                      <div className="absolute left-8 top-1/2 -translate-y-1/2 text-navy/20">
                         <Video size={20} />
                      </div>
                    </div>

                    <div className="space-y-4">
                       <YouTubeLite url={data.demo_video_url || ""} label="Preview Teaching Demo" />
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Step 3: Supplementary Zone */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-navy/10 bg-white text-sm font-black text-navy shadow-sm">3</div>
            <div className="space-y-1">
              <h3 className="text-lg font-black leading-none text-navy">Supplementary materials</h3>
              <p className="text-sm font-medium leading-relaxed text-navy/45">Upload any lesson materials that showcase your teaching style. This can include slides, worksheets, or structured lesson plans.</p>
            </div>
          </div>

          <div className="md:pl-12">
            <div className="max-w-2xl space-y-8 rounded-[1.5rem] border border-navy/8 bg-white p-5 shadow-sm md:p-6">
               <div className="space-y-6">
                  <div className="space-y-4">
                     <label className="text-xs font-bold text-navy/55">Lesson handouts (optional)</label>
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
      <div className="mt-8 flex flex-col gap-4 border-t border-navy/8 pt-6 md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-semibold text-navy/55">You can save and continue later</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button onClick={onBack} className="min-h-11 rounded-xl border border-navy/10 bg-white px-5 py-3 text-sm font-bold text-navy/65 transition-colors hover:border-primary/30 hover:text-navy">Back</button>
          <button onClick={onSaveDraft} disabled={isSavingDraft} className="min-h-11 rounded-xl border border-navy/10 bg-white px-5 py-3 text-sm font-bold text-navy/65 transition-colors hover:border-primary/30 hover:text-navy disabled:opacity-60">{isSavingDraft ? "Saving..." : "Save Draft"}</button>
          <button onClick={onNext} className="min-h-11 rounded-xl bg-primary px-6 py-3 text-sm font-black text-white shadow-lg shadow-primary/20 transition-all hover:bg-blue-500 active:scale-95">
            {data.demo_video_url ? "Next step →" : "Skip for now →"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
