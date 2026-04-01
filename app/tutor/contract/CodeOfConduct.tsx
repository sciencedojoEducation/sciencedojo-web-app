"use client";

import { useRef, useState, useEffect } from "react";
import { acceptCodeOfConduct } from "./actions";

export default function CodeOfConduct() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canAccept, setCanAccept] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    
    // Add a 10px buffer to account for rendering variations
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setCanAccept(true);
    }
  };

  useEffect(() => {
    // Check if it's already at the bottom (e.g. on very large screens)
    handleScroll();
  }, []);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await acceptCodeOfConduct();
    } catch (e) {
      console.error(e);
      setIsAccepting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl border border-secondary/10 overflow-hidden flex flex-col h-[600px] animate-in slide-in-from-bottom-4 duration-500">
      <div className="p-6 md:p-8 bg-slate-900 text-white shrink-0">
        <h1 className="text-2xl font-black mb-1">Sensei Code of Conduct 🥋</h1>
        <p className="text-slate-400 font-medium text-sm">Please read the following rules entirely. You must scroll to the bottom to agree.</p>
      </div>
      
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 text-slate-600 bg-slate-50"
      >
        <div className="space-y-3">
          <h3 className="font-black text-slate-800 text-lg">1. Safeguarding & Professionalism</h3>
          <p>As a ScienceDojo tutor, you are responsible for maintaining a strictly professional environment. All communication must happen within the platform. You must ensure lessons are conducted in a quiet, neutral background free from interruptions.</p>
        </div>

        <div className="space-y-3">
          <h3 className="font-black text-slate-800 text-lg">2. No Off-Platform Payments</h3>
          <p>Circumventing the ScienceDojo platform payments system is strictly prohibited. Accepting payments via Venmo, CashApp, PayPal, or generic Bank Transfer outside the platform will result in immediate and permanent removal.</p>
          <p>Our platform fee ensures you receive guaranteed payouts, marketplace visibility, and legal protection in case of disputes.</p>
        </div>

        <div className="space-y-3">
          <h3 className="font-black text-slate-800 text-lg">3. Data Privacy & GDPR Regulations</h3>
          <p>We take Data Privacy incredibly seriously. You are expressly forbidden from downloading, capturing, or sharing any student data (including session videos, names, or performance metrics) outside of the platform tools provided.</p>
          <p>Any breach of PII (Personally Identifiable Information) may result in legal action conforming to UK/EU GDPR guidelines.</p>
        </div>

        <div className="space-y-3">
          <h3 className="font-black text-slate-800 text-lg">4. Availability & Reliability</h3>
          <p>Constant cancellations erode trust in our marketplace. Tutors who cancel more than 15% of their scheduled sessions within a 30-day window without valid medical or emergency exemptions may face temporary shadowbanning.</p>
        </div>
        
        <div className="h-6"></div> {/* Extra padding at bottom */}
      </div>

      <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
        {!canAccept ? (
          <p className="text-amber-600 font-bold text-sm animate-pulse flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
            Scroll down to read the full policy
          </p>
        ) : (
          <p className="text-green-600 font-bold text-sm flex items-center gap-2">
            ✓ Ready to proceed
          </p>
        )}
        
        <button 
          onClick={handleAccept}
          disabled={!canAccept || isAccepting}
          className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${!canAccept ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20 active:scale-95'}`}
        >
          {isAccepting ? "Activating..." : "Accept & Go Live"}
        </button>
      </div>
    </div>
  );
}
