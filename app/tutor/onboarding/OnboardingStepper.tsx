"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { saveApplicationStage } from "./actions";
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
  const [error, setError] = useState<string | null>(null);

  // Initialize file states from DB if they exist
  const [idUploaded, setIdUploaded] = useState(!!initialData?.data?.government_id_url);
  const [bgUploaded, setBgUploaded] = useState(!!initialData?.data?.background_check_url);

  const updateFormData = (fields: any) => {
    setFormData((prev: any) => ({ ...prev, ...fields }));
  };

  const handleNext = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      // Create FormData compatible with current server action structure
      await saveApplicationStage(stage, formData);
      
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

  const handleBack = () => {
    setStage((s: number) => Math.max(1, s - 1));
  };

  if (stage === 7) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-20 px-6 rounded-[3rem] bg-white/80 backdrop-blur-xl shadow-2xl border-4 border-blue-100"
      >
        <div className="w-32 h-32 bg-mint/10 rounded-full mx-auto flex items-center justify-center mb-8 border-8 border-mint/20">
          <span className="text-6xl">🎓</span>
        </div>
        <h2 className="text-4xl font-black text-navy mb-4 tracking-tight">Calibration Complete!</h2>
        <p className="text-navy/50 font-medium max-w-sm mx-auto text-lg leading-relaxed">
          Your Sensei profile is now being reviewed by our Grandmasters. Expect a decision within <span className="text-navy font-bold">48 hours</span>.
        </p>
        
        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="px-8 py-3 bg-navy text-mint font-black uppercase tracking-[0.3em] text-xs rounded-full">
            Status: Black Belt Pending
          </div>
          <p className="text-[10px] font-black text-navy/20 uppercase tracking-widest">
            Encryption ID: {userId.slice(0, 8)}...
          </p>
        </div>
      </motion.div>
    );
  }

  const stages = [
    { id: 1, name: "Screening", color: "bg-white border-navy/10" },
    { id: 2, name: "Pedigree", color: "bg-blue-200 shadow-blue-100" },
    { id: 3, name: "Philosophy", color: "bg-blue-400 shadow-blue-200" },
    { id: 4, name: "Demo", color: "bg-blue-600 shadow-blue-400" },
    { id: 5, name: "Logistics", color: "bg-navy shadow-navy-200" },
    { id: 6, name: "Verification", color: "bg-black shadow-black/20" }
  ];

  return (
    <div className="space-y-12">
      {/* Premium Progress Bar (Sensei Path) */}
      <div className="relative pt-8">
        <div className="flex justify-between relative z-10 w-full max-w-4xl mx-auto">
          {stages.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-3">
              <motion.div
                animate={{ 
                  scale: stage === s.id ? 1.2 : 1,
                  opacity: stage >= s.id ? 1 : 0.4
                }}
                className={`w-10 h-3 md:w-16 md:h-4 rounded-full border transition-all ${
                  stage >= s.id ? s.color : "bg-slate-100 border-slate-200"
                } ${stage === s.id ? "ring-4 ring-blue-400/30" : ""}`}
              />
              <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-colors ${
                stage === s.id ? "text-blue-600" : stage > s.id ? "text-navy" : "text-navy/20"
              }`}>
                {s.name}
              </span>
            </div>
          ))}
        </div>
        {/* Connection Line */}
        <div className="absolute top-[calc(2rem+0.75rem)] left-[10%] right-[10%] h-[2px] bg-slate-100 -z-0">
          <motion.div 
            className="h-full bg-blue-500/20"
            initial={{ width: "0%" }}
            animate={{ width: `${((stage - 1) / 5) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 bg-red-50 border-2 border-red-100 rounded-3xl text-red-600 text-sm font-bold flex items-center gap-3"
        >
          <span className="text-xl">⚠️</span> {error}
        </motion.div>
      )}

      {/* Stage Transitioning */}
      <div className="min-h-[600px] relative">
        <AnimatePresence mode="wait">
          {stage === 1 && (
            <ScreeningStage 
              key="stage1"
              data={formData} 
              userId={userId}
              updateData={updateFormData} 
              onNext={handleNext} 
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
            />
          )}
          {stage === 3 && (
            <TeachingFitStage 
              key="stage3"
              data={formData} 
              updateData={updateFormData} 
              onNext={handleNext} 
              onBack={handleBack}
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
            />
          )}
          {stage === 5 && (
            <LogisticsStage 
              key="stage5"
              data={formData} 
              updateData={updateFormData} 
              onNext={handleNext} 
              onBack={handleBack}
            />
          )}
          {stage === 6 && (
            <VerificationStage 
              key="stage6"
              data={formData}
              updateData={updateFormData}
              onComplete={handleNext}
              onBack={handleBack}
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
    </div>
  );
}
