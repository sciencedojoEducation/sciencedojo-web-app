"use client";

import { motion } from "framer-motion";
import { ShieldCheck, FileCheck, Info, AlertTriangle } from "lucide-react";
import PrivateUploader from "./PrivateUploader";

interface BlackBeltStageProps {
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

export default function BlackBeltStage({
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
}: BlackBeltStageProps) {
  const isConsentChecked = data.gdpr_consent === "true";
  const isReady = isConsentChecked && idUploaded && bgUploaded;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-navy tracking-tight">Black Belt: Identity & Trust 🛡️</h2>
        <p className="text-navy/60 font-medium italic">"The path of the teacher is built on a foundation of integrity."</p>
      </div>

      {/* GDPR Section */}
      <div className="bg-amber-50 border-2 border-amber-100 p-8 rounded-[3rem] relative overflow-hidden ring-1 ring-amber-200">
        <div className="absolute -right-4 -top-4 text-amber-100 opacity-20 transform rotate-12 scale-150">
          <ShieldCheck size={160} />
        </div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-200 rounded-lg text-amber-800">
              <Info size={18} />
            </div>
            <h3 className="text-sm font-black text-amber-900 uppercase tracking-widest">Safeguarding Protocol</h3>
          </div>

          <p className="text-amber-900/70 text-sm font-medium leading-relaxed max-w-xl">
            To ensure the deepest levels of safety for our students, we require one form of <span className="text-amber-900 font-bold">Government Photo ID</span> and a <span className="text-amber-900 font-bold">Clean Criminal Record Check</span> (DBS/equivalent). 
            These files are uploaded to an encrypted, restricted-access vault and will <span className="underline decoration-amber-300 decoration-2">never</span> be used for marketing or public display.
          </p>

          <div className="flex items-start gap-4 bg-white p-6 rounded-2xl border-2 border-amber-200 shadow-sm transition-all hover:border-amber-400 group cursor-pointer" 
               onClick={() => updateData({ gdpr_consent: isConsentChecked ? "false" : "true" })}>
            <div className={`w-7 h-7 rounded-lg border-2 shrink-0 transition-all flex items-center justify-center ${isConsentChecked ? "bg-navy border-navy" : "border-amber-200 group-hover:border-amber-400"}`}>
              {isConsentChecked && <ShieldCheck size={16} className="text-mint" />}
            </div>
            <div className="space-y-1">
              <p className="font-bold text-navy text-sm leading-tight">
                I consent to ScienceDojo processing my sensitive identity documents exclusively for background verification.
              </p>
              <p className="text-[10px] font-black uppercase text-navy/20 tracking-widest">Mandatory for certification</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-700 ${isConsentChecked ? "opacity-100 scale-100" : "opacity-20 scale-95 blur-sm pointer-events-none"}`}>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-xs font-black text-navy/40 uppercase tracking-widest ml-4">
            <FileCheck size={14} /> Govt Issued Photo ID
          </label>
          <PrivateUploader 
            userId={userId} 
            docType="government_id" 
            onUploadSuccess={() => setIdUploaded(true)} 
          />
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-xs font-black text-navy/40 uppercase tracking-widest ml-4">
            <ShieldCheck size={14} /> Background Check (DBS)
          </label>
          <PrivateUploader 
            userId={userId} 
            docType="background_check" 
            onUploadSuccess={() => setBgUploaded(true)} 
          />
        </div>
      </div>

      {/* Warning Box */}
      <div className="flex items-start gap-4 p-5 rounded-2xl bg-red-50 border border-red-100">
        <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={18} />
        <p className="text-red-900/60 text-[11px] font-bold leading-relaxed italic">
          Uploading fraudulent or misleading documents will result in an immediate and permanent ban from the ScienceDojo network. Documentation must be current and clear.
        </p>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          onClick={onBack}
          className="px-8 py-5 bg-white border border-navy/10 text-navy/40 hover:text-navy rounded-[2rem] font-black text-lg transition-all transform active:scale-95"
        >
          Back
        </button>
        <button
          onClick={onComplete}
          disabled={isSubmitting || !isReady}
          className="flex-1 py-5 bg-navy hover:bg-black text-mint rounded-[2rem] font-black text-lg tracking-tight shadow-2xl shadow-navy/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed transform active:scale-95 flex items-center justify-center gap-3 group relative overflow-hidden"
        >
          {isSubmitting ? (
            <motion.div 
               animate={{ rotate: 360 }} 
               transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
               className="w-5 h-5 border-2 border-mint rounded-full border-t-transparent"
            />
          ) : (
            <>Complete Calibration <ShieldCheck size={20} className="group-hover:scale-125 transition-transform" /></>
          )}
          {isReady && !isSubmitting && (
            <motion.div 
               initial={{ x: "-100%" }}
               animate={{ x: "100%" }}
               transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
               className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
            />
          )}
        </button>
      </div>
    </motion.div>
  );
}
