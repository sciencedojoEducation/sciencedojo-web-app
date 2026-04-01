"use client";

import { useState, useEffect } from "react";
import { saveApplicationStage } from "./actions";
import YoutubePreview from "./YoutubePreview";
import PrivateUploader from "./PrivateUploader";

export default function OnboardingStepper({ initialData, userId }: { initialData: any, userId: string }) {
  // Determine which stage to start on based on DB state
  let initialStage = 1;
  if (initialData?.university && initialData?.subjects?.length > 0) initialStage = 2;
  if (initialData?.youtube_url) initialStage = 3;
  if (initialData?.status === 'pending') initialStage = 4; // Completed

  const [stage, setStage] = useState(initialStage);
  
  // Stage 1 Fields
  const [fullName, setFullName] = useState(initialData?.full_name || "");
  const [university, setUniversity] = useState(initialData?.university || "");
  const [subjects, setSubjects] = useState(initialData?.subjects?.join(", ") || "");

  // Stage 2 Fields
  const [youtubeUrl, setYoutubeUrl] = useState(initialData?.youtube_url || "");

  // Stage 3 Fields
  const [consent, setConsent] = useState(!!initialData?.consent_timestamp);
  const [idUploaded, setIdUploaded] = useState(false);
  const [bgUploaded, setBgUploaded] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStageNavigation = async (nextStage: number) => {
    setError(null);
    setIsSubmitting(true);
    
    try {
      const data = new FormData();
      if (stage === 1) {
        data.append("full_name", fullName);
        data.append("university", university);
        data.append("subjects", subjects);
      } else if (stage === 2) {
        data.append("youtube_url", youtubeUrl);
      } else if (stage === 3) {
        data.append("gdpr_consent", consent ? "true" : "false");
      }

      await saveApplicationStage(stage, data);
      setStage(nextStage);
    } catch (err: any) {
      setError(err.message || "Failed to save progress.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (stage === 4) {
    return (
      <div className="text-center py-12 animate-in slide-in-from-bottom-4 duration-500">
         <div className="w-24 h-24 bg-green-50 rounded-full mx-auto flex items-center justify-center border-4 border-green-100 mb-6">
            <span className="text-4xl">🎉</span>
         </div>
         <h2 className="text-2xl font-black tracking-tight text-slate-800 mb-2">Application Secured</h2>
         <p className="text-slate-500 font-medium max-w-sm mx-auto">
            Your credentials and private documents are securely stored in our vault. An Admin will review them within 48 hours.
         </p>
         <button className="mt-8 px-6 py-2 bg-slate-100 font-bold uppercase tracking-widest text-[10px] rounded-full text-slate-500 cursor-default">Status: Pending Review</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      <div className="flex gap-2">
         {[1, 2, 3].map(step => (
           <div key={step} className={`h-2 flex-1 rounded-full transition-all ${step <= stage ? 'bg-primary' : 'bg-slate-100'}`}></div>
         ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold shadow-sm">
          {error}
        </div>
      )}

      {/* STAGE 1: Eligibility */}
      {stage === 1 && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
           <h2 className="text-xl font-black mb-6 flex items-center gap-2">
             <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold">1</span> 
             Stage 1: Eligibility
           </h2>
           
           <div className="space-y-4">
             <div>
               <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Legal Full Name</label>
               <input
                 type="text"
                 className="w-full p-4 rounded-2xl border border-slate-200 focus:outline-none focus:border-primary font-bold text-slate-800"
                 placeholder="Jane Doe"
                 value={fullName}
                 onChange={(e) => setFullName(e.target.value)}
                 disabled={isSubmitting}
               />
             </div>
             <div>
               <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">University / Institution</label>
               <input
                 type="text"
                 className="w-full p-4 rounded-2xl border border-slate-200 focus:outline-none focus:border-primary font-bold text-slate-800"
                 placeholder="University of Oxford"
                 value={university}
                 onChange={(e) => setUniversity(e.target.value)}
                 disabled={isSubmitting}
               />
             </div>
             <div>
               <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Teaching Subjects (CSV)</label>
               <input
                 type="text"
                 className="w-full p-4 rounded-2xl border border-slate-200 focus:outline-none focus:border-primary font-bold text-slate-800"
                 placeholder="A-Level Maths, GCSE Physics"
                 value={subjects}
                 onChange={(e) => setSubjects(e.target.value)}
                 disabled={isSubmitting}
               />
             </div>
           </div>

           <button 
             onClick={() => handleStageNavigation(2)}
             disabled={isSubmitting || !fullName || !university || !subjects}
             className="w-full mt-8 py-4 bg-slate-800 hover:bg-black text-white rounded-2xl font-black tracking-tight shadow-lg shadow-slate-200 transition-all disabled:opacity-50"
           >
             {isSubmitting ? "Saving Draft..." : "Save & Continue →"}
           </button>
        </div>
      )}

      {/* STAGE 2: Talent */}
      {stage === 2 && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
           <h2 className="text-xl font-black mb-6 flex items-center gap-2">
             <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold">2</span> 
             Stage 2: Talent Presentation
           </h2>
           
           <div className="space-y-6">
             <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-blue-800 text-sm font-medium">
               A high-quality 2-minute introduction video drastically increases booking rates. Paste an unlisted YouTube link below to preview it.
             </div>

             <div>
               <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Video YouTube URL</label>
               <input
                 type="url"
                 className="w-full p-4 rounded-2xl border border-slate-200 focus:outline-none focus:border-primary font-bold text-slate-800"
                 placeholder="https://www.youtube.com/watch?v=..."
                 value={youtubeUrl}
                 onChange={(e) => setYoutubeUrl(e.target.value)}
                 disabled={isSubmitting}
               />
             </div>

             <YoutubePreview url={youtubeUrl} />
           </div>

           <div className="flex gap-3 mt-8">
             <button onClick={() => setStage(1)} className="px-6 py-4 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-2xl font-bold transition-all">Back</button>
             <button 
               onClick={() => handleStageNavigation(3)}
               disabled={isSubmitting || !youtubeUrl}
               className="flex-1 py-4 bg-slate-800 hover:bg-black text-white rounded-2xl font-black tracking-tight shadow-lg shadow-slate-200 transition-all disabled:opacity-50"
             >
               {isSubmitting ? "Saving Draft..." : "Save & Proceed to ID Check"}
             </button>
           </div>
        </div>
      )}

      {/* STAGE 3: GDPR Compliance & ID */}
      {stage === 3 && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
           <h2 className="text-xl font-black mb-6 flex items-center gap-2">
             <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold">3</span> 
             Stage 3: Identity Verification
           </h2>
           
           <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl mb-8">
              <h3 className="font-black text-amber-900 mb-2 uppercase tracking-widest text-[10px]">⚖️ GDPR Data Control Consent</h3>
              <p className="text-amber-800 text-sm font-medium mb-4 leading-relaxed">
                 To ensure the deepest safeguarding for our students, we require government ID and a Clean Criminal Record Check (DBS).
                 These files are uploaded to an encrypted, strict access-controlled vault and will NEVER be publicly accessible or shared unconditionally.
              </p>
              
              <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-amber-100 shadow-sm">
                <input 
                  type="checkbox" 
                  id="gdpr_consent"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
                />
                <label htmlFor="gdpr_consent" className="font-bold text-slate-700 cursor-pointer">
                  I consent to ScienceDojo processing my sensitive identity documents exclusively for background verification.
                </label>
              </div>
           </div>

           <div className={`transition-all duration-500 ${consent ? 'opacity-100 translate-y-0' : 'opacity-30 blur-[2px] pointer-events-none translate-y-4'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                 <PrivateUploader userId={userId} docType="id" onUploadSuccess={() => setIdUploaded(true)} />
                 <PrivateUploader userId={userId} docType="background_check" onUploadSuccess={() => setBgUploaded(true)} />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStage(2)} className="px-6 py-4 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-2xl font-bold transition-all">Back</button>
                <button 
                  onClick={() => handleStageNavigation(4)}
                  disabled={isSubmitting || !consent || !idUploaded || !bgUploaded}
                  className="flex-1 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black tracking-tight shadow-lg shadow-amber-200 transition-all disabled:opacity-50"
                 >
                  {isSubmitting ? "Finalizing Encryption..." : "Complete Submission"}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
