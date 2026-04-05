"use client";

import { motion } from "framer-motion";
import { ShieldCheck, FileCheck, Info, AlertTriangle, CheckSquare, ScrollText, CheckCircle2 } from "lucide-react";
import PrivateUploader from "./PrivateUploader";
import ComplianceModal from "./ComplianceModal";
import { useState } from "react";

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
  const [activeModal, setActiveModal] = useState<"gdpr" | "terms" | null>(null);

  const isGdprAccepted = data.gdpr_accepted === "true";
  const isTermsAccepted = data.terms_accepted === "true";
  const isReady = isGdprAccepted && isTermsAccepted && idUploaded && bgUploaded;

  const handleAccept = (type: "gdpr" | "terms") => {
    const timestamp = new Date().toLocaleString();
    if (type === "gdpr") {
      updateData({ gdpr_accepted: "true", gdpr_accepted_at: timestamp });
    } else {
      updateData({ terms_accepted: "true", terms_accepted_at: timestamp });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-4xl mx-auto space-y-12 pb-20"
    >
      <div className="space-y-4 text-center">
        <h2 className="text-5xl font-black text-navy tracking-tight leading-none">Identity & Compliance 🛡️</h2>
        <p className="text-navy/60 font-medium italic text-lg leading-relaxed max-w-2xl mx-auto">"Trust is the bridge between education and transformation."</p>
      </div>

      {/* Compliance Block */}
      <div className="bg-white/60 backdrop-blur-3xl border border-white p-12 rounded-[3.5rem] shadow-2xl space-y-12 text-left relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] translate-x-1/4 -translate-y-1/4">
           <ShieldCheck size={400} />
        </div>

        <div className="space-y-6 relative z-10">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-2xl font-black text-navy tracking-tight">Integrity Protocol</h3>
           </div>
           <p className="text-navy/70 text-lg font-bold leading-relaxed">ScienceDojo maintains the highest levels of safety. We require legal consent and background verification for all Senseis.</p>
        </div>

        <div className="w-full h-px bg-navy/5" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
           {/* GDPR Card */}
           <div 
             className={`p-8 rounded-[3rem] border-2 transition-all group cursor-pointer relative overflow-hidden ${
               isGdprAccepted 
                 ? "bg-blue-50/50 border-blue-200" 
                 : "bg-white border-navy/5 hover:border-blue-500/30 hover:shadow-2xl shadow-navy/5"
             }`}
             onClick={() => setActiveModal("gdpr")}
           >
              <div className="flex items-start justify-between mb-6">
                 <div className={`p-4 rounded-2xl ${isGdprAccepted ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform"}`}>
                    <ShieldCheck size={24} />
                 </div>
                 {isGdprAccepted && (
                    <div className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                       <CheckCircle2 size={12} /> Accepted
                    </div>
                 )}
              </div>
              <div className="space-y-1">
                 <h4 className="text-lg font-black text-navy leading-tight">GDPR Data Processing Consent</h4>
                 <p className="text-[10px] font-black text-navy/30 uppercase tracking-[0.2em]">{isGdprAccepted ? `Accepted on ${data.gdpr_accepted_at}` : "Sensitive Document Access"}</p>
              </div>
           </div>

           {/* Terms Card */}
           <div 
             className={`p-8 rounded-[3rem] border-2 transition-all group cursor-pointer relative overflow-hidden ${
               isTermsAccepted 
                 ? "bg-blue-50/50 border-blue-200" 
                 : "bg-white border-navy/5 hover:border-blue-500/30 hover:shadow-2xl shadow-navy/5"
             }`}
             onClick={() => setActiveModal("terms")}
           >
              <div className="flex items-start justify-between mb-6">
                 <div className={`p-4 rounded-2xl ${isTermsAccepted ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform"}`}>
                    <ScrollText size={24} />
                 </div>
                 {isTermsAccepted && (
                    <div className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                       <CheckCircle2 size={12} /> Accepted
                    </div>
                 )}
              </div>
              <div className="space-y-1">
                 <h4 className="text-lg font-black text-navy leading-tight">Accept Sensei Terms & Agreement</h4>
                 <p className="text-[10px] font-black text-navy/30 uppercase tracking-[0.2em]">{isTermsAccepted ? `Accepted on ${data.terms_accepted_at}` : "The Dojo Code of Conduct"}</p>
              </div>
           </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div className={`space-y-10 transition-all duration-700 ${isGdprAccepted && isTermsAccepted ? "opacity-100 scale-100" : "opacity-20 scale-95 pointer-events-none grayscale blur-sm"}`}>
        <div className="flex items-center gap-4 pl-8">
           <div className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center text-navy/40">
             <FileCheck size={20} />
           </div>
           <h3 className="text-xl font-black text-navy uppercase tracking-tight">Identity Verification</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4 text-left">
            <label className="text-[10px] font-black text-navy/30 uppercase tracking-[0.3em] ml-8">Verified Photo ID (Passport/Driving License)</label>
            <PrivateUploader 
              userId={userId} 
              docType="government_id" 
              label="Govt Issued ID Card"
              onUploadSuccess={(url: string) => {
                setIdUploaded(true);
                updateData({ government_id_url: url });
              }} 
            />
          </div>

          <div className="space-y-4 text-left">
            <label className="text-[10px] font-black text-navy/30 uppercase tracking-[0.3em] ml-8">Background Check (DBS / Clean Record)</label>
            <PrivateUploader 
              userId={userId} 
              docType="background_check" 
              label="DBS / Background Check"
              onUploadSuccess={(url: string) => {
                setBgUploaded(true);
                updateData({ background_check_url: url });
              }} 
            />
          </div>
        </div>

        {/* System Notice */}
        <div className="flex items-start gap-6 p-10 rounded-[3rem] bg-red-50/50 border border-red-100/50 backdrop-blur-sm">
          <AlertTriangle className="text-red-400 shrink-0 mt-1" size={24} />
          <p className="text-red-900/40 text-[10px] font-black leading-relaxed italic uppercase tracking-[0.2em]">
            SYSTEM NOTICE: ANY ATTEMPT TO UPLOAD FRAUDULENT OR MISLEADING DOCUMENTATION WILL RESULT IN AN IMMEDIATE TERMINATION AND PERMANENT BAN. ALL FILES ARE VERIFIED BY CERTIFIED AUDITORS.
          </p>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex justify-between items-center pt-10 border-t border-navy/5">
        <button
          onClick={onBack}
          className="px-10 py-6 bg-white border border-navy/5 text-navy/40 hover:text-navy rounded-[2.5rem] font-black text-lg transition-all shadow-sm active:scale-95"
        >
          Back
        </button>
        <button
          onClick={onComplete}
          disabled={isSubmitting || !isReady}
          className={`px-16 py-6 rounded-[2.5rem] font-black text-xl tracking-tight transition-all transform active:scale-95 flex items-center justify-center gap-4 group relative overflow-hidden shadow-xl ${
            isReady && !isSubmitting
              ? "bg-blue-600 text-white hover:bg-blue-500 hover:shadow-2xl hover:shadow-blue-500/20 shadow-blue-900/10" 
              : "bg-blue-50 text-blue-200 cursor-not-allowed shadow-none grayscale opacity-60"
          }`}
        >
          <span className="relative z-10 flex items-center gap-3">
             {isSubmitting ? "Encrypting Data..." : "Finalize Sensei Path"}
             {!isSubmitting && <ShieldCheck size={24} className="group-hover:scale-125 transition-transform" strokeWidth={3} />}
          </span>
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

      {/* Compliance Modals */}
      <ComplianceModal 
        isOpen={activeModal === "gdpr"} 
        onClose={() => setActiveModal(null)}
        onAccept={() => handleAccept("gdpr")}
        title="GDPR Data Processing Agreement"
        type="gdpr"
      />
      <ComplianceModal 
        isOpen={activeModal === "terms"} 
        onClose={() => setActiveModal(null)}
        onAccept={() => handleAccept("terms")}
        title="ScienceDojo Sensei Agreement"
        type="terms"
      />
    </motion.div>
  );
}
