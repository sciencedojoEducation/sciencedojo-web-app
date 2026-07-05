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
  onSaveDraft: () => void;
  isSavingDraft: boolean;
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
  onSaveDraft,
  isSavingDraft,
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
  const isReady = isGdprAccepted && isTermsAccepted && idUploaded;

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
      className="rounded-[1.75rem] border border-blue-100 bg-white/92 p-5 shadow-xl shadow-navy/5 backdrop-blur-xl sm:p-7 md:p-10"
    >
      <div className="space-y-2 text-left">
        <p className="text-sm font-black text-primary">Step 6 of 6</p>
        <h2 className="text-2xl font-black tracking-tight text-navy md:text-3xl">Final Review</h2>
        <p className="text-sm font-medium text-navy/60 md:text-base">Complete the final agreements and photo ID check so our team can review your application.</p>
      </div>

      {/* Compliance Block */}
      <div className="relative mt-8 space-y-8 overflow-hidden rounded-[1.5rem] border border-navy/8 bg-slate-50/80 p-5 text-left md:p-6">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] translate-x-1/4 -translate-y-1/4">
           <ShieldCheck size={400} />
        </div>

        <div className="space-y-6 relative z-10">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-black tracking-tight text-navy">Verification & agreements</h3>
           </div>
           <p className="text-sm font-semibold leading-relaxed text-navy/65">ScienceDojo maintains a high-trust learning environment. We require legal consent and identity verification for all tutors.</p>
        </div>

        <div className="w-full h-px bg-navy/5" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
           {/* GDPR Card */}
           <div 
             className={`relative cursor-pointer overflow-hidden rounded-[1.5rem] border p-5 transition-all ${
               isGdprAccepted 
                 ? "border-blue-200 bg-blue-50/50" 
                 : "border-navy/8 bg-white hover:border-blue-500/30"
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
                 <h4 className="text-base font-black leading-tight text-navy">GDPR Data Processing Consent</h4>
                 <p className="text-xs font-bold text-navy/40">{isGdprAccepted ? `Accepted on ${data.gdpr_accepted_at}` : "Sensitive document access"}</p>
              </div>
           </div>

           {/* Terms Card */}
           <div 
             className={`relative cursor-pointer overflow-hidden rounded-[1.5rem] border p-5 transition-all ${
               isTermsAccepted 
                 ? "border-blue-200 bg-blue-50/50" 
                 : "border-navy/8 bg-white hover:border-blue-500/30"
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
                 <h4 className="text-base font-black leading-tight text-navy">Accept Tutor Terms & Agreement</h4>
                 <p className="text-xs font-bold text-navy/40">{isTermsAccepted ? `Accepted on ${data.terms_accepted_at}` : "ScienceDojo teaching standards"}</p>
              </div>
           </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div className={`mt-8 space-y-6 transition-all duration-700 ${isGdprAccepted && isTermsAccepted ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-25 grayscale"}`}>
        <div className="flex items-center gap-4 pl-8">
           <div className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center text-navy/40">
             <FileCheck size={20} />
           </div>
           <h3 className="text-lg font-black text-navy">Identity Verification</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4 text-left">
            <label className="text-xs font-bold text-navy/55">Verified Photo ID (Passport/Driving License)</label>
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
            <label className="text-xs font-bold text-navy/55">DBS / Police Clearance (for verified badge)</label>
            <p className="text-xs font-semibold leading-relaxed text-navy/45">
              {bgUploaded
                ? "Background clearance uploaded. Admin will review it before awarding the Verified Tutor badge."
                : "You can submit this now or later. UK tutors may use DBS; non-UK tutors can provide an equivalent police or background clearance."}
            </p>
            <PrivateUploader 
              userId={userId} 
              docType="background_check" 
              label="DBS / Police Clearance"
              onUploadSuccess={(url: string) => {
                setBgUploaded(true);
                updateData({ background_check_url: url });
              }} 
            />
          </div>
        </div>

        {/* Document accuracy notice */}
        <div className="flex items-start gap-4 rounded-[1.5rem] border border-red-100/70 bg-red-50/50 p-5">
          <AlertTriangle className="text-red-400 shrink-0 mt-1" size={24} />
          <p className="text-sm font-semibold leading-relaxed text-red-900/55">
            Please upload accurate documents. Misleading documentation may lead to application rejection, loss of verified status, or account review.
          </p>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="mt-8 flex flex-col gap-4 border-t border-navy/8 pt-6 md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-semibold text-navy/55">You can save and continue later</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button onClick={onBack} className="min-h-11 rounded-xl border border-navy/10 bg-white px-5 py-3 text-sm font-bold text-navy/65 transition-colors hover:border-primary/30 hover:text-navy">Back</button>
          <button onClick={onSaveDraft} disabled={isSavingDraft} className="min-h-11 rounded-xl border border-navy/10 bg-white px-5 py-3 text-sm font-bold text-navy/65 transition-colors hover:border-primary/30 hover:text-navy disabled:opacity-60">{isSavingDraft ? "Saving..." : "Save Draft"}</button>
          <button onClick={onComplete} disabled={isSubmitting || !isReady} className={`min-h-11 rounded-xl px-6 py-3 text-sm font-black transition-all active:scale-95 ${isReady && !isSubmitting ? "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-blue-500" : "cursor-not-allowed bg-blue-50 text-blue-200"}`}>
            {isSubmitting ? "Submitting application..." : "Submit Application →"}
          </button>
        </div>
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
        title="ScienceDojo Tutor Agreement"
        type="terms"
      />
    </motion.div>
  );
}
