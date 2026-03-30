"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface DisputeModalProps {
  bookingId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DisputeModal({ bookingId, onClose, onSuccess }: DisputeModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error("Unauthorized");

      const { error: insertError } = await supabase
        .from("disputes")
        .insert({
          booking_id: bookingId,
          reporter_id: user.id,
          reason: reason,
          status: "open"
        });

      if (insertError) throw insertError;

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Dispute error:", err.message);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-secondary/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-black text-secondary tracking-tight">Report an Issue ⚖️</h2>
            <p className="text-xs text-secondary/40 font-bold uppercase tracking-widest mt-1">Platform Dispute Resolution</p>
          </div>
          <button onClick={onClose} className="text-secondary/20 hover:text-secondary/40 text-2xl font-bold transition-colors">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-black text-secondary/40 uppercase tracking-widest mb-2">What happened?</label>
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please describe the issue with this session (e.g. Tutor didn't show up, Incorrect subject covered, Technical issues...)"
              className="w-full h-40 p-4 rounded-3xl border border-secondary/10 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-primary/20 resize-none"
            ></textarea>
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
             <p className="text-[10px] text-amber-700 font-bold leading-relaxed italic">
                Note: Filing a dispute will notify our admin team. We will review your chat history for this session to reach a fair resolution.
             </p>
          </div>

          <div className="flex gap-3">
             <button
               type="button"
               onClick={onClose}
               className="flex-1 py-4 bg-slate-100 text-secondary font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-[10px]"
             >
                Cancel
             </button>
             <button
               type="submit"
               disabled={isSubmitting || !reason.trim()}
               className="flex-2 px-8 py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-[10px]"
             >
                {isSubmitting ? "Submitting..." : "Submit Dispute"}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
