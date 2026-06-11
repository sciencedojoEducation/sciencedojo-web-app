"use client";

import { motion } from "framer-motion";
import { Laptop, Wifi, Camera, Mic, Calendar, UserCheck, DollarSign, Clock, CheckCircle2 } from "lucide-react";

interface LogisticsStageProps {
  data: any;
  updateData: (fields: any) => void;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft: () => void;
  isSavingDraft: boolean;
}

export default function LogisticsStage({ data, updateData, onNext, onBack, onSaveDraft, isSavingDraft }: LogisticsStageProps) {
  
  const techPoints = [
    { id: "device", label: "Laptop/Desktop", icon: <Laptop size={18} /> },
    { id: "has_camera", label: "HD Camera", icon: <Camera size={18} /> },
    { id: "has_mic", label: "Clear Microphone", icon: <Mic size={18} /> },
    { id: "stable_internet", label: "Stable Internet", icon: <Wifi size={18} /> }
  ];

  const levels = ["Primary", "GCSE", "A-Level", "IB", "University"];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const toggleLevel = (val: string) => {
    const current = Array.isArray(data.preferred_levels) ? [...data.preferred_levels] : [];
    const index = current.indexOf(val);
    if (index > -1) current.splice(index, 1);
    else current.push(val);
    updateData({ preferred_levels: current });
  };

  const isComplete = 
    data.has_mic === "true" && 
    data.has_camera === "true" && 
    data.hourly_rate && 
    Array.isArray(data.preferred_levels) && data.preferred_levels.length > 0;
  const technicalSetupComplete = techPoints.every((point) => data[point.id] === "true");

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="rounded-[1.75rem] border border-blue-100 bg-white/92 p-5 shadow-xl shadow-navy/5 backdrop-blur-xl sm:p-7 md:p-10"
    >
      <div className="space-y-2 text-left">
        <p className="text-sm font-black text-primary">Step 5 of 6</p>
        <h2 className="text-2xl font-black tracking-tight text-navy md:text-3xl">Availability</h2>
        <p className="text-sm font-medium text-navy/60 md:text-base">Set your teaching preferences, technical setup, and general availability.</p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Technical Readiness */}
        <div className="space-y-5">
           <div className="space-y-4 border-b border-navy/6 pb-4">
             <div className="flex items-center gap-3">
                <Laptop size={20} className="text-blue-500" />
                <h3 className="text-lg font-black text-navy">Technical Setup</h3>
             </div>
             <p className="text-sm font-medium leading-relaxed text-navy/60">
                Confirm that you have the equipment needed for reliable online lessons.
             </p>
           </div>
           <div className="grid grid-cols-2 gap-3">
              {techPoints.map((p) => (
                <button
                  key={p.id}
                  onClick={() => updateData({ [p.id]: data[p.id] === "true" ? "false" : "true" })}
                  className={`relative flex flex-col items-center gap-3 rounded-[1.35rem] border p-4 text-center transition-all active:scale-95 ${
                    data[p.id] === "true"
                      ? "border-primary bg-primary/5 text-navy shadow-sm"
                      : "border-navy/10 bg-white text-navy/40 hover:border-primary/30 hover:text-navy"
                  }`}
                >
                  {data[p.id] === "true" && (
                    <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-white text-primary shadow-sm ring-1 ring-primary/15">
                      <CheckCircle2 size={13} />
                    </span>
                  )}
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all ${data[p.id] === "true" ? "bg-primary text-white shadow-lg shadow-blue-500/20" : "bg-navy/5 text-navy/30"}`}>
                    {p.icon}
                  </div>
                  <span className="text-xs font-bold leading-tight">{p.label}</span>
                </button>
              ))}
           </div>
           {technicalSetupComplete && (
             <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700">
               <CheckCircle2 size={14} />
               Ready for online teaching
             </div>
           )}
        </div>

        {/* Preferences & Rates */}
        <div className="space-y-8">
           <div className="flex items-center gap-3 border-b border-navy/5 pb-4">
              <UserCheck size={20} className="text-blue-500" />
              <h3 className="text-lg font-black text-navy">Teaching Range</h3>
           </div>
           <div className="space-y-4">
              <label className="text-xs font-bold text-navy/55">Preferred Teaching Levels</label>
              <div className="flex flex-wrap gap-3">
                {levels.map((l) => (
                  <button
                    key={l}
                    onClick={() => toggleLevel(l)}
                    className={`rounded-xl border px-4 py-2.5 text-xs font-bold transition-all active:scale-95 ${
                      data.preferred_levels?.includes(l)
                        ? "border-primary bg-primary text-white shadow-sm"
                        : "border-navy/10 bg-white text-navy/55 hover:border-primary/30 hover:text-navy"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
           </div>

           <div className="space-y-4 text-left">
              <label className="flex items-center gap-2 text-xs font-bold text-navy/55">
                <DollarSign size={14} className="text-emerald-500" /> Expected Hourly Rate (£)
              </label>
              <div className="relative max-w-[200px]">
                <input
                  type="number"
                  placeholder="e.g. 45"
                  value={data.hourly_rate || ""}
                  onChange={(e) => updateData({ hourly_rate: e.target.value })}
                  className="w-full rounded-2xl border border-navy/10 bg-white px-10 py-4 text-xl font-black text-navy shadow-sm outline-none transition-all placeholder:text-navy/25 focus:border-emerald-400/40 focus:ring-4 focus:ring-emerald-400/10"
                />
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-navy/20">£</span>
              </div>
           </div>
        </div>

        {/* Availability Strip */}
        <div className="space-y-6 rounded-[1.5rem] border border-navy/8 bg-slate-50/70 p-5 md:col-span-2 md:p-6">
           <div className="flex items-center gap-3 border-b border-navy/5 pb-4">
              <Calendar size={20} className="text-blue-500" />
              <h3 className="text-lg font-black text-navy">Weekly Availability</h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
             <div className="space-y-4">
               <label className="text-xs font-bold text-navy/55">Weekly Availability (General)</label>
               <textarea
                 placeholder="e.g. Weekdays 4pm-9pm, Full Sundays..."
                 value={data.availability_summary || ""}
                 onChange={(e) => updateData({ availability_summary: e.target.value })}
                 className="min-h-[120px] w-full resize-none rounded-2xl border border-navy/10 bg-white px-5 py-4 text-base font-semibold text-navy shadow-sm outline-none transition-all placeholder:text-navy/25 focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
               />
             </div>

             <div className="space-y-6">
                <div className="flex flex-col gap-4 text-left">
                  <span className="text-xs font-bold text-navy/55">Teaching Preference</span>
                  <div className="flex flex-wrap gap-3">
                    {["1:1", "Group", "Both"].map((mode) => (
                       <button
                         key={mode}
                         onClick={() => updateData({ teaching_mode: mode })}
                         className={`rounded-xl border px-5 py-3 text-xs font-bold transition-all active:scale-95 ${
                           data.teaching_mode === mode 
                             ? "border-primary bg-primary text-white shadow-sm" 
                             : "border-navy/10 bg-white text-navy/55 hover:border-primary/30 hover:text-navy"
                         }`}
                       >
                         {mode}
                       </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-5 rounded-[2rem] bg-blue-50/80 border border-blue-100 text-blue-600">
                   <Clock size={18} />
                   <div className="text-left font-bold leading-tight">
                     <p className="text-[9px] uppercase tracking-widest opacity-60">Operational Sync</p>
                     <p className="text-sm">Timezone: {data.timezone || "TBD"}</p>
                   </div>
                </div>
             </div>
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
