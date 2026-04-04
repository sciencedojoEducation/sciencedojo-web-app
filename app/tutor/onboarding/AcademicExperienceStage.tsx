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
}

export default function AcademicExperienceStage({ data, userId, updateData, onNext, onBack }: AcademicExperienceStageProps) {
  
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
      className="space-y-10"
    >
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-4xl font-black text-navy tracking-tight">Academic Pedigree 🎓</h2>
        <p className="text-navy/60 font-medium italic">"A great teacher's foundation is built on their own mastery."</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Years of Experience */}
        <div className="space-y-4 text-left">
          <label className="flex items-center gap-2 text-[11px] font-black text-navy/30 uppercase tracking-[0.2em] ml-6">
            <Briefcase size={14} className="text-primary/40" /> Tutoring Tenure
          </label>
          <div className="flex flex-wrap gap-6 p-2 w-fit">
            {["< 1 Year", "1-2 Years", "3-5 Years", "5+ Years"].map((val) => (
              <button
                key={val}
                onClick={() => updateData({ years_experience: val })}
                className={`px-10 py-4 rounded-[1.5rem] text-sm font-black transition-all transform active:scale-95 ${
                  data.years_experience === val 
                    ? "bg-white text-navy border-4 border-navy shadow-lg scale-105" 
                    : "bg-white text-navy/30 shadow-2xl shadow-navy/10 hover:text-navy/50"
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Education Multi-List */}
        <div className="space-y-6">
          <div className="flex justify-between items-center px-6">
            <h3 className="text-[11px] font-black text-navy/30 uppercase tracking-[0.3em] flex items-center gap-2">
              <GraduationCap size={16} /> Higher Education
            </h3>
            <button 
              onClick={addEducation}
              className="px-6 py-2 rounded-full border border-blue-500 bg-blue-500/5 text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all shadow-sm"
            >
              + Add Degree
            </button>
          </div>
          <div className="space-y-8">
            {(data.education || []).map((edu: any, index: number) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-10 rounded-[3.5rem] bg-white/40 backdrop-blur-xl border border-white/60 shadow-xl space-y-8 relative group"
              >
                <button 
                  onClick={() => removeEducation(index)}
                  className="absolute -right-3 -top-3 w-12 h-12 rounded-full bg-white border border-red-50 text-red-100 hover:text-red-500 hover:shadow-lg transition-all flex items-center justify-center -rotate-12 group-hover:rotate-0"
                >
                  <Trash2 size={20} />
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-3 text-left">
                    <label className="text-[10px] font-black text-navy/30 uppercase tracking-widest ml-6">University / Institution</label>
                    <input
                      type="text"
                      placeholder="e.g. University of Manchester"
                      value={edu.institution}
                      onChange={(e) => updateEducation(index, "institution", e.target.value)}
                      className="w-full bg-white/80 border border-white/60 rounded-[2rem] px-8 py-5 text-navy font-bold focus:ring-4 focus:ring-blue-400/10 outline-none transition-all placeholder:text-navy/10 shadow-sm"
                    />
                  </div>
                  <div className="space-y-3 text-left">
                    <label className="text-[10px] font-black text-navy/30 uppercase tracking-widest ml-6">Degree / Graduation</label>
                    <input
                      type="text"
                      placeholder="e.g. BSc Chemistry (1st Class)"
                      value={edu.degree}
                      onChange={(e) => updateEducation(index, "degree", e.target.value)}
                      className="w-full bg-white/80 border border-white/60 rounded-[2rem] px-8 py-5 text-navy font-bold focus:ring-4 focus:ring-blue-400/10 outline-none transition-all placeholder:text-navy/10 shadow-sm"
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
              <div className="p-16 text-center border-2 border-dashed border-navy/5 rounded-[4rem] text-navy/20 font-black text-xs uppercase tracking-[0.3em] bg-navy/5">
                 No higher education added yet.
              </div>
            )}
          </div>
        </div>

        {/* Success Story */}
        <div className="space-y-4 text-left bg-blue-500/5 p-12 rounded-[3.5rem] border border-blue-500/10">
          <label className="flex items-center gap-2 text-[11px] font-black text-blue-600/60 uppercase tracking-[0.2em] ml-2">
            <BookCheck size={16} /> Example of Student Improvement
          </label>
          <p className="text-[10px] font-bold text-navy/30 uppercase tracking-widest ml-2 mb-4">Briefly share a case where you helped a student level up (e.g. Grade C → A)</p>
          <textarea
            placeholder="Case study: Worked with an A-Level Physics student for 3 months, focusing on Exam Technique. Result: Student improved from a C to a Predicted A*."
            value={data.success_story || ""}
            onChange={(e) => updateData({ success_story: e.target.value })}
            className="w-full bg-white/90 backdrop-blur-md border border-white/40 rounded-[2.5rem] px-10 py-8 text-navy font-bold focus:ring-4 focus:ring-blue-400/10 outline-none transition-all placeholder:text-navy/20 shadow-sm min-h-[160px] resize-none"
          />
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
            Calibrate Experience
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
