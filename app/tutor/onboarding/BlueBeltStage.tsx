"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import dynamic from "next/dynamic";
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as any;
import { Video, Lightbulb, Mic, Brush, Check, Tag, BookOpen } from "lucide-react";

interface BlueBeltStageProps {
  data: any;
  updateData: (fields: any) => void;
  onNext: () => void;
  onBack: () => void;
}

const TEACHING_STYLES = [
  "Visual Learner's Bestie",
  "Problem Solver",
  "Theory Expert",
  "Exam Strategy Pro",
  "Interactive & Dynamic",
  "Patient Mentor",
  "Fast-Paced Challenger"
];

export default function BlueBeltStage({ data, updateData, onNext, onBack }: BlueBeltStageProps) {
  const [youtubeUrl, setYoutubeUrl] = useState(data.youtube_url || "");
  const [teachingStyles, setTeachingStyles] = useState<string[]>(data.teaching_styles || []);

  const toggleStyle = (style: string) => {
    const newStyles = teachingStyles.includes(style)
      ? teachingStyles.filter((s) => s !== style)
      : [...teachingStyles, style];
    setTeachingStyles(newStyles);
    updateData({ teaching_styles: newStyles });
  };

  const isComplete = youtubeUrl && teachingStyles.length > 0 && data.teaching_philosophy?.length >= 50;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-navy tracking-tight">Blue Belt: Profile Studio 🎥</h2>
        <p className="text-navy/60 font-medium italic">"Your stage is ready. Show us your energy."</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
        <div className="lg:col-span-2 space-y-12">
          {/* YouTube Input & Preview */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-[11px] font-black text-navy/30 uppercase tracking-[0.2em] ml-6">
              <Video size={14} className="text-primary/40" /> Introduction Video (YouTube Link)
            </label>
            <div className="relative group">
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => {
                  setYoutubeUrl(e.target.value);
                  updateData({ youtube_url: e.target.value });
                }}
                className="w-full bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2.5rem] px-10 py-7 pl-18 text-navy font-bold focus:ring-4 focus:ring-mint/10 outline-none transition-all placeholder:text-navy/10 shadow-sm text-lg"
              />
              <Video className="absolute left-7 top-1/2 -translate-y-1/2 text-navy/10 group-focus-within:text-red-500 transition-all" size={28} />
            </div>

            {youtubeUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="aspect-video rounded-[3rem] overflow-hidden border-[12px] border-white/60 shadow-2xl bg-black relative"
              >
                <ReactPlayer
                  url={youtubeUrl}
                  width="100%"
                  height="100%"
                  controls
                />
              </motion.div>
            )}
          </div>

          {/* Teaching Styles */}
          <div className="space-y-6">
            <label className="flex items-center gap-2 text-[11px] font-black text-navy/30 uppercase tracking-[0.2em] ml-6">
              <Tag size={14} className="text-primary/40" /> Your Teaching Styles
            </label>
            <div className="flex flex-wrap gap-3 px-2">
              {TEACHING_STYLES.map((style) => (
                <button
                  key={style}
                  onClick={() => toggleStyle(style)}
                  className={`px-8 py-4 rounded-full font-black text-xs transition-all flex items-center gap-2 border-2 ${
                    teachingStyles.includes(style)
                      ? "bg-mint border-mint text-navy shadow-lg shadow-mint/20 scale-105"
                      : "bg-white/40 backdrop-blur-md border-white/60 text-navy/40 hover:bg-white/60 hover:text-navy"
                  }`}
                >
                  {teachingStyles.includes(style) && <Check size={16} strokeWidth={4} />}
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Teaching Philosophy */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-[11px] font-black text-navy/30 uppercase tracking-[0.2em] ml-6">
              <BookOpen size={14} className="text-primary/40" /> Teaching Philosophy (Min 50 chars)
            </label>
            <textarea
              rows={4}
              maxLength={500}
              placeholder="How do you make complex subjects simple? What's your secret sauce?"
              value={data.teaching_philosophy || ""}
              onChange={(e) => updateData({ teaching_philosophy: e.target.value })}
              className="w-full bg-white/80 backdrop-blur-xl border border-white/60 rounded-[3rem] px-10 py-8 text-navy font-bold focus:ring-4 focus:ring-mint/10 outline-none transition-all placeholder:text-navy/10 shadow-sm min-h-[200px] resize-none text-lg leading-relaxed"
            />
            <div className="flex justify-end pr-8">
              <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${data.teaching_philosophy?.length < 50 ? "text-red-400" : "text-navy/20"}`}>
                {data.teaching_philosophy?.length || 0} / 500
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar Guide */}
        <div className="space-y-6">
          <div className="p-10 rounded-[3rem] bg-navy text-mint shadow-2xl relative overflow-hidden group border border-white/10">
            <div className="absolute -top-10 -right-10 opacity-5 group-hover:opacity-10 transition-all duration-700">
              <Video size={200} />
            </div>
            <h3 className="text-xs font-black mb-10 relative z-10 flex items-center gap-3 uppercase tracking-[0.3em]">
              <span className="p-3 bg-mint/10 rounded-2xl"><Lightbulb size={24} className="text-mint" /></span>
              Studio Guide
            </h3>
            
            <div className="space-y-10 relative z-10 text-left">
              <div className="flex gap-5">
                <div className="w-12 h-12 shrink-0 rounded-2xl bg-mint/10 flex items-center justify-center border border-mint/20">
                  <Lightbulb size={24} className="text-mint" />
                </div>
                <div>
                  <h4 className="font-black text-sm uppercase tracking-tight">Bright Lighting</h4>
                  <p className="text-[11px] text-mint/60 leading-relaxed font-black uppercase tracking-tighter mt-1 opacity-80">Face a window for natural light. No backlighting!</p>
                </div>
              </div>

              <div className="flex gap-5">
                <div className="w-12 h-12 shrink-0 rounded-2xl bg-mint/10 flex items-center justify-center border border-mint/20">
                  <Mic size={24} className="text-mint" />
                </div>
                <div>
                  <h4 className="font-black text-sm uppercase tracking-tight">Crystal Audio</h4>
                  <p className="text-[11px] text-mint/60 leading-relaxed font-black uppercase tracking-tighter mt-1 opacity-80">Use a dedicated mic or quiet room. Avoid echos.</p>
                </div>
              </div>

              <div className="flex gap-5">
                <div className="w-12 h-12 shrink-0 rounded-2xl bg-mint/10 flex items-center justify-center border border-mint/20">
                  <Brush size={24} className="text-mint" />
                </div>
                <div>
                  <h4 className="font-black text-sm uppercase tracking-tight">Clean Backdrop</h4>
                  <p className="text-[11px] text-mint/60 leading-relaxed font-black uppercase tracking-tighter mt-1 opacity-80">Clear out laundry or messy shelves. Books are great!</p>
                </div>
              </div>
            </div>

            <div className="mt-10 p-5 rounded-2xl bg-mint/5 border border-mint/10 text-[10px] font-black uppercase tracking-[0.3em] text-center">
              Target length: 1-2 mins
            </div>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-white/40 backdrop-blur-md border border-white/60 shadow-xl text-center">
            <p className="text-[10px] font-black text-navy/40 uppercase tracking-[0.2em] mb-4">Need technical assistance?</p>
            <button className="text-xs font-black text-navy hover:text-mint transition-all underline decoration-mint decoration-2 underline-offset-[6px] uppercase tracking-widest">Creator Workshop →</button>
          </div>
        </div>
      </div>

      <div className="flex gap-6 mt-10">
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
              : "bg-blue-50 text-blue-200 cursor-not-allowed shadow-none grayscale opacity-60 font-black"
          }`}
        >
          <span className="relative z-10 flex items-center gap-3">
            Level Up to Black Belt
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
