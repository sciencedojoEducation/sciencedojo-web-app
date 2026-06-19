"use client";

import { motion } from "framer-motion";
import { Globe, User, Mail, Phone, MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface ScreeningStageProps {
  data: any;
  userId: string;
  updateData: (fields: any) => void;
  onNext: () => void;
  onSaveDraft: () => void;
  isSavingDraft: boolean;
}

export default function ScreeningStage({ data, updateData, onNext, onSaveDraft, isSavingDraft }: ScreeningStageProps) {
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
      className="rounded-[1.75rem] border border-blue-100 bg-white/92 p-5 shadow-xl shadow-navy/5 backdrop-blur-xl sm:p-7 md:p-10"
    >
      <div className="space-y-2 text-left">
        <p className="text-sm font-black text-primary">Step 1 of 6</p>
        <h2 className="text-2xl font-black tracking-tight text-navy md:text-3xl">Basic Information</h2>
        <p className="text-sm font-medium text-navy/60 md:text-base">Tell us a little about yourself.</p>
      </div>

      {/* Basic Contact Grid */}
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-3 text-left">
          <label className="flex items-center gap-2 text-xs font-bold text-navy/55">
            <User size={14} className="text-primary/40" /> Full Name
          </label>
          <input
            type="text"
            placeholder="John Doe"
            value={data.full_name || ""}
            onChange={(e) => updateData({ full_name: e.target.value })}
            className="w-full rounded-2xl border border-navy/10 bg-white px-5 py-4 text-base font-semibold text-navy shadow-sm outline-none transition-all placeholder:text-navy/25 focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
          />
        </div>

        <div className="space-y-3 text-left">
          <label className="flex items-center gap-2 text-xs font-bold text-navy/55">
            <Phone size={14} className="text-primary/40" /> Phone Number
          </label>
          <input
            type="tel"
            placeholder="+1 234 567 890"
            value={data.phone || ""}
            onChange={(e) => updateData({ phone: e.target.value })}
            className="w-full rounded-2xl border border-navy/10 bg-white px-5 py-4 text-base font-semibold text-navy shadow-sm outline-none transition-all placeholder:text-navy/25 focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
          />
        </div>
      </div>

      {/* Requirements Section */}
      <div className="mt-8 rounded-[1.5rem] border border-navy/8 bg-slate-50/70 p-5 md:p-6">
        <div className="flex items-center gap-4 border-b border-navy/6 pb-5">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <CheckCircle2 size={22} />
          </div>
          <div className="text-left">
            <h3 className="text-base font-black text-navy">Basic Requirements</h3>
            <p className="text-xs font-semibold text-navy/45">A few essentials before review</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="space-y-6 text-left">
            <h4 className="text-xs font-bold text-navy/45">Experience & availability</h4>
            
            <div className="space-y-4">
              <label className="block text-sm font-bold text-navy px-2 leading-tight">Do you have prior teaching or tutoring experience?</label>
              <div className="flex flex-wrap gap-3">
                {["true", "false"].map((val) => (
                  <button
                    key={val}
                    onClick={() => updateData({ prior_experience: val })}
                    className={`rounded-xl border px-6 py-3 text-sm font-bold transition-all active:scale-95 ${
                      data.prior_experience === val 
                        ? "border-primary bg-primary text-white shadow-sm" 
                        : "border-navy/10 bg-white text-navy/55 hover:border-primary/30 hover:text-navy"
                    }`}
                  >
                    {val === "true" ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold text-navy px-2 leading-tight">Are you available for online tutoring? <span className="text-blue-500 font-black">*</span></label>
              <div className="flex flex-wrap gap-3">
                {["true", "false"].map((val) => (
                  <button
                    key={val}
                    onClick={() => updateData({ online_available: val })}
                    className={`rounded-xl border px-6 py-3 text-sm font-bold transition-all active:scale-95 ${
                      data.online_available === val 
                        ? "border-primary bg-primary text-white shadow-sm" 
                        : "border-navy/10 bg-white text-navy/55 hover:border-primary/30 hover:text-navy"
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
            <h4 className="text-xs font-bold text-navy/45">Subjects & levels</h4>
            
            <div className="space-y-3">
              <label className="text-xs font-bold text-navy/55">Subjects to teach</label>
              <input
                type="text"
                placeholder="e.g. Physics, Chemistry, Biology"
                value={data.subjects || ""}
                onChange={(e) => updateData({ subjects: e.target.value })}
                className="w-full rounded-2xl border border-navy/10 bg-white px-5 py-4 text-base font-semibold text-navy shadow-sm outline-none transition-all placeholder:text-navy/25 focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-navy/55">Levels (Primary, GCSE, A-Level, etc.)</label>
              <input
                type="text"
                placeholder="e.g. GCSE, IB, University"
                value={data.levels || ""}
                onChange={(e) => updateData({ levels: e.target.value })}
                className="w-full rounded-2xl border border-navy/10 bg-white px-5 py-4 text-base font-semibold text-navy shadow-sm outline-none transition-all placeholder:text-navy/25 focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Timezone (Read-only detection) */}
      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-navy/8 bg-white p-5 text-navy/60 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 px-2">
          <div className="p-2 bg-navy/5 rounded-xl">
            <Globe size={20} />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-navy/40">Timezone</p>
            <p className="font-bold text-navy">{timezone || "Detecting..."}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-blue-50/50 px-5 py-2 rounded-full border border-blue-100/50">
          <MapPin size={12} className="text-blue-400" />
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{data.country || "Detected"}</span>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4 border-t border-navy/8 pt-6 md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-semibold text-navy/55">You can save and continue later</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={onSaveDraft}
            disabled={isSavingDraft}
            className="min-h-11 rounded-xl border border-navy/10 bg-white px-5 py-3 text-sm font-bold text-navy/65 transition-colors hover:border-primary/30 hover:text-navy disabled:opacity-60"
          >
            {isSavingDraft ? "Saving..." : "Save Draft"}
          </button>
          <button
            onClick={onNext}
            disabled={!isComplete}
            className={`min-h-11 rounded-xl px-6 py-3 text-sm font-black transition-all active:scale-95 ${
              isComplete 
                ? "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-blue-500" 
                : "cursor-not-allowed bg-blue-50 text-blue-200"
            }`}
          >
            Next step →
          </button>
        </div>
      </div>
    </motion.div>
  );
}
