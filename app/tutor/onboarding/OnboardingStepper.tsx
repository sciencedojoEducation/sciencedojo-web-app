"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { saveApplicationStage } from "./actions";
import { Award, Check, CheckCircle2, Globe2, Scale, ShieldCheck, Sparkles } from "lucide-react";
import ScreeningStage from "./ScreeningStage";
import AcademicExperienceStage from "./AcademicExperienceStage";
import TeachingFitStage from "./TeachingFitStage";
import DemoSkillStage from "./DemoSkillStage";
import LogisticsStage from "./LogisticsStage";
import VerificationStage from "./VerificationStage";
import confetti from "canvas-confetti";

interface OnboardingStepperProps {
  initialData: any;
  userId: string;
}

export default function OnboardingStepper({ initialData, userId }: OnboardingStepperProps) {
  const [stage, setStage] = useState(initialData?.data?.current_stage || 1);
  const [formData, setFormData] = useState(initialData?.data || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftMessage, setDraftMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Restore file states from DB if they exist.
  const [idUploaded, setIdUploaded] = useState(!!initialData?.data?.government_id_url);
  const [bgUploaded, setBgUploaded] = useState(!!initialData?.data?.background_check_url);

  const updateFormData = (fields: any) => {
    setFormData((prev: any) => ({ ...prev, ...fields }));
  };

  const handleNext = async () => {
    setError(null);
    setDraftMessage(null);
    setIsSubmitting(true);
    try {
      // Create FormData compatible with current server action structure
      await saveApplicationStage(stage, formData, { advance: true });
      
      if (stage === 6) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#2563EB", "#0A192F", "#FFFFFF"]
        });
        setStage(7); // Success state
      } else {
        setStage((s: number) => s + 1);
      }
    } catch (err: any) {
      setError(err.message || "Failed to save progress.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setError(null);
    setDraftMessage(null);
    setIsSavingDraft(true);
    try {
      await saveApplicationStage(stage, formData, { advance: false });
      setDraftMessage("Draft saved. You can continue when you are ready.");
    } catch (err: any) {
      setError(err.message || "Failed to save draft.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleBack = () => {
    setStage((s: number) => Math.max(1, s - 1));
  };

  if (stage === 7) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto max-w-2xl rounded-[2rem] border border-blue-100 bg-white/90 px-6 py-14 text-center shadow-xl shadow-navy/5 backdrop-blur-xl md:px-12"
      >
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-mint/20 bg-mint/10 text-mint">
          <CheckCircle2 size={38} strokeWidth={2.4} />
        </div>
        <h2 className="mb-4 text-3xl font-black tracking-tight text-navy md:text-4xl">Application submitted</h2>
        <p className="mx-auto max-w-md text-base font-medium leading-relaxed text-navy/60 md:text-lg">
          Thank you for applying to ScienceDojo. Our team will review your application and usually responds within 48 hours.
        </p>
        
        <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-5 py-2 text-sm font-bold text-blue-700">
          <Sparkles size={16} />
          Status: Under review
        </div>
      </motion.div>
    );
  }

  const stages = [
    { id: 1, name: "Profile" },
    { id: 2, name: "Experience" },
    { id: 3, name: "Teaching Style" },
    { id: 4, name: "Demo Lesson" },
    { id: 5, name: "Availability" },
    { id: 6, name: "Review & Submit" },
  ];

  return (
    <div className="space-y-8 md:space-y-10">
      <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <div className="relative flex min-w-[680px] items-start justify-between gap-4 md:min-w-0">
          <div className="absolute left-8 right-8 top-5 h-px bg-navy/12" />
          <motion.div
            className="absolute left-8 top-5 h-px bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: `${((Math.min(stage, 6) - 1) / 5) * 100}%` }}
            transition={{ type: "spring", stiffness: 80, damping: 18 }}
          />
          {stages.map((s) => {
            const isActive = stage === s.id;
            const isDone = stage > s.id;
            return (
              <div key={s.id} className="relative z-10 flex w-28 flex-col items-center gap-3 text-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-black shadow-sm transition-all ${
                    isActive
                      ? "border-primary bg-primary text-white shadow-primary/20"
                      : isDone
                        ? "border-primary/20 bg-white text-primary"
                        : "border-navy/15 bg-white text-navy/50"
                  }`}
                >
                  {isDone ? <Check size={16} strokeWidth={3} /> : s.id}
                </div>
                <span className={`text-xs font-bold leading-tight ${isActive ? "text-primary" : isDone ? "text-navy" : "text-navy/45"}`}>
                  {s.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600"
        >
          {error}
        </motion.div>
      )}
      {draftMessage && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-2xl border border-mint/20 bg-mint/10 p-4 text-sm font-bold text-mint-700"
        >
          <CheckCircle2 size={16} />
          {draftMessage}
        </motion.div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            {stage === 1 && (
              <ScreeningStage 
                key="stage1"
                data={formData} 
                userId={userId}
                updateData={updateFormData} 
                onNext={handleNext}
                onSaveDraft={handleSaveDraft}
                isSavingDraft={isSavingDraft}
              />
            )}
            {stage === 2 && (
              <AcademicExperienceStage 
                key="stage2"
                data={formData} 
                userId={userId}
                updateData={updateFormData} 
                onNext={handleNext} 
                onBack={handleBack}
                onSaveDraft={handleSaveDraft}
                isSavingDraft={isSavingDraft}
              />
            )}
            {stage === 3 && (
              <TeachingFitStage 
                key="stage3"
                data={formData} 
                updateData={updateFormData} 
                onNext={handleNext} 
                onBack={handleBack}
                onSaveDraft={handleSaveDraft}
                isSavingDraft={isSavingDraft}
              />
            )}
            {stage === 4 && (
              <DemoSkillStage 
                key="stage4"
                data={formData} 
                userId={userId}
                updateData={updateFormData} 
                onNext={handleNext} 
                onBack={handleBack}
                onSaveDraft={handleSaveDraft}
                isSavingDraft={isSavingDraft}
              />
            )}
            {stage === 5 && (
              <LogisticsStage 
                key="stage5"
                data={formData} 
                updateData={updateFormData} 
                onNext={handleNext} 
                onBack={handleBack}
                onSaveDraft={handleSaveDraft}
                isSavingDraft={isSavingDraft}
              />
            )}
            {stage === 6 && (
              <VerificationStage 
                key="stage6"
                data={formData}
                updateData={updateFormData}
                onComplete={handleNext}
                onBack={handleBack}
                onSaveDraft={handleSaveDraft}
                isSavingDraft={isSavingDraft}
                isSubmitting={isSubmitting}
                userId={userId}
                idUploaded={idUploaded}
                bgUploaded={bgUploaded}
                setIdUploaded={setIdUploaded}
                setBgUploaded={setBgUploaded}
              />
            )}
        </AnimatePresence>
        </div>
        <TrustPanel />
      </div>
    </div>
  );
}

function TrustPanel() {
  const points = [
    {
      title: "Verified & Trusted",
      body: "Every tutor completes a review process designed to protect students and maintain teaching quality.",
      icon: ShieldCheck,
    },
    {
      title: "Teach Global Students",
      body: "Support motivated learners online across GCSE, IGCSE, IB, A-Level, and STEM subjects.",
      icon: Globe2,
    },
    {
      title: "Grow With Us",
      body: "Access clearer teaching workflows, platform guidance, and ongoing support as ScienceDojo grows.",
      icon: Award,
    },
    {
      title: "Fair & Transparent",
      body: "Clear expectations, respectful policies, and platform support for your time and expertise.",
      icon: Scale,
    },
  ];

  return (
    <aside className="rounded-[1.75rem] border border-blue-100 bg-white/72 p-6 shadow-xl shadow-navy/5 backdrop-blur-xl lg:sticky lg:top-8">
      <h2 className="mb-6 text-xl font-black tracking-tight text-navy">Why tutor with ScienceDojo?</h2>
      <div className="space-y-6">
        {points.map(({ title, body, icon: Icon }) => (
          <div key={title} className="flex gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/8 text-primary">
              <Icon size={21} strokeWidth={2.2} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-navy">{title}</h3>
              <p className="text-sm font-medium leading-relaxed text-navy/58">{body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-[1.5rem] border border-navy/8 bg-white p-5 shadow-sm">
        <p className="text-3xl font-serif leading-none text-primary">“</p>
        <p className="mt-1 text-sm font-semibold leading-relaxed text-navy/68">
          ScienceDojo is built for tutors who care about clarity, trust, and helping students make steady progress.
        </p>
        <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-navy/35">ScienceDojo tutor support</p>
      </div>

      <div className="mt-4 rounded-[1.5rem] border border-primary/15 bg-primary/5 p-5">
        <h3 className="text-sm font-black text-navy">Need help with your application?</h3>
        <p className="mt-2 text-sm font-medium leading-relaxed text-navy/58">
          Find guidance on documents, profile setup, verification, and what happens after you apply.
        </p>
        <Link
          href="/support/tutors"
          className="mt-4 inline-flex text-sm font-black text-primary transition-colors hover:text-primary-hover"
        >
          View Tutor Support →
        </Link>
      </div>
    </aside>
  );
}
