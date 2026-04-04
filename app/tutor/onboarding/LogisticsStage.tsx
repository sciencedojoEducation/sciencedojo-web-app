"use client";

import { motion } from "framer-motion";
import { Laptop, Wifi, Camera, Mic, Calendar, UserCheck, DollarSign, Clock } from "lucide-react";

interface LogisticsStageProps {
  data: any;
  updateData: (fields: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function LogisticsStage({ data, updateData, onNext, onBack }: LogisticsStageProps) {
  
  const techPoints = [
    { id: "device", label: "Laptop/Desktop", icon: <Laptop size={18} /> },
    { id: "has_camera", label: "HD Camera", icon: <Camera size={18} /> },
    { id: "has_mic", label: "Pro Microphone", icon: <Mic size={18} /> },
    { id: "stable_internet", label: "Stable Fiber/Cable", icon: <Wifi size={18} /> }
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

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-12"
    >
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-4xl font-black text-navy tracking-tight">Sensei Logistics ⚙️</h2>
        <p className="text-navy/60 font-medium italic">"Precision in practice, reliability in presence."</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Technical Readiness */}
        <div className="space-y-8">
           <div className="flex items-center gap-3 border-b border-navy/5 pb-4">
              <Laptop size={20} className="text-blue-500" />
              <h3 className="text-lg font-black text-navy uppercase tracking-tight">Technical Setup</h3>
           </div>
           <div className="grid grid-cols-2 gap-4">
              {techPoints.map((p) => (
                <button
                  key={p.id}
                  onClick={() => updateData({ [p.id]: data[p.id] === "true" ? "false" : "true" })}
                  className={`p-10 rounded-[2.5rem] border-4 transition-all flex flex-col items-center gap-4 text-center transform active:scale-95 ${
                    data[p.id] === "true"
                      ? "border-navy bg-white shadow-xl scale-[1.02]"
                      : "border-transparent bg-white text-navy/30 shadow-2xl shadow-navy/10 hover:bg-white/80"
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${data[p.id] === "true" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-navy/5 text-navy/20"}`}>
                    {p.icon}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">{p.label}</span>
                </button>
              ))}
           </div>
        </div>

        {/* Preferences & Rates */}
        <div className="space-y-8">
           <div className="flex items-center gap-3 border-b border-navy/5 pb-4">
              <UserCheck size={20} className="text-blue-500" />
              <h3 className="text-lg font-black text-navy uppercase tracking-tight">Service Range</h3>
           </div>
           <div className="space-y-4">
              <label className="text-[10px] font-black text-navy/30 uppercase tracking-widest ml-6">Preferred Teaching Levels</label>
              <div className="flex flex-wrap gap-4 p-2 w-fit">
                {levels.map((l) => (
                  <button
                    key={l}
                    onClick={() => toggleLevel(l)}
                    className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all transform active:scale-95 ${
                      data.preferred_levels?.includes(l)
                        ? "bg-white text-navy border-4 border-navy shadow-lg scale-105"
                        : "bg-white text-navy/30 shadow-2xl shadow-navy/10 hover:text-navy/50"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
           </div>

           <div className="space-y-4 text-left">
              <label className="flex items-center gap-2 text-[10px] font-black text-navy/30 uppercase tracking-widest ml-6">
                <DollarSign size={14} className="text-emerald-500" /> Expected Hourly Rate (£)
              </label>
              <div className="relative max-w-[200px]">
                <input
                  type="number"
                  placeholder="e.g. 45"
                  value={data.hourly_rate || ""}
                  onChange={(e) => updateData({ hourly_rate: e.target.value })}
                  className="w-full bg-white/80 border border-white/60 rounded-[2rem] px-10 py-6 text-navy font-black focus:ring-4 focus:ring-emerald-400/10 outline-none transition-all placeholder:text-navy/10 shadow-sm text-2xl"
                />
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-navy/20">£</span>
              </div>
           </div>
        </div>

        {/* Availability Strip */}
        <div className="md:col-span-2 bg-navy/5 p-10 rounded-[3.5rem] border border-white/60 space-y-8">
           <div className="flex items-center gap-3 border-b border-navy/5 pb-4">
              <Calendar size={20} className="text-blue-500" />
              <h3 className="text-lg font-black text-navy uppercase tracking-tight">Active Duty Window</h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
             <div className="space-y-4">
               <label className="text-[10px] font-black text-navy/30 uppercase tracking-widest ml-4">Weekly Availability (General)</label>
               <textarea
                 placeholder="e.g. Weekdays 4pm-9pm, Full Sundays..."
                 value={data.availability_summary || ""}
                 onChange={(e) => updateData({ availability_summary: e.target.value })}
                 className="w-full bg-white border border-white/60 rounded-[2.5rem] px-8 py-6 text-navy font-bold focus:ring-4 focus:ring-blue-400/10 outline-none transition-all placeholder:text-navy/10 shadow-sm min-h-[120px] resize-none"
               />
             </div>

             <div className="space-y-6">
                <div className="flex flex-col gap-4 text-left">
                  <span className="text-[11px] font-black text-navy/20 uppercase tracking-[0.3em] ml-2">Teaching Preference</span>
                  <div className="flex gap-4 p-2 w-fit">
                    {["1:1", "Group", "Both"].map((mode) => (
                       <button
                         key={mode}
                         onClick={() => updateData({ teaching_mode: mode })}
                         className={`px-10 py-5 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all transform active:scale-95 ${
                           data.teaching_mode === mode 
                             ? "bg-white text-navy border-4 border-navy shadow-lg scale-105" 
                             : "bg-white text-navy/30 shadow-2xl shadow-navy/10 hover:text-navy/50"
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
            Synchronize Logistics
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
