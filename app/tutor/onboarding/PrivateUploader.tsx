"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface Props {
  userId: string;
  docType: string;
  label?: string;
  onUploadSuccess: (url: string) => void;
}

export default function PrivateUploader({ userId, docType, label, onUploadSuccess }: Props) {
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
    <div className={`relative group overflow-hidden transition-all duration-500 rounded-[2rem] border-2 ${
      success 
        ? 'border-mint bg-mint/5 shadow-lg shadow-mint/10' 
        : error 
        ? 'border-red-200 bg-red-50' 
        : 'border-white/60 bg-white/40 backdrop-blur-md hover:bg-white/60 hover:border-mint/30 shadow-sm'
    }`}>
      
      {success ? (
        <div className="p-6 flex flex-col items-center gap-2 text-center group-hover:scale-105 transition-transform">
           <div className="w-12 h-12 rounded-2xl bg-mint flex items-center justify-center text-navy shadow-lg shadow-mint/20">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor font-bold"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
           </div>
           <div className="space-y-0.5">
             <span className="block font-black text-navy text-[11px] uppercase tracking-tighter">Document Secured</span>
             <span className="block text-[8px] font-black text-mint-700/40 uppercase tracking-widest">AES-256 Vaulted</span>
           </div>
        </div>
      ) : (
        <div className="p-6 flex flex-col items-center justify-center gap-2 text-center">
          <div className="w-10 h-10 rounded-2xl bg-navy/5 flex items-center justify-center text-navy/20 group-hover:text-mint group-hover:bg-mint/10 transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          </div>
          
          <div className="space-y-0.5">
            <p className="text-[10px] font-black text-navy/40 uppercase tracking-tight group-hover:text-navy transition-colors">{label || docType.replace(/_/g, ' ')}</p>
            <p className="text-[8px] text-navy/20 uppercase tracking-[0.1em] font-black group-hover:text-navy/30 transition-colors">PDF, JPG, PNG &lt; 5MB</p>
          </div>

          <label className={`mt-2 cursor-pointer px-6 py-2 rounded-xl font-black text-[10px] transition-all shadow-lg active:scale-95 ${isUploading ? 'bg-navy/10 text-navy/20 cursor-not-allowed' : 'bg-navy text-mint hover:bg-black shadow-navy/20'}`}>
            {isUploading ? "Encrypting..." : "Choose File"}
            <input 
              type="file" 
              className="hidden" 
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>
          {error && <p className="text-red-500 text-[8px] mt-2 font-black text-center max-w-[150px] uppercase tracking-wider leading-tight">{error}</p>}
        </div>
      )}
    </div>
  );
}
