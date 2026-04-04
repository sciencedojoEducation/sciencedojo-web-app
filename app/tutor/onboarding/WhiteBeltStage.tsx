"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Globe, GraduationCap, Briefcase, Award, Clock, Plus, Trash2, Heart, BookOpen } from "lucide-react";
import PrivateUploader from "./PrivateUploader";

interface WhiteBeltStageProps {
  data: any;
  userId: string;
  updateData: (fields: any) => void;
  onNext: () => void;
}

export default function WhiteBeltStage({ data, userId, updateData, onNext }: WhiteBeltStageProps) {
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
    edu.push({ institution: "", degree: "", transcript_url: "" });
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
    work.push({ company: "", role: "", duration: "", proof_url: "" });
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
    ? (data.university && data.year_of_study && data.top_grades && data.motivation && data.tutoring_experience && data.ol_certificate_url && data.al_certificate_url && data.specific_subject_grade)
    : (
        Array.isArray(data.work_history) && data.work_history.length > 0 && 
        Array.isArray(data.education) && data.education.length > 0 && 
        data.education.every((edu: any) => edu.institution && edu.degree && edu.transcript_url) &&
        data.motivation && data.tutoring_experience
      );

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
          className={`p-10 rounded-[3rem] border-4 transition-all flex flex-col items-center gap-4 group ${
            userType === "undergrad"
              ? "border-mint bg-mint/5 shadow-xl shadow-mint/10 scale-[1.02]"
              : "border-transparent bg-white/40 backdrop-blur-md hover:bg-white/80 hover:shadow-2xl"
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
          className={`p-10 rounded-[3rem] border-4 transition-all flex flex-col items-center gap-4 group ${
            userType === "pro"
              ? "border-mint bg-mint/5 shadow-xl shadow-mint/10 scale-[1.02]"
              : "border-transparent bg-white/40 backdrop-blur-md hover:bg-white/80 hover:shadow-2xl"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
            {userType === "undergrad" ? (
              <>
                <div className="space-y-4 md:col-span-2 text-left">
                  <label className="flex items-center gap-2 text-[11px] font-black text-navy/30 uppercase tracking-[0.2em] ml-6">
                    <GraduationCap size={14} className="text-primary/40" /> University Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Imperial College London"
                    value={data.university || ""}
                    onChange={(e) => updateData({ university: e.target.value })}
                    className="w-full bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2.5rem] px-10 py-6 text-navy font-bold focus:ring-4 focus:ring-mint/10 outline-none transition-all placeholder:text-navy/10 shadow-sm text-lg"
                  />
                </div>
                <div className="space-y-4 text-left">
                  <label className="flex items-center gap-2 text-[11px] font-black text-navy/30 uppercase tracking-[0.2em] ml-6">
                    <Clock size={14} className="text-primary/40" /> Year of Study
                  </label>
                  <div className="relative group">
                    <select
                      value={data.year_of_study || ""}
                      onChange={(e) => updateData({ year_of_study: e.target.value })}
                      className="w-full bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2.5rem] px-10 py-6 text-navy font-bold focus:ring-4 focus:ring-mint/10 outline-none transition-all appearance-none cursor-pointer shadow-sm text-lg"
                    >
                      <option value="">Select Year...</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="Final Year">Final Year</option>
                      <option value="Masters/Postgrad">Masters/Postgrad</option>
                    </select>
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-navy/20 group-hover:text-primary transition-colors">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor font-bold"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 text-left">
                  <label className="flex items-center gap-2 text-[11px] font-black text-navy/30 uppercase tracking-[0.2em] ml-6">
                    <Award size={14} className="text-primary/40" /> Overall A-Level Grades
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3 A*s"
                    value={data.top_grades || ""}
                    onChange={(e) => updateData({ top_grades: e.target.value })}
                    className="w-full bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2.5rem] px-10 py-6 text-navy font-bold focus:ring-4 focus:ring-mint/10 outline-none transition-all placeholder:text-navy/10 shadow-sm text-lg"
                  />
                </div>

                {/* Undergrad Specific Academic Records */}
                <div className="md:col-span-2 mt-8 space-y-6">
                  <div className="flex items-center gap-4 px-6">
                    <div className="h-px flex-1 bg-navy/5" />
                    <h3 className="text-[10px] font-black text-navy/20 uppercase tracking-[0.4em] whitespace-nowrap">Academic Documentation</h3>
                    <div className="h-px flex-1 bg-navy/5" />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-2">
                    <PrivateUploader 
                      userId={userId} 
                      docType="ol_certificate"
                      label="Ordinary Level (O/L)"
                      onUploadSuccess={(url: string) => updateData({ ol_certificate_url: url })}
                    />
                    <PrivateUploader 
                      userId={userId} 
                      docType="al_certificate" 
                      label="Advanced Level (A/L)"
                      onUploadSuccess={(url: string) => updateData({ al_certificate_url: url })}
                    />
                  </div>

                  <div className="p-10 rounded-[3.5rem] bg-navy/5 border border-white/60 space-y-6 mt-4">
                    <label className="flex items-center gap-2 text-[11px] font-black text-navy/30 uppercase tracking-[0.2em] ml-2">
                      <BookOpen size={14} className="text-primary/40" /> Teaching Subject Grade
                    </label>
                    <div className="flex flex-col sm:flex-row gap-6">
                      <input
                        type="text"
                        placeholder="e.g. Physics A*"
                        value={data.specific_subject_grade || ""}
                        onChange={(e) => updateData({ specific_subject_grade: e.target.value })}
                        className="flex-1 bg-white/90 border border-white/60 rounded-[2rem] px-8 py-5 text-navy font-bold focus:ring-4 focus:ring-mint/10 outline-none transition-all placeholder:text-navy/10 shadow-sm"
                      />
                      <div className="w-full sm:w-64">
                        <PrivateUploader 
                          userId={userId} 
                          docType="subject_transcript" 
                          label="Subject Transcript"
                          onUploadSuccess={(url: string) => updateData({ subject_transcript_url: url })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Industry Pro Work History */}
                <div className="md:col-span-2 space-y-6">
                  <div className="flex justify-between items-center px-6">
                    <h3 className="text-[10px] font-black text-navy/20 uppercase tracking-[0.4em]">Work Experience</h3>
                    <button 
                      onClick={addWork}
                      className="px-6 py-2 rounded-full border border-mint bg-mint/5 text-[10px] font-black text-navy uppercase tracking-widest hover:bg-mint hover:text-white transition-all shadow-sm"
                    >
                      + Add Job
                    </button>
                  </div>
                  <div className="space-y-8">
                    {(data.work_history || []).map((work: any, index: number) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={index} 
                        className="p-10 rounded-[3.5rem] bg-white/40 backdrop-blur-md border border-white/60 shadow-xl space-y-8 relative group"
                      >
                        <button 
                          onClick={() => removeWork(index)}
                          className="absolute -right-3 -top-3 w-12 h-12 rounded-full bg-white border border-red-50 text-red-100 hover:text-red-500 hover:shadow-lg transition-all flex items-center justify-center -rotate-12 group-hover:rotate-0"
                        >
                          <Trash2 size={20} />
                        </button>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-navy/30 uppercase tracking-widest ml-6">Company</label>
                            <input
                              type="text"
                              placeholder="e.g. Google"
                              value={work.company}
                              onChange={(e) => updateWork(index, "company", e.target.value)}
                              className="w-full bg-white/80 border border-white/60 rounded-[2rem] px-8 py-5 text-navy font-bold focus:ring-4 focus:ring-mint/10 outline-none transition-all placeholder:text-navy/10 shadow-sm"
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-navy/30 uppercase tracking-widest ml-6">Role</label>
                            <input
                              type="text"
                              placeholder="e.g. Senior Strategist"
                              value={work.role}
                              onChange={(e) => updateWork(index, "role", e.target.value)}
                              className="w-full bg-white/80 border border-white/60 rounded-[2rem] px-8 py-5 text-navy font-bold focus:ring-4 focus:ring-mint/10 outline-none transition-all placeholder:text-navy/10 shadow-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
                          <div className="sm:col-span-2 space-y-3">
                            <label className="text-[10px] font-black text-navy/30 uppercase tracking-widest ml-6">Duration</label>
                            <input
                              type="text"
                              placeholder="How long were you there? (e.g. 4 Years)"
                              value={work.duration || ""}
                              onChange={(e) => updateWork(index, "duration", e.target.value)}
                              className="w-full bg-white/80 border border-white/60 rounded-[2rem] px-8 py-5 text-navy font-bold focus:ring-4 focus:ring-mint/10 outline-none transition-all placeholder:text-navy/10 shadow-sm"
                            />
                          </div>
                          <PrivateUploader 
                            userId={userId} 
                            docType={`work_proof_${index}`} 
                            label="Experience Proof"
                            onUploadSuccess={(url: string) => updateWork(index, "proof_url", url)}
                          />
                        </div>
                      </motion.div>
                    ))}
                    {(!data.work_history || data.work_history.length === 0) && (
                      <div className="p-16 text-center border-2 border-dashed border-navy/5 rounded-[4rem] text-navy/20 font-black text-xs uppercase tracking-[0.3em] bg-navy/5">
                         No professional experience added.
                      </div>
                    )}
                  </div>
                </div>

                {/* Industry Pro Education History */}
                <div className="md:col-span-2 space-y-6 mt-8">
                  <div className="flex justify-between items-center px-6">
                    <h3 className="text-[10px] font-black text-navy/20 uppercase tracking-[0.4em]">Educational Mastery</h3>
                    <button 
                      onClick={addEducation}
                      className="px-6 py-2 rounded-full border border-mint bg-mint/5 text-[10px] font-black text-navy uppercase tracking-widest hover:bg-mint hover:text-white transition-all shadow-sm"
                    >
                      + Add School
                    </button>
                  </div>
                  <div className="space-y-8">
                    {(data.education || []).map((edu: any, index: number) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={index} 
                        className="p-10 rounded-[3.5rem] bg-white/40 backdrop-blur-md border border-white/60 shadow-xl space-y-8 relative group"
                      >
                         <button 
                          onClick={() => removeEducation(index)}
                          className="absolute -right-3 -top-3 w-12 h-12 rounded-full bg-white border border-red-50 text-red-100 hover:text-red-500 hover:shadow-lg transition-all flex items-center justify-center -rotate-12 group-hover:rotate-0"
                        >
                          <Trash2 size={20} />
                        </button>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                           <div className="space-y-3">
                            <label className="text-[10px] font-black text-navy/30 uppercase tracking-widest ml-6">Institution</label>
                            <input
                              type="text"
                              placeholder="University/College"
                              value={edu.institution}
                              onChange={(e) => updateEducation(index, "institution", e.target.value)}
                              className="w-full bg-white/80 border border-white/60 rounded-[2rem] px-8 py-5 text-navy font-bold focus:ring-4 focus:ring-mint/10 outline-none transition-all placeholder:text-navy/10 shadow-sm"
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-navy/30 uppercase tracking-widest ml-6">Degree / Specialization</label>
                            <input
                              type="text"
                              placeholder="e.g. PhD in Quantum Ethics"
                              value={edu.degree}
                              onChange={(e) => updateEducation(index, "degree", e.target.value)}
                              className="w-full bg-white/80 border border-white/60 rounded-[2rem] px-8 py-5 text-navy font-bold focus:ring-4 focus:ring-mint/10 outline-none transition-all placeholder:text-navy/10 shadow-sm"
                            />
                          </div>
                        </div>
                        <div className="p-2 pt-0">
                           <PrivateUploader 
                             userId={userId} 
                             docType={`degree_transcript_${index}`} 
                             label="Academic Transcript / Certificate"
                             onUploadSuccess={(url: string) => updateEducation(index, "transcript_url", url)}
                           />
                        </div>
                      </motion.div>
                    ))}
                    {(!data.education || data.education.length === 0) && (
                      <div className="p-16 text-center border-2 border-dashed border-navy/5 rounded-[4rem] text-navy/20 font-black text-xs uppercase tracking-[0.3em] bg-navy/5">
                        No education records added.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Motivational Questions (Common to all) */}
            <div className="space-y-3 md:col-span-2 text-left">
              <label className="flex items-center gap-2 text-xs font-black text-navy/40 uppercase tracking-widest ml-6">
                <Heart size={14} className="text-red-400" /> Why do you want to teach on ScienceDojo?
              </label>
              <textarea
                placeholder="Share your passion for education..."
                value={data.motivation || ""}
                onChange={(e) => updateData({ motivation: e.target.value })}
                className="w-full bg-white/60 backdrop-blur-md border border-white/40 rounded-[2.5rem] px-8 py-6 text-navy font-bold focus:ring-4 focus:ring-mint/10 outline-none transition-all placeholder:text-navy/20 shadow-sm min-h-[140px] resize-none"
              />
            </div>

            <div className="space-y-3 md:col-span-2 text-left">
              <label className="flex items-center gap-2 text-xs font-black text-navy/40 uppercase tracking-widest ml-6">
                <BookOpen size={14} className="text-primary" /> Tell us about your tutoring experience
              </label>
              <textarea
                placeholder="Mention past students, subjects, or unique methods..."
                value={data.tutoring_experience || ""}
                onChange={(e) => updateData({ tutoring_experience: e.target.value })}
                className="w-full bg-white/60 backdrop-blur-md border border-white/40 rounded-[2.5rem] px-8 py-6 text-navy font-bold focus:ring-4 focus:ring-mint/10 outline-none transition-all placeholder:text-navy/20 shadow-sm min-h-[140px] resize-none"
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
        className={`w-full py-6 rounded-[2.5rem] font-black text-xl tracking-tight transition-all transform active:scale-95 flex items-center justify-center gap-4 group relative overflow-hidden shadow-xl ${
          isComplete 
            ? "bg-blue-600 text-white hover:bg-blue-500 hover:shadow-2xl hover:shadow-blue-500/20 shadow-blue-900/10" 
            : "bg-blue-50 text-blue-200 cursor-not-allowed shadow-none grayscale opacity-60"
        }`}
      >
        <span className="relative z-10 flex items-center gap-3">
          Level Up to Blue Belt
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
