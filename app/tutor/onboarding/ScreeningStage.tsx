"use client";

import { motion } from "framer-motion";
import { Globe, User, Mail, Phone, MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface ScreeningStageProps {
  data: any;
  userId: string;
  updateData: (fields: any) => void;
  onNext: () => void;
}

export default function ScreeningStage({ data, updateData, onNext }: ScreeningStageProps) {
  const [timezone, setTimezone] = useState(data.timezone || "");

  useEffect(() => {
    if (!data.timezone) {
      const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setTimezone(detectedTimezone);
      updateData({ timezone: detectedTimezone });
    }
  }, []);

  const isComplete = 
    data.full_name && 
    data.phone && 
    data.online_available && 
    data.prior_experience &&
    data.subjects &&
    data.levels;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-10"
    >
      <div className="space-y-4 text-center md:text-left">
        <h2 className="text-4xl font-black text-navy tracking-tighter">Initial Screening 🥋</h2>
        <p className="text-navy/60 font-medium italic">"The journey of a thousand students begins with a single step."</p>
      </div>

      {/* Basic Contact Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3 text-left">
          <label className="flex items-center gap-2 text-[11px] font-black text-navy/30 uppercase tracking-[0.2em] ml-6">
            <User size={14} className="text-primary/40" /> Full Name
          </label>
          <input
            type="text"
            placeholder="John Doe"
            value={data.full_name || ""}
            onChange={(e) => updateData({ full_name: e.target.value })}
            className="w-full bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2.5rem] px-10 py-6 text-navy font-bold focus:ring-4 focus:ring-blue-400/10 outline-none transition-all placeholder:text-navy/10 shadow-sm text-lg"
          />
        </div>

        <div className="space-y-3 text-left">
          <label className="flex items-center gap-2 text-[11px] font-black text-navy/30 uppercase tracking-[0.2em] ml-6">
            <Phone size={14} className="text-primary/40" /> Phone Number
          </label>
          <input
            type="tel"
            placeholder="+1 234 567 890"
            value={data.phone || ""}
            onChange={(e) => updateData({ phone: e.target.value })}
            className="w-full bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2.5rem] px-10 py-6 text-navy font-bold focus:ring-4 focus:ring-blue-400/10 outline-none transition-all placeholder:text-navy/10 shadow-sm text-lg"
          />
        </div>
      </div>

      {/* Knockout Section */}
      <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-10 md:p-12 rounded-[3.5rem] space-y-10 shadow-xl shadow-navy/5">
        <div className="flex items-center gap-4 border-b border-navy/5 pb-6">
          <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600">
            <CheckCircle2 size={24} />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-black text-navy uppercase tracking-tight">Knockout Protocol</h3>
            <p className="text-[10px] font-black text-navy/20 uppercase tracking-[0.2em]">Mandatory Screening Criteria</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6 text-left">
            <h4 className="text-[11px] font-black text-navy/40 uppercase tracking-[0.2em] ml-2">Experience & Availability</h4>
            
            <div className="space-y-4">
              <label className="block text-sm font-bold text-navy px-2 leading-tight">Do you have prior teaching or tutoring experience?</label>
              <div className="flex gap-6 p-2 w-fit">
                {["true", "false"].map((val) => (
                  <button
                    key={val}
                    onClick={() => updateData({ prior_experience: val })}
                    className={`px-10 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-[0.2em] transition-all transform active:scale-95 ${
                      data.prior_experience === val 
                        ? "bg-white text-navy border-4 border-navy shadow-lg scale-105" 
                        : "bg-white text-navy/30 shadow-2xl shadow-navy/10 hover:text-navy/50"
                    }`}
                  >
                    {val === "true" ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold text-navy px-2 leading-tight">Are you available for online tutoring? <span className="text-blue-500 font-black">*</span></label>
              <div className="flex gap-6 p-2 w-fit">
                {["true", "false"].map((val) => (
                  <button
                    key={val}
                    onClick={() => updateData({ online_available: val })}
                    className={`px-10 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-[0.2em] transition-all transform active:scale-95 ${
                      data.online_available === val 
                        ? "bg-white text-navy border-4 border-navy shadow-lg scale-105" 
                        : "bg-white text-navy/30 shadow-2xl shadow-navy/10 hover:text-navy/50"
                    }`}
                  >
                    {val === "true" ? "Yes" : "No"}
                  </button>
                ))}
              </div>
              {data.online_available === "false" && (
                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest px-2 animate-pulse flex items-center gap-2">
                  <AlertCircle size={12} /> Note: This is an online-only platform
                </p>
              )}
            </div>
          </div>

          <div className="space-y-6 text-left">
            <h4 className="text-[11px] font-black text-navy/40 uppercase tracking-[0.2em] ml-2">Mastery Domain</h4>
            
            <div className="space-y-3">
              <label className="text-[10px] font-black text-navy/30 uppercase tracking-widest ml-6">Subjects to Teach</label>
              <input
                type="text"
                placeholder="e.g. Physics, Chemistry, Biology"
                value={data.subjects || ""}
                onChange={(e) => updateData({ subjects: e.target.value })}
                className="w-full bg-white/70 border border-white/60 rounded-[2rem] px-8 py-5 text-navy font-bold focus:ring-4 focus:ring-blue-400/10 outline-none transition-all placeholder:text-navy/10 shadow-sm"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-navy/30 uppercase tracking-widest ml-6">Levels (Primary, GCSE, A-Level, etc.)</label>
              <input
                type="text"
                placeholder="e.g. GCSE, IB, University"
                value={data.levels || ""}
                onChange={(e) => updateData({ levels: e.target.value })}
                className="w-full bg-white/70 border border-white/60 rounded-[2rem] px-8 py-5 text-navy font-bold focus:ring-4 focus:ring-blue-400/10 outline-none transition-all placeholder:text-navy/10 shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Timezone (Read-only detection) */}
      <div className="flex items-center justify-between p-6 rounded-[2.5rem] bg-white/40 border border-white/60 text-navy/50 shadow-sm">
        <div className="flex items-center gap-4 px-2">
          <div className="p-2 bg-navy/5 rounded-xl">
            <Globe size={20} />
          </div>
          <div className="text-left">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Operational Timezone</p>
            <p className="font-bold text-navy">{timezone || "Detecting..."}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-blue-50/50 px-5 py-2 rounded-full border border-blue-100/50">
          <MapPin size={12} className="text-blue-400" />
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{data.country || "Detected"}</span>
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!isComplete}
        className={`w-full py-6 rounded-[2.5rem] font-black text-xl tracking-tight transition-all transform active:scale-95 flex items-center justify-center gap-4 group relative overflow-hidden shadow-xl ${
          isComplete 
            ? "bg-blue-600 text-white hover:bg-blue-500 hover:shadow-2xl hover:shadow-blue-500/20 shadow-blue-900/10" 
            : "bg-blue-50 text-blue-200 cursor-not-allowed shadow-none grayscale opacity-60"
        }`}
      >
        <span className="relative z-10 flex items-center gap-3">
          Initialize Calibration
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
    </motion.div>
  );
}
