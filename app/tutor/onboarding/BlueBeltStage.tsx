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
        <div className="lg:col-span-2 space-y-8">
          {/* YouTube Input & Preview */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-xs font-black text-navy/40 uppercase tracking-widest ml-2">
              <Video size={14} /> Introduction Video (YouTube Link)
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
                className="w-full p-5 pl-14 rounded-2xl border-2 border-navy/5 bg-white shadow-sm focus:border-mint focus:ring-4 focus:ring-mint/10 outline-none transition-all font-bold text-navy placeholder:text-navy/20"
              />
              <Video className="absolute left-5 top-1/2 -translate-y-1/2 text-navy/20 group-focus-within:text-red-500 transition-colors" size={24} />
            </div>

            {youtubeUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="aspect-video rounded-3xl overflow-hidden border-4 border-white shadow-2xl bg-black relative"
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
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-xs font-black text-navy/40 uppercase tracking-widest ml-2">
              <Tag size={14} /> Your Teaching Styles
            </label>
            <div className="flex flex-wrap gap-3">
              {TEACHING_STYLES.map((style) => (
                <button
                  key={style}
                  onClick={() => toggleStyle(style)}
                  className={`px-4 py-2 rounded-full font-bold text-sm transition-all flex items-center gap-2 border ${
                    teachingStyles.includes(style)
                      ? "bg-mint border-mint text-navy shadow-lg shadow-mint/20"
                      : "bg-white border-navy/5 text-navy/40 hover:border-navy/20"
                  }`}
                >
                  {teachingStyles.includes(style) && <Check size={14} />}
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Teaching Philosophy */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-xs font-black text-navy/40 uppercase tracking-widest ml-2">
              <BookOpen size={14} /> Teaching Philosophy (Min 50 chars)
            </label>
            <textarea
              rows={4}
              maxLength={500}
              placeholder="How do you make complex subjects simple? What's your secret sauce?"
              value={data.teaching_philosophy || ""}
              onChange={(e) => updateData({ teaching_philosophy: e.target.value })}
              className="w-full p-5 rounded-2xl border-2 border-navy/5 bg-white shadow-inner focus:border-mint focus:ring-4 focus:ring-mint/10 outline-none transition-all font-medium text-navy placeholder:text-navy/20 resize-none"
            />
            <div className="flex justify-end">
              <span className={`text-[10px] font-black uppercase tracking-widest ${data.teaching_philosophy?.length < 50 ? "text-red-400" : "text-navy/20"}`}>
                {data.teaching_philosophy?.length || 0} / 500
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar Guide */}
        <div className="space-y-6">
          <div className="p-8 rounded-[2.5rem] bg-navy text-mint shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Video size={120} />
            </div>
            <h3 className="text-xl font-black mb-6 relative z-10 flex items-center gap-2">
              <span className="p-2 bg-mint/10 rounded-lg"><Lightbulb size={20} /></span>
              Studio Guide
            </h3>
            
            <div className="space-y-6 relative z-10">
              <div className="flex gap-4">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-mint/10 flex items-center justify-center border border-mint/20">
                  <Lightbulb size={18} className="text-mint" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Bright Lighting</h4>
                  <p className="text-xs text-mint/60 leading-relaxed font-medium">Face a window for natural light. No backlighting!</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-mint/10 flex items-center justify-center border border-mint/20">
                  <Mic size={18} className="text-mint" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Crystal Audio</h4>
                  <p className="text-xs text-mint/60 leading-relaxed font-medium">Use a dedicated mic or quiet room. Avoid echos.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-mint/10 flex items-center justify-center border border-mint/20">
                  <Brush size={18} className="text-mint" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Clean Backdrop</h4>
                  <p className="text-xs text-mint/60 leading-relaxed font-medium">Clear out laundry or messy shelves. Books are great!</p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 rounded-2xl bg-mint/5 border border-mint/10 text-[10px] font-black uppercase tracking-[0.2em] text-center">
              Target length: 1-2 mins
            </div>
          </div>

          <div className="p-6 rounded-[2rem] bg-white border border-navy/5 shadow-xl text-center">
            <p className="text-xs font-bold text-navy/40">Need help? Join our</p>
            <button className="text-sm font-black text-navy hover:text-mint transition-colors underline decoration-mint decoration-2 underline-offset-4">Creator Workshop →</button>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="px-8 py-5 bg-white border border-navy/10 text-navy/40 hover:text-navy rounded-[2rem] font-black text-lg transition-all"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!isComplete}
          className="flex-1 py-5 bg-navy hover:bg-black text-mint rounded-[2rem] font-black text-lg tracking-tight shadow-2xl shadow-navy/20 transition-all disabled:opacity-50 disabled:grayscale transform active:scale-95 flex items-center justify-center gap-2 group"
        >
          Level Up to Black Belt
          <motion.span animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            →
          </motion.span>
        </button>
      </div>
    </motion.div>
  );
}
