"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface Props {
  userId: string;
  docType: "id" | "background_check";
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
    <div className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${success ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : error ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'}`}>
      
      {success ? (
        <div className="flex flex-col items-center gap-2">
           <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-lg">✓</div>
           <span className="font-bold tracking-tight text-sm">Document Secured in Vault</span>
        </div>
      ) : (
        <>
          <svg className="w-8 h-8 opacity-20 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          <p className="text-sm font-bold text-slate-500 mb-1">{docType === 'id' ? 'Upload Government ID' : 'Upload Background Check'}</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-4">PDF, JPG, PNG up to 5MB</p>
          
          <label className={`cursor-pointer px-6 py-2 rounded-full font-bold text-xs transition-colors shadow-sm ${isUploading ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            {isUploading ? "Encrypting & Uploading..." : "Select File"}
            <input 
              type="file" 
              className="hidden" 
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>
          {error && <p className="text-red-500 text-[10px] mt-3 font-bold text-center max-w-[200px]">{error}</p>}
        </>
      )}
    </div>
  );
}
