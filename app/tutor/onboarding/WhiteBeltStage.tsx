"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Globe, GraduationCap, Briefcase, Award, Clock } from "lucide-react";

interface WhiteBeltStageProps {
  data: any;
  updateData: (fields: any) => void;
  onNext: () => void;
}

export default function WhiteBeltStage({ data, updateData, onNext }: WhiteBeltStageProps) {
  const [userType, setUserType] = useState<"undergrad" | "pro">(data.user_type || "undergrad");
  const [timezone, setTimezone] = useState(data.timezone || "");

  useEffect(() => {
    if (!data.timezone) {
      const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setTimezone(detectedTimezone);
      updateData({ timezone: detectedTimezone });
    }
  }, []);

  const handleUserTypeChange = (type: "undergrad" | "pro") => {
    setUserType(type);
    updateData({ user_type: type });
  };

  const isComplete = userType === "undergrad" 
    ? (data.university && data.year_of_study && data.top_grades)
    : (data.current_company && data.years_experience && data.industry_skillset);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-navy tracking-tight">White Belt: Eligibility 🥋</h2>
        <p className="text-navy/60 font-medium italic">"Every master was once a beginner. Tell us your path."</p>
      </div>

      {/* User Type Selection */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleUserTypeChange("undergrad")}
          className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 group ${
            userType === "undergrad"
              ? "border-mint bg-mint/5 shadow-lg shadow-mint/10"
              : "border-navy/5 bg-white/50 hover:bg-white"
          }`}
        >
          <div className={`p-4 rounded-2xl transition-all ${userType === "undergrad" ? "bg-mint text-navy" : "bg-navy/5 text-navy/40 group-hover:bg-navy/10"}`}>
            <GraduationCap size={28} />
          </div>
          <div className="text-center">
            <span className={`block font-black uppercase tracking-widest text-[10px] ${userType === "undergrad" ? "text-mint-700" : "text-navy/40"}`}>Option A</span>
            <span className="block font-bold text-navy text-lg">Undergraduate</span>
          </div>
        </button>

        <button
          onClick={() => handleUserTypeChange("pro")}
          className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 group ${
            userType === "pro"
              ? "border-mint bg-mint/5 shadow-lg shadow-mint/10"
              : "border-navy/5 bg-white/50 hover:bg-white"
          }`}
        >
          <div className={`p-4 rounded-2xl transition-all ${userType === "pro" ? "bg-mint text-navy" : "bg-navy/5 text-navy/40 group-hover:bg-navy/10"}`}>
            <Briefcase size={28} />
          </div>
          <div className="text-center">
            <span className={`block font-black uppercase tracking-widest text-[10px] ${userType === "pro" ? "text-mint-700" : "text-navy/40"}`}>Option B</span>
            <span className="block font-bold text-navy text-lg">Industry Pro</span>
          </div>
        </button>
      </div>

      {/* Dynamic Fields */}
      <motion.div
        key={userType}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 rounded-[2.5rem] bg-white/40 backdrop-blur-xl border border-white/60 shadow-xl"
      >
        {userType === "undergrad" ? (
          <>
            <div className="space-y-2 md:col-span-2">
              <label className="flex items-center gap-2 text-xs font-black text-navy/40 uppercase tracking-widest ml-2">
                <GraduationCap size={14} /> University Name
              </label>
              <input
                type="text"
                placeholder="e.g. Imperial College London"
                value={data.university || ""}
                onChange={(e) => updateData({ university: e.target.value })}
                className="w-full p-5 rounded-2xl border-2 border-navy/5 bg-white/80 focus:border-mint focus:ring-4 focus:ring-mint/10 outline-none transition-all font-bold text-navy placeholder:text-navy/20"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black text-navy/40 uppercase tracking-widest ml-2">
                <Clock size={14} /> Year of Study
              </label>
              <select
                value={data.year_of_study || ""}
                onChange={(e) => updateData({ year_of_study: e.target.value })}
                className="w-full p-5 rounded-2xl border-2 border-navy/5 bg-white/80 focus:border-mint focus:ring-4 focus:ring-mint/10 outline-none transition-all font-bold text-navy"
              >
                <option value="">Select Year...</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="Final Year">Final Year</option>
                <option value="Masters/Postgrad">Masters/Postgrad</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black text-navy/40 uppercase tracking-widest ml-2">
                <Award size={14} /> Recent Top Grades
              </label>
              <input
                type="text"
                placeholder="e.g. A*AA in A-Levels"
                value={data.top_grades || ""}
                onChange={(e) => updateData({ top_grades: e.target.value })}
                className="w-full p-5 rounded-2xl border-2 border-navy/5 bg-white/80 focus:border-mint focus:ring-4 focus:ring-mint/10 outline-none transition-all font-bold text-navy placeholder:text-navy/20"
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2 md:col-span-2">
              <label className="flex items-center gap-2 text-xs font-black text-navy/40 uppercase tracking-widest ml-2">
                <Briefcase size={14} /> Current Company / Industry
              </label>
              <input
                type="text"
                placeholder="e.g. Senior Researcher at SpaceX"
                value={data.current_company || ""}
                onChange={(e) => updateData({ current_company: e.target.value })}
                className="w-full p-5 rounded-2xl border-2 border-navy/5 bg-white/80 focus:border-mint focus:ring-4 focus:ring-mint/10 outline-none transition-all font-bold text-navy placeholder:text-navy/20"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black text-navy/40 uppercase tracking-widest ml-2">
                <Clock size={14} /> Years of Experience
              </label>
              <input
                type="number"
                placeholder="e.g. 5"
                value={data.years_experience || ""}
                onChange={(e) => updateData({ years_experience: e.target.value })}
                className="w-full p-5 rounded-2xl border-2 border-navy/5 bg-white/80 focus:border-mint focus:ring-4 focus:ring-mint/10 outline-none transition-all font-bold text-navy placeholder:text-navy/20"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black text-navy/40 uppercase tracking-widest ml-2">
                <Award size={14} /> Primary Skillset
              </label>
              <input
                type="text"
                placeholder="e.g. Quantum Computing, AI"
                value={data.industry_skillset || ""}
                onChange={(e) => updateData({ industry_skillset: e.target.value })}
                className="w-full p-5 rounded-2xl border-2 border-navy/5 bg-white/80 focus:border-mint focus:ring-4 focus:ring-mint/10 outline-none transition-all font-bold text-navy placeholder:text-navy/20"
              />
            </div>
          </>
        )}
      </motion.div>

      {/* Auto-detected Timezone (Read-only for now) */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-navy/5 border border-navy/10 text-navy/50">
        <div className="flex items-center gap-3">
          <Globe size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest">Auto-Detected Timezone</span>
        </div>
        <span className="font-bold text-sm">{timezone || "Detecting..."}</span>
      </div>

      <button
        onClick={onNext}
        disabled={!isComplete}
        className="w-full py-5 bg-navy hover:bg-black text-mint rounded-[2rem] font-black text-lg tracking-tight shadow-2xl shadow-navy/20 transition-all disabled:opacity-50 disabled:grayscale transform active:scale-95 flex items-center justify-center gap-2 group"
      >
        Level Up to Blue Belt
        <motion.span animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
          →
        </motion.span>
      </button>
    </motion.div>
  );
}
