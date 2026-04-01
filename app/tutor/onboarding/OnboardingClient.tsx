"use client";

import { useState } from "react";
import { submitTutorApplication } from "./actions";

interface Props {
  initialTutorData: any;
}

export default function OnboardingClient({ initialTutorData }: Props) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    bio: initialTutorData?.bio || "",
    hourly_rate: initialTutorData?.hourly_rate || "",
    subjects: initialTutorData?.subjects?.join(", ") || "",
    education_level: "",
    university: "",
    experience_summary: "",
    has_teaching_license: false,
    cv_url: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => setStep((s) => Math.min(s + 1, 3));
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, typeof value === "boolean" ? (value ? "on" : "") : String(value));
    });

    try {
      await submitTutorApplication(data);
      // Let the server action redirect
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-500">
      {/* Progress Tracker */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-secondary/40 mb-6">
        <span className={step >= 1 ? "text-primary" : ""}>Step 1: Basics</span>
        <span className="w-4 h-[2px] bg-slate-200"></span>
        <span className={step >= 2 ? "text-primary" : ""}>Step 2: Qualifications</span>
        <span className="w-4 h-[2px] bg-slate-200"></span>
        <span className={step >= 3 ? "text-primary" : ""}>Step 3: Verification Docs</span>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold">
          {error}
        </div>
      )}

      {/* STEP 1: Basics */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-black text-secondary/40 uppercase tracking-widest mb-2">Professional Bio</label>
            <textarea
              name="bio"
              required
              rows={4}
              className="w-full p-4 rounded-2xl border border-secondary/10 bg-slate-50 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-secondary"
              placeholder="e.g. PhD student with 5 years experience..."
              value={formData.bio}
              onChange={handleChange}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-secondary/40 uppercase tracking-widest mb-2">Hourly Rate (£)</label>
              <input
                name="hourly_rate"
                type="number"
                required
                className="w-full p-4 rounded-2xl border border-secondary/10 bg-slate-50 focus:outline-none font-black text-secondary"
                placeholder="25"
                value={formData.hourly_rate}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-xs font-black text-secondary/40 uppercase tracking-widest mb-2">Subjects (CSV)</label>
              <input
                name="subjects"
                type="text"
                required
                className="w-full p-4 rounded-2xl border border-secondary/10 bg-slate-50 focus:outline-none font-bold text-secondary text-sm"
                placeholder="Math, Chemistry"
                value={formData.subjects}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Credentials */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-secondary/40 uppercase tracking-widest mb-2">Highest Degree</label>
              <select
                name="education_level"
                required
                className="w-full p-4 rounded-2xl border border-secondary/10 bg-slate-50 focus:outline-none focus:border-primary font-bold text-secondary text-sm"
                value={formData.education_level}
                onChange={handleChange}
              >
                <option value="" disabled>Select Level...</option>
                <option value="High School">High School</option>
                <option value="Associate">Associate Degree</option>
                <option value="Bachelor's">Bachelor's Degree</option>
                <option value="Master's">Master's Degree</option>
                <option value="PhD">Doctorate (PhD)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-secondary/40 uppercase tracking-widest mb-2">University / Institution</label>
              <input
                name="university"
                type="text"
                required
                className="w-full p-4 rounded-2xl border border-secondary/10 bg-slate-50 focus:outline-none font-bold text-secondary text-sm"
                placeholder="e.g. University of Oxford"
                value={formData.university}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-secondary/40 uppercase tracking-widest mb-2">Teaching Experience Summary</label>
            <textarea
              name="experience_summary"
              required
              rows={3}
              className="w-full p-4 rounded-2xl border border-secondary/10 bg-slate-50 focus:outline-none focus:border-primary transition-all font-medium text-secondary"
              placeholder="e.g. 3 years tutoring A-Level Physics privately..."
              value={formData.experience_summary}
              onChange={handleChange}
            />
          </div>

          <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-secondary/10">
            <input
              type="checkbox"
              name="has_teaching_license"
              id="licenseToggle"
              className="w-5 h-5 accent-primary rounded cursor-pointer"
              checked={formData.has_teaching_license}
              onChange={handleChange}
            />
            <label htmlFor="licenseToggle" className="text-sm font-bold text-secondary/70 cursor-pointer">
              I hold a formal, valid teaching license (e.g., PGCE, QTS)
            </label>
          </div>
        </div>
      )}

      {/* STEP 3: CV & Verification docs */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl text-indigo-900">
            <h3 className="font-black text-lg mb-2 flex items-center gap-2">
              <span className="text-2xl">📧</span> Document Authentication
            </h3>
            <p className="text-sm font-medium leading-relaxed">
              We require new tutors to securely email a copy of their <strong>Photo ID</strong> and <strong>Highest Degree Certificate</strong> for identity vetting.
            </p>
            <p className="text-sm font-black mt-2 bg-indigo-100 p-3 rounded-lg text-center select-all">
              verifications@sciencedojo.com
            </p>
          </div>

          <div>
            <label className="block text-xs font-black text-secondary/40 uppercase tracking-widest mb-2">Professional Profile (LinkedIn/CV Link)</label>
            <input
              name="cv_url"
              type="url"
              required
              className="w-full p-4 rounded-2xl border border-secondary/10 bg-slate-50 focus:outline-none focus:border-primary font-bold text-secondary text-sm"
              placeholder="https://linkedin.com/in/yourname"
              value={formData.cv_url}
              onChange={handleChange}
            />
            <p className="text-xs text-secondary/40 italic mt-2">
              Please provide a link to your LinkedIn profile or a hosted CV (like Google Drive).
            </p>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="pt-6 flex justify-between">
        {step > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            className="px-6 py-3 font-bold text-secondary/50 hover:text-secondary hover:bg-slate-50 rounded-xl transition-all"
          >
            ← Back
          </button>
        ) : (
          <div></div> // Spacer
        )}
        
        {step < 3 ? (
          <button
            type="button"
            onClick={handleNext}
            className="px-8 py-3 bg-secondary text-white font-black rounded-xl hover:bg-secondary/90 transition-all shadow-md active:scale-95"
          >
            Next Step →
          </button>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-primary text-white font-black rounded-xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </button>
        )}
      </div>
    </form>
  );
}
