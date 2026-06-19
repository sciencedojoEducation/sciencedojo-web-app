"use client";

import { motion } from "framer-motion";
import { GraduationCap, Briefcase, Award, Plus, Trash2, BookCheck } from "lucide-react";
import PrivateUploader from "./PrivateUploader";

interface AcademicExperienceStageProps {
  data: any;
  userId: string;
  updateData: (fields: any) => void;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft: () => void;
  isSavingDraft: boolean;
}

export default function AcademicExperienceStage({ data, userId, updateData, onNext, onBack, onSaveDraft, isSavingDraft }: AcademicExperienceStageProps) {
  
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

  const isComplete = 
    data.years_experience && 
    data.success_story && 
    Array.isArray(data.education) && 
    data.education.length > 0 &&
    data.education.every((e: any) => e.institution && e.degree && e.transcript_url);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="rounded-[1.75rem] border border-blue-100 bg-white/92 p-5 shadow-xl shadow-navy/5 backdrop-blur-xl sm:p-7 md:p-10"
    >
      <div className="space-y-2 text-left">
        <p className="text-sm font-black text-primary">Step 2 of 6</p>
        <h2 className="text-2xl font-black tracking-tight text-navy md:text-3xl">Experience</h2>
        <p className="text-sm font-medium text-navy/60 md:text-base">Share your education, teaching background, and a short example of student progress.</p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-7">
        {/* Years of Experience */}
        <div className="space-y-4 text-left">
          <label className="flex items-center gap-2 text-xs font-bold text-navy/55">
            <Briefcase size={14} className="text-primary/40" /> Years of teaching experience
          </label>
          <div className="flex flex-wrap gap-3">
            {["< 1 Year", "1-2 Years", "3-5 Years", "5+ Years"].map((val) => (
              <button
                key={val}
                onClick={() => updateData({ years_experience: val })}
                className={`rounded-xl border px-5 py-3 text-sm font-bold transition-all active:scale-95 ${
                  data.years_experience === val 
                    ? "border-primary bg-primary text-white shadow-sm" 
                    : "border-navy/10 bg-white text-navy/55 hover:border-primary/30 hover:text-navy"
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Education Multi-List */}
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="flex items-center gap-2 text-xs font-bold text-navy/55">
              <GraduationCap size={16} /> Higher Education
            </h3>
            <button 
              onClick={addEducation}
              className="w-fit rounded-xl border border-primary/30 bg-primary/5 px-4 py-2 text-xs font-black text-primary transition-all hover:bg-primary hover:text-white"
            >
              + Add Degree
            </button>
          </div>
          <div className="space-y-5">
            {(data.education || []).map((edu: any, index: number) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative space-y-6 rounded-[1.5rem] border border-navy/8 bg-slate-50/70 p-5 md:p-6"
              >
                <button 
                  onClick={() => removeEducation(index)}
                  className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full border border-red-100 bg-white text-red-300 transition-all hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="space-y-3 text-left">
                    <label className="text-xs font-bold text-navy/55">University / Institution</label>
                    <input
                      type="text"
                      placeholder="e.g. University of Manchester"
                      value={edu.institution}
                      onChange={(e) => updateEducation(index, "institution", e.target.value)}
                      className="w-full rounded-2xl border border-navy/10 bg-white px-5 py-4 text-base font-semibold text-navy shadow-sm outline-none transition-all placeholder:text-navy/25 focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                  <div className="space-y-3 text-left">
                    <label className="text-xs font-bold text-navy/55">Degree / Graduation</label>
                    <input
                      type="text"
                      placeholder="e.g. BSc Chemistry (1st Class)"
                      value={edu.degree}
                      onChange={(e) => updateEducation(index, "degree", e.target.value)}
                      className="w-full rounded-2xl border border-navy/10 bg-white px-5 py-4 text-base font-semibold text-navy shadow-sm outline-none transition-all placeholder:text-navy/25 focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                </div>
                <div className="p-2 pt-0">
                   <PrivateUploader 
                     userId={userId} 
                     docType={`edu_transcript_${index}`} 
                     label="Transcript / Certificate"
                     onUploadSuccess={(url: string) => updateEducation(index, "transcript_url", url)}
                   />
                </div>
              </motion.div>
            ))}
            {(!data.education || data.education.length === 0) && (
              <div className="rounded-[1.5rem] border border-dashed border-navy/10 bg-slate-50 p-8 text-center text-sm font-bold text-navy/35">
                 No higher education added yet.
              </div>
            )}
          </div>
        </div>

        {/* Success Story */}
        <div className="space-y-4 rounded-[1.5rem] border border-blue-100 bg-blue-50/50 p-5 text-left md:p-6">
          <label className="flex items-center gap-2 text-xs font-bold text-blue-700/70">
            <BookCheck size={16} /> Example of Student Improvement
          </label>
          <p className="mb-4 text-sm font-medium text-navy/45">Briefly share a case where you helped a student make meaningful progress.</p>
          <textarea
            placeholder="Example: I worked with an A-Level Physics student on exam technique, identifying gaps and building a weekly practice structure."
            value={data.success_story || ""}
            onChange={(e) => updateData({ success_story: e.target.value })}
            className="min-h-[140px] w-full resize-none rounded-2xl border border-navy/10 bg-white px-5 py-4 text-base font-semibold text-navy shadow-sm outline-none transition-all placeholder:text-navy/25 focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
          />
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
