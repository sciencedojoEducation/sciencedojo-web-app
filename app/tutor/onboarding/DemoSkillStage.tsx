"use client";

import { motion } from "framer-motion";
import { Video, FileText, Info, AlertTriangle, ExternalLink, Scissors } from "lucide-react";
import PrivateUploader from "./PrivateUploader";

interface DemoSkillStageProps {
  data: any;
  userId: string;
  updateData: (fields: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function DemoSkillStage({ data, userId, updateData, onNext, onBack }: DemoSkillStageProps) {
  
  const isYouTube = data.demo_video_url?.includes("youtube.com") || data.demo_video_url?.includes("youtu.be");
  const videoId = isYouTube ? (data.demo_video_url.includes("v=") ? data.demo_video_url.split("v=")[1].split("&")[0] : data.demo_video_url.split("/").pop()) : null;

  const isComplete = (data.demo_video_url || data.demo_pdf_url);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-12"
    >
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-4xl font-black text-navy tracking-tight">Skill Exhibition 📽️</h2>
        <p className="text-navy/60 font-medium italic">"Teaching is the highest form of understanding. Show us your spark."</p>
      </div>

      {/* Main Submission Zone */}
      <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-12 rounded-[3.5rem] shadow-2xl space-y-10">
        <div className="flex items-center gap-4 border-b border-navy/5 pb-8">
           <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg">
             <Video size={24} />
           </div>
           <div className="text-left">
             <h3 className="text-xl font-black text-navy uppercase tracking-tight">Teaching Demo</h3>
             <p className="text-[10px] font-black text-navy/30 uppercase tracking-[0.2em]">Required Submission (Video or PDF)</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Option A: Video */}
          <div className="space-y-6 text-left flex flex-col h-full">
             <div className="flex items-center gap-3 ml-2">
               <span className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center font-black text-xs">A</span>
               <h4 className="text-sm font-black text-navy">Video Link (Recommended)</h4>
             </div>
             <p className="text-[11px] font-bold text-navy/40 leading-relaxed px-2">A 2–5 minute clip of you explaining a complex concept. High energy and clarity are key.</p>
             <div className="space-y-4 mt-auto">
               <input
                 type="text"
                 placeholder="YouTube or Vimeo URL"
                 value={data.demo_video_url || ""}
                 onChange={(e) => updateData({ demo_video_url: e.target.value })}
                 className="w-full bg-white/80 border border-white/60 rounded-[2rem] px-8 py-5 text-navy font-bold focus:ring-4 focus:ring-blue-400/10 outline-none transition-all placeholder:text-navy/10 shadow-sm"
               />
               {videoId && (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="aspect-video w-full rounded-[2.5rem] overflow-hidden bg-black border-4 border-white shadow-2xl relative group"
                 >
                   <iframe 
                     src={`https://www.youtube.com/embed/${videoId}`}
                     className="w-full h-full"
                     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                     allowFullScreen
                   />
                 </motion.div>
               )}
             </div>
          </div>

          {/* Option B: PDF Explanation */}
          <div className="space-y-6 text-left flex flex-col h-full">
             <div className="flex items-center gap-3 ml-2">
               <span className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center font-black text-xs">B</span>
               <h4 className="text-sm font-black text-navy">Detailed Explanation PDF</h4>
             </div>
             <p className="text-[11px] font-bold text-navy/40 leading-relaxed px-2">If you cannot record video, provide a multi-page PDF lesson plan or resource breakdown.</p>
             <div className="mt-auto">
               <PrivateUploader 
                 userId={userId} 
                 docType="demo_explanation_pdf" 
                 label="Upload Lesson Sample"
                 onUploadSuccess={(url) => updateData({ demo_pdf_url: url })}
               />
             </div>
          </div>
        </div>
      </div>

      {/* Optional Materials */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="p-10 rounded-[3rem] border border-white/60 bg-white/40 space-y-6 text-left">
          <label className="flex items-center gap-2 text-[11px] font-black text-navy/30 uppercase tracking-[0.2em] ml-2">
            <ExternalLink size={16} /> Supporting Materials (Optional)
          </label>
          <div className="grid grid-cols-1 gap-4">
             <PrivateUploader 
               userId={userId} 
               docType="past_materials" 
               label="Past Lesson Plans / Slides"
               onUploadSuccess={(url) => updateData({ past_materials_url: url })}
             />
             <PrivateUploader 
               userId={userId} 
               docType="recorded_session" 
               label="Full Lesson Recording (ZIP/URL)"
               onUploadSuccess={(url) => updateData({ recorded_session_url: url })}
             />
          </div>
        </div>

        <div className="flex items-start gap-5 p-8 rounded-[3rem] bg-navy/5 border border-navy/10 text-left">
          <Info className="text-blue-500 shrink-0 mt-1" size={24} strokeWidth={3} />
          <div className="space-y-4">
            <p className="text-sm font-black text-navy uppercase tracking-tight">The Dojo Gold Standard</p>
            <p className="text-xs font-bold text-navy/50 leading-relaxed">
              We look for **Communication Clarity**, **Visual Engagement**, and **Pedagogical Depth**. A great demo often results in an immediate interview skip and direct onboarding.
            </p>
            <div className="bg-white/40 p-4 rounded-2xl flex items-center gap-3">
               <AlertTriangle className="text-red-400" size={16} />
               <span className="text-[10px] font-black uppercase text-red-500 tracking-widest leading-none">Ensure links are public / viewable</span>
            </div>
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
            Submit Exhibition
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
