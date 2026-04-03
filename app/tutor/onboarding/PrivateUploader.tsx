"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface Props {
  userId: string;
  docType: "government_id" | "background_check";
  onUploadSuccess: (url: string) => void;
}

export default function PrivateUploader({ userId, docType, onUploadSuccess }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File exceeds 5MB limit. Please compress and try again.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const fileExt = file.name.split('.').pop();
      // Bucket structure: private_docs / {userId} / {docType}-{timestamp}.ext
      // This strict structure aligns with our Storage RLS!
      const filePath = `${userId}/${docType}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('private_docs')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      setSuccess(true);
      onUploadSuccess(filePath);
    } catch (err: any) {
      console.error(`Upload error for ${docType}:`, err.message);
      setError("Failed to securely upload document. Please ensure you are logged in.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`p-8 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center transition-all ${success ? 'border-mint bg-mint/5 text-navy' : error ? 'border-red-300 bg-red-50' : 'border-navy/10 bg-white/50 hover:bg-white hover:border-mint/50'}`}>
      
      {success ? (
        <div className="flex flex-col items-center gap-3 text-center">
           <div className="w-14 h-14 rounded-2xl bg-mint flex items-center justify-center text-navy shadow-lg shadow-mint/20">
             <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
           </div>
           <div className="space-y-1">
             <span className="block font-black text-navy text-sm uppercase tracking-tight">Document Secured</span>
             <span className="block text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">AES-256 Vaulted</span>
           </div>
        </div>
      ) : (
        <>
          <div className="w-12 h-12 rounded-2xl bg-navy/5 flex items-center justify-center text-navy/20 mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          </div>
          <p className="text-sm font-black text-navy mb-1 uppercase tracking-tight">{docType === 'government_id' ? 'Government Photo ID' : 'Background Check'}</p>
          <p className="text-[10px] text-navy/30 uppercase tracking-[0.2em] font-black mb-6">PDF, JPG, PNG &lt; 5MB</p>
          
          <label className={`cursor-pointer px-8 py-3 rounded-xl font-black text-xs transition-all shadow-xl active:scale-95 ${isUploading ? 'bg-navy/10 text-navy/20 cursor-not-allowed' : 'bg-navy text-mint hover:bg-black shadow-navy/10'}`}>
            {isUploading ? "Encrypting..." : "Choose File"}
            <input 
              type="file" 
              className="hidden" 
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>
          {error && <p className="text-red-500 text-[10px] mt-4 font-black text-center max-w-[200px] uppercase tracking-wider leading-relaxed">{error}</p>}
        </>
      )}
    </div>
  );
}
