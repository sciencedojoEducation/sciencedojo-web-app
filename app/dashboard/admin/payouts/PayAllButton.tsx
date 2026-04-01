"use client";

import { useState, useTransition } from "react";
import { triggerAllTutorPayouts } from "./actions";

interface PayAllButtonProps {
  tutorLedgers: Array<{ id: string; name: string; outstandingOwed: number; stripeReady: boolean }>;
  totalOutstanding: number;
}

export default function PayAllButton({ tutorLedgers, totalOutstanding }: PayAllButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [confirmMode, setConfirmMode] = useState(false);
  const [result, setResult] = useState<{ paid?: number; skipped?: number; failed?: number; errors?: string[]; error?: string } | null>(null);

  const eligible = tutorLedgers.filter(t => t.stripeReady && t.outstandingOwed > 0);

  if (eligible.length === 0) {
    return null; // Nothing to pay
  }

  if (result && !result.error) {
    return (
      <div className="flex items-center gap-3 px-5 py-3 bg-green-50 border border-green-200 rounded-2xl">
        <span className="text-green-600 text-sm font-black">
          ✓ {result.paid} paid · {result.skipped} skipped · {result.failed} failed
        </span>
        {result.errors && result.errors.length > 0 && (
          <span className="text-red-500 text-xs font-bold">{result.errors.join(', ')}</span>
        )}
        <button onClick={() => setResult(null)} className="text-xs text-slate-400 underline ml-2">Reset</button>
      </div>
    );
  }

  if (confirmMode) {
    return (
      <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-5 py-3 rounded-2xl">
        <p className="text-sm font-bold text-amber-800">
          Pay <span className="text-amber-600 font-black">£{totalOutstanding.toFixed(2)}</span> to {eligible.length} tutor{eligible.length !== 1 ? 's' : ''}?
        </p>
        {result?.error && <p className="text-xs text-red-500 font-bold">{result.error}</p>}
        <button
          onClick={() => setConfirmMode(false)}
          disabled={isPending}
          className="px-3 py-1.5 text-xs font-black border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            startTransition(async () => {
              const res = await triggerAllTutorPayouts(tutorLedgers);
              setResult(res);
              setConfirmMode(false);
            });
          }}
          disabled={isPending}
          className="px-4 py-1.5 text-xs font-black bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? "Processing..." : "Confirm Pay All"}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirmMode(true)}
      className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-black rounded-2xl hover:bg-green-700 transition-all shadow-md active:scale-95 uppercase tracking-widest"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Pay All Tutors · £{totalOutstanding.toFixed(2)}
    </button>
  );
}
