"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

interface InquiryModalProps {
  tutorId: string;
  tutorName: string;
  onClose: () => void;
  viewerRole?: string | null;
  isAuthenticated: boolean;
}

export default function InquiryModal({ 
  tutorId, 
  tutorName, 
  onClose, 
  viewerRole, 
  isAuthenticated 
}: InquiryModalProps) {
  const router = useRouter();
  const signupNext = encodeURIComponent(`/tutor/${tutorId}`);
  const [subject, setSubject] = useState("");
  const [goal, setGoal] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guest user handling: Redirect to unified join page
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-secondary/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
        <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl text-center">
           <h2 className="text-2xl font-black text-secondary mb-4">ScienceDojo Inquiry 🥋</h2>
           <p className="text-secondary/60 text-sm font-medium mb-8">Ready to connect with {tutorName}? Log in or create an account, then choose whether you are joining as a student or parent.</p>
           <div className="flex flex-col gap-3">
              <button 
                onClick={() => router.push(`/signup?next=${signupNext}`)}
                className="w-full py-4 bg-primary text-white font-black rounded-2xl hover:bg-primary-hover shadow-lg uppercase tracking-widest text-xs transition-all"
              >
                Create Account
              </button>
              <button 
                onClick={() => router.push(`/login?next=${signupNext}`)}
                className="w-full py-4 bg-secondary text-white font-black rounded-2xl hover:bg-secondary/90 shadow-lg uppercase tracking-widest text-xs transition-all"
              >
                Sign In
              </button>
              <button 
                onClick={onClose}
                className="w-full py-3 bg-slate-50 text-secondary font-black rounded-2xl hover:bg-slate-100 uppercase tracking-widest text-[10px] transition-all mt-2"
              >
                Maybe Later
              </button>
           </div>
        </div>
      </div>
    );
  }



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !goal.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Import the server action dynamically
      const { initiateInquiry } = await import("@/app/dashboard/messages/actions");
      
      const result = await initiateInquiry(tutorId, subject, goal);
      
      if ('error' in result && result.error) {
        throw new Error(result.error as string);
      }

      const conversationId = (result as any).conversationId;
      if (!conversationId) throw new Error("Could not initialize conversation.");

      // Success! Redirect to the message inbox
      router.push(`/dashboard/messages?id=${conversationId}`);
    } catch (err: any) {
      console.error("Inquiry Error:", err);
      setError(err.message || "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-secondary/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-black text-secondary truncate">Message {tutorName} 🛡️</h2>
            <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-1">First-Time Lead Inquiry</p>
          </div>
          <button onClick={onClose} className="text-secondary/20 hover:text-secondary/40 text-2xl font-bold transition-colors">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold animate-pulse">
              {error}
            </div>
          )}

          <div>
             <label className="block text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2">Primary Subject</label>
             <input 
               required
               type="text"
               value={subject}
               onChange={(e) => setSubject(e.target.value)}
               placeholder="e.g. IB Physics SL - Option D Astrophysics"
               className="w-full p-4 rounded-2xl bg-slate-50 border border-secondary/10 focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm"
             />
             <p className="text-[9px] text-secondary/30 mt-2 italic">Example: GCSE Biology, A-Level Maths Prep, etc.</p>
          </div>

          <div>
             <label className="block text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2">Learning Goal</label>
             <textarea 
               required
               value={goal}
               onChange={(e) => setGoal(e.target.value)}
               placeholder="e.g. I need help with the final module. I (or my child) have ADHD and would benefit from 15-minute breaks."
               className="w-full h-32 p-4 rounded-2xl bg-slate-50 border border-secondary/10 focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm resize-none"
             ></textarea>
             <p className="text-[9px] text-secondary/30 mt-2 italic">Example: Exam preparation, specific topic mastery, or non-traditional lesson pacing.</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-secondary/5 border-dashed">
             <p className="text-[10px] text-secondary/40 leading-relaxed font-bold italic">
                Protecting your family: Our platform redacts phone numbers and emails. Always keep lesson communication and payments through ScienceDojo to remain covered by our resolution guarantee.
             </p>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting || !subject.trim() || !goal.trim()}
            className="w-full py-5 bg-secondary text-white font-black rounded-3xl hover:bg-secondary/90 shadow-xl transition-all active:scale-[0.98] uppercase tracking-widest text-xs disabled:opacity-50"
          >
            {isSubmitting ? "Initiating Inquiry..." : "Initialize Lead Inquiry"}
          </button>
        </form>
      </div>
    </div>
  );
}
