"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { saveApplicationStage } from "./actions";
import WhiteBeltStage from "./WhiteBeltStage";
import BlueBeltStage from "./BlueBeltStage";
import BlackBeltStage from "./BlackBeltStage";
import confetti from "canvas-confetti";

interface OnboardingStepperProps {
  initialData: any;
  userId: string;
}

export default function OnboardingStepper({ initialData, userId }: OnboardingStepperProps) {
  const [stage, setStage] = useState(1);
  const [formData, setFormData] = useState(initialData || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stage 3 local states (we'll move these to a component later)
  const [idUploaded, setIdUploaded] = useState(false);
  const [bgUploaded, setBgUploaded] = useState(false);

  const updateFormData = (fields: any) => {
    setFormData((prev: any) => ({ ...prev, ...fields }));
  };

  const handleNext = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      // Create FormData compatible with current server action structure
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          data.append(key, value.join(","));
        } else {
          data.append(key, String(value));
        }
      });

      await saveApplicationStage(stage, data);
      
      if (stage === 3) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#00F5D4", "#0A192F", "#FFFFFF"]
        });
        setStage(4); // Success state
      } else {
        setStage((s) => s + 1);
      }
    } catch (err: any) {
      setError(err.message || "Failed to save progress.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setStage((s) => Math.max(1, s - 1));
  };

  if (stage === 4) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-20 px-6 rounded-[3rem] bg-white shadow-2xl border-4 border-mint/20"
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
    { id: 1, name: "White Belt", color: "bg-white border-navy/10" },
    { id: 2, name: "Blue Belt", color: "bg-blue-500 shadow-blue-200" },
    { id: 3, name: "Black Belt", color: "bg-navy shadow-navy-200" }
  ];

  return (
    <div className="space-y-12">
      {/* Premium Progress Bar (Belt Themed) */}
      <div className="relative pt-8">
        <div className="flex justify-between relative z-10">
          {stages.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-3">
              <motion.div
                animate={{ 
                  scale: stage === s.id ? 1.2 : 1,
                  opacity: stage >= s.id ? 1 : 0.4
                }}
                className={`w-14 h-6 rounded-full border-2 transition-all ${
                  stage >= s.id ? s.color : "bg-slate-100 border-slate-200"
                } ${stage === s.id ? "ring-4 ring-mint/30" : ""}`}
              />
              <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                stage >= s.id ? "text-navy" : "text-navy/20"
              }`}>
                {s.name}
              </span>
            </div>
          ))}
        </div>
        {/* Connection Line */}
        <div className="absolute top-[calc(2rem+0.75rem)] left-0 w-full h-[2px] bg-slate-100 -z-0">
          <motion.div 
            className="h-full bg-navy/20"
            initial={{ width: "0%" }}
            animate={{ width: `${((stage - 1) / 2) * 100}%` }}
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
      <div className="min-h-[500px] relative">
        <AnimatePresence mode="wait">
          {stage === 1 && (
            <WhiteBeltStage 
              key="stage1"
              data={formData} 
              updateData={updateFormData} 
              onNext={handleNext} 
            />
          )}
          {stage === 2 && (
            <BlueBeltStage 
              key="stage2"
              data={formData} 
              updateData={updateFormData} 
              onNext={handleNext} 
              onBack={handleBack}
            />
          )}
          {stage === 3 && (
            <BlackBeltStage 
              key="stage3"
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
