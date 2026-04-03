"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Globe, GraduationCap, Briefcase, Award, Clock, Plus, Trash2, Heart, BookOpen } from "lucide-react";

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

  const addEducation = () => {
    const edu = Array.isArray(data.education) ? [...data.education] : [];
    edu.push({ institution: "", degree: "" });
    updateData({ education: edu });
  };

  const removeEducation = (index: number) => {
    const edu = [...data.education];
    edu.splice(index, 1);
    updateData({ education: edu });
  };

  const updateEducation = (index: number, field: string, value: string) => {
    const edu = [...data.education];
    edu[index] = { ...edu[index], [field]: value };
    updateData({ education: edu });
  };

  const addWork = () => {
    const work = Array.isArray(data.work_history) ? [...data.work_history] : [];
    work.push({ company: "", role: "" });
    updateData({ work_history: work });
  };

  const removeWork = (index: number) => {
    const work = [...data.work_history];
    work.splice(index, 1);
    updateData({ work_history: work });
  };

  const updateWork = (index: number, field: string, value: string) => {
    const work = [...data.work_history];
    work[index] = { ...work[index], [field]: value };
    updateData({ work_history: work });
  };

  const isComplete = userType === "undergrad" 
    ? (data.university && data.year_of_study && data.top_grades && data.motivation && data.tutoring_experience)
    : (Array.isArray(data.work_history) && data.work_history.length > 0 && Array.isArray(data.education) && data.education.length > 0 && data.motivation && data.tutoring_experience);

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
          <div className={`w-16 h-16 rounded-2xl transition-all flex items-center justify-center text-3xl shadow-sm ${userType === "undergrad" ? "bg-mint shadow-mint/20 scale-110" : "bg-navy/5 grayscale group-hover:grayscale-0 group-hover:bg-navy/10"}`}>
            🎓
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
          <div className={`w-16 h-16 rounded-2xl transition-all flex items-center justify-center text-3xl shadow-sm ${userType === "pro" ? "bg-mint shadow-mint/20 scale-110" : "bg-navy/5 grayscale group-hover:grayscale-0 group-hover:bg-navy/10"}`}>
            👨‍💼
          </div>
          <div className="text-center">
            <span className={`block font-black uppercase tracking-widest text-[10px] ${userType === "pro" ? "text-mint-700" : "text-navy/40"}`}>Option B</span>
            <span className="block font-bold text-navy text-lg">Industry Professional</span>
          </div>
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={userType}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 rounded-[2.5rem] bg-white/40 backdrop-blur-xl border border-white/60 shadow-xl">
            {userType === "undergrad" ? (
              <>
                <div className="space-y-2 md:col-span-2 text-left">
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
                <div className="space-y-2 text-left">
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
                <div className="space-y-2 text-left">
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
                {/* Industry Pro Education History */}
                <div className="space-y-4 md:col-span-2 text-left">
                  <div className="flex justify-between items-center px-2">
                    <label className="flex items-center gap-2 text-xs font-black text-navy/40 uppercase tracking-widest">
                       <GraduationCap size={14} /> Education History
                    </label>
                    <button 
                      onClick={addEducation}
                      className="text-[10px] font-black text-mint uppercase tracking-widest hover:text-navy flex items-center gap-1 transition-colors"
                    >
                      <Plus size={12} /> Add School
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(data.education || []).map((edu: any, index: number) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={index} 
                        className="flex gap-3"
                      >
                        <input
                          type="text"
                          placeholder="Institution/University"
                          value={edu.institution}
                          onChange={(e) => updateEducation(index, "institution", e.target.value)}
                          className="flex-1 p-4 rounded-xl border-2 border-navy/5 bg-white outline-none focus:border-mint transition-all font-bold text-sm text-navy"
                        />
                        <input
                          type="text"
                          placeholder="Degree (e.g. BSc Physics)"
                          value={edu.degree}
                          onChange={(e) => updateEducation(index, "degree", e.target.value)}
                          className="flex-1 p-4 rounded-xl border-2 border-navy/5 bg-white outline-none focus:border-mint transition-all font-bold text-sm text-navy"
                        />
                        <button 
                          onClick={() => removeEducation(index)}
                          className="p-4 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </motion.div>
                    ))}
                    {(!data.education || data.education.length === 0) && (
                      <div className="p-8 text-center border-2 border-dashed border-navy/5 rounded-2xl text-navy/20 font-bold text-sm italic">
                        No education records added yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Industry Pro Work History */}
                <div className="space-y-4 md:col-span-2 text-left">
                  <div className="flex justify-between items-center px-2">
                    <label className="flex items-center gap-2 text-xs font-black text-navy/40 uppercase tracking-widest">
                       <Briefcase size={14} /> Work Experience
                    </label>
                    <button 
                      onClick={addWork}
                      className="text-[10px] font-black text-mint uppercase tracking-widest hover:text-navy flex items-center gap-1 transition-colors"
                    >
                      <Plus size={12} /> Add Job
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(data.work_history || []).map((work: any, index: number) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={index} 
                        className="flex gap-3"
                      >
                        <input
                          type="text"
                          placeholder="Company (e.g. Google, NHS)"
                          value={work.company}
                          onChange={(e) => updateWork(index, "company", e.target.value)}
                          className="flex-1 p-4 rounded-xl border-2 border-navy/5 bg-white outline-none focus:border-mint transition-all font-bold text-sm text-navy"
                        />
                        <input
                          type="text"
                          placeholder="Role (e.g. Senior Software Engineer)"
                          value={work.role}
                          onChange={(e) => updateWork(index, "role", e.target.value)}
                          className="flex-1 p-4 rounded-xl border-2 border-navy/5 bg-white outline-none focus:border-mint transition-all font-bold text-sm text-navy"
                        />
                        <button 
                          onClick={() => removeWork(index)}
                          className="p-4 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </motion.div>
                    ))}
                    {(!data.work_history || data.work_history.length === 0) && (
                      <div className="p-8 text-center border-2 border-dashed border-navy/5 rounded-2xl text-navy/20 font-bold text-sm italic">
                         No professional experience added yet.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Motivational Questions (Common to all) */}
            <div className="space-y-2 md:col-span-2 text-left">
              <label className="flex items-center gap-2 text-xs font-black text-navy/40 uppercase tracking-widest ml-2">
                <Heart size={14} className="text-red-400" /> Why do you want to teach on ScienceDojo? (Motivation)
              </label>
              <textarea
                placeholder="Share your passion for education and why you're a good fit..."
                value={data.motivation || ""}
                onChange={(e) => updateData({ motivation: e.target.value })}
                className="w-full p-5 rounded-2xl border-2 border-navy/5 bg-white/80 focus:border-mint focus:ring-4 focus:ring-mint/10 outline-none transition-all font-bold text-navy placeholder:text-navy/20 min-h-[120px] resize-none"
              />
            </div>

            <div className="space-y-2 md:col-span-2 text-left">
              <label className="flex items-center gap-2 text-xs font-black text-navy/40 uppercase tracking-widest ml-2">
                <BookOpen size={14} className="text-primary" /> Tell us about your tutoring experience
              </label>
              <textarea
                placeholder="Mention any past students, subjects, or unique methods you use..."
                value={data.tutoring_experience || ""}
                onChange={(e) => updateData({ tutoring_experience: e.target.value })}
                className="w-full p-5 rounded-2xl border-2 border-navy/5 bg-white/80 focus:border-mint focus:ring-4 focus:ring-mint/10 outline-none transition-all font-bold text-navy placeholder:text-navy/20 min-h-[120px] resize-none"
              />
            </div>

          </div>
        </motion.div>
      </AnimatePresence>

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
