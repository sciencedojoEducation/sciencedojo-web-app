"use client";

import { motion } from "framer-motion";
import { ShieldCheck, FileCheck, Info, AlertTriangle, CheckSquare } from "lucide-react";
import PrivateUploader from "./PrivateUploader";

interface VerificationStageProps {
  data: any;
  updateData: (fields: any) => void;
  onComplete: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  userId: string;
  idUploaded: boolean;
  bgUploaded: boolean;
  setIdUploaded: (val: boolean) => void;
  setBgUploaded: (val: boolean) => void;
}

export default function VerificationStage({
  data,
  updateData,
  onComplete,
  onBack,
  isSubmitting,
  userId,
  idUploaded,
  bgUploaded,
  setIdUploaded,
  setBgUploaded
}: VerificationStageProps) {
  const isConsentChecked = data.gdpr_consent === "true";
  const isContractSigned = data.contract_signed === "true";
  const isReady = isConsentChecked && isContractSigned && idUploaded && bgUploaded;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-12"
    >
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-4xl font-black text-navy tracking-tight">Identity & Compliance 🛡️</h2>
        <p className="text-navy/60 font-medium italic">"Trust is the bridge between education and transformation."</p>
      </div>

      {/* Safeguarding Card */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/60 p-12 rounded-[3.5rem] relative overflow-hidden shadow-2xl text-left">
        <div className="absolute -right-10 -top-10 text-blue-500/5 transform rotate-12 scale-150">
          <ShieldCheck size={280} />
        </div>
        
        <div className="relative z-10 space-y-10">
          <div className="flex items-center gap-4 border-b border-navy/5 pb-6">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600">
              <Info size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-navy uppercase tracking-tight">Integrity Protocol</h3>
              <p className="text-[10px] font-black text-navy/20 uppercase tracking-[0.2em]">Verification Mandatory</p>
            </div>
          </div>

          <p className="text-navy/60 text-lg font-bold leading-relaxed max-w-2xl px-2">
             ScienceDojo maintains the highest levels of safety. We require one form of <span className="text-blue-600 font-black underline decoration-blue-500/30 decoration-4 underline-offset-4">Government Photo ID</span> and a <span className="text-blue-600 font-black underline decoration-blue-500/30 decoration-4 underline-offset-4">Clean Criminal Record Check</span>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
             {/* GDPR Consent */}
             <div className="flex items-start gap-6 bg-white/60 backdrop-blur-md p-8 rounded-[3rem] border border-white shadow-xl transition-all hover:bg-white hover:shadow-2xl group cursor-pointer" 
                  onClick={() => updateData({ gdpr_consent: isConsentChecked ? "false" : "true" })}>
               <div className={`w-10 h-10 rounded-2xl border-4 shrink-0 transition-all flex items-center justify-center ${isConsentChecked ? "bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/20" : "border-navy/5 bg-navy/5 group-hover:border-navy/10"}`}>
                 {isConsentChecked && <ShieldCheck size={22} className="text-white" strokeWidth={3} />}
               </div>
               <div className="space-y-1">
                 <p className="font-black text-navy text-sm leading-tight tracking-tight">GDPR Data Processing Consent</p>
                 <p className="text-[9px] font-black uppercase text-blue-600/60 tracking-[0.15em]">Sensitive Document Access</p>
               </div>
             </div>

             {/* Contract Sign CONCEPT */}
             <div className="flex items-start gap-6 bg-white/60 backdrop-blur-md p-8 rounded-[3rem] border border-white shadow-xl transition-all hover:bg-white hover:shadow-2xl group cursor-pointer" 
                  onClick={() => updateData({ contract_signed: isContractSigned ? "false" : "true" })}>
               <div className={`w-10 h-10 rounded-2xl border-4 shrink-0 transition-all flex items-center justify-center ${isContractSigned ? "bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/20" : "border-navy/5 bg-navy/5 group-hover:border-navy/10"}`}>
                 {isContractSigned && <CheckSquare size={22} className="text-white" strokeWidth={3} />}
               </div>
               <div className="space-y-1">
                 <p className="font-black text-navy text-sm leading-tight tracking-tight">Accept Sensei Terms & Agreement</p>
                 <p className="text-[9px] font-black uppercase text-blue-600/60 tracking-[0.15em]">The Dojo Code of Conduct</p>
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-10 transition-all duration-1000 ${isConsentChecked && isContractSigned ? "opacity-100 translate-y-0" : "opacity-10 translate-y-4 pointer-events-none grayscale blur-md"}`}>
        <div className="space-y-4 text-left">
          <label className="flex items-center gap-2 text-[11px] font-black text-navy/30 uppercase tracking-[0.2em] ml-8">
            <FileCheck size={16} className="text-blue-500" /> Verified Photo ID
          </label>
          <PrivateUploader 
            userId={userId} 
            docType="government_id" 
            label="Govt Issued ID Card"
            onUploadSuccess={() => setIdUploaded(true)} 
          />
        </div>

        <div className="space-y-4 text-left">
          <label className="flex items-center gap-2 text-[11px] font-black text-navy/30 uppercase tracking-[0.2em] ml-8">
            <ShieldCheck size={16} className="text-blue-500" /> Background Check (DBS)
          </label>
          <PrivateUploader 
            userId={userId} 
            docType="background_check" 
            label="DBS / Background Check"
            onUploadSuccess={() => setBgUploaded(true)} 
          />
        </div>
      </div>

      {/* Danger Zone Notice */}
      <div className="flex items-start gap-5 p-10 rounded-[3rem] bg-red-50/50 border border-red-100/50 backdrop-blur-sm text-left">
        <AlertTriangle className="text-red-400 shrink-0 mt-1" size={24} />
        <p className="text-red-900/40 text-[11px] font-black leading-relaxed italic uppercase tracking-widest">
          SYSTEM NOTICE: ANY ATTEMPT TO UPLOAD FRAUDULENT OR MISLEADING DOCUMENTATION WILL RESULT IN AN IMMEDIATE TERMINATION AND PERMANENT BAN. ALL FILES ARE VERIFIED BY CERTIFIED AUDITORS.
        </p>
      </div>

      <div className="flex gap-6 mt-10">
        <button
          onClick={onBack}
          className="px-10 py-6 bg-white/40 backdrop-blur-md border border-white/60 text-navy/40 hover:text-navy hover:bg-white/60 rounded-[2.5rem] font-black text-lg transition-all shadow-sm active:scale-95"
        >
          Back
        </button>
        <button
          onClick={onComplete}
          disabled={isSubmitting || !isReady}
          className={`flex-1 py-6 rounded-[2.5rem] font-black text-xl tracking-tight transition-all transform active:scale-95 flex items-center justify-center gap-4 group relative overflow-hidden shadow-xl ${
            isReady && !isSubmitting
              ? "bg-blue-600 text-white hover:bg-blue-500 hover:shadow-2xl hover:shadow-blue-500/20 shadow-blue-900/10" 
              : "bg-blue-50 text-blue-200 cursor-not-allowed shadow-none grayscale opacity-60"
          }`}
        >
          {isSubmitting ? (
            <motion.div 
               animate={{ rotate: 360 }} 
               transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
               className="w-6 h-6 border-4 border-white rounded-full border-t-transparent"
            />
          ) : (
            <div className="flex items-center gap-3 relative z-10 font-black">
               Finalize Sensei Path 
               <ShieldCheck size={24} className="group-hover:scale-125 transition-transform" strokeWidth={3} />
            </div>
          )}
          {isReady && !isSubmitting && (
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
