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
      <div className="flex flex-col gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
        <span className="text-sm font-black text-green-600">
          ✓ {result.paid} paid · {result.skipped} skipped · {result.failed} failed
        </span>
        {result.errors && result.errors.length > 0 && (
          <span className="text-xs font-bold text-red-500">{result.errors.join(', ')}</span>
        )}
        <button onClick={() => setResult(null)} className="text-left text-xs text-slate-400 underline sm:ml-2">Reset</button>
      </div>
    );
  }

  if (confirmMode) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center">
        <p className="text-sm font-bold text-amber-800">
          Pay <span className="text-amber-600 font-black">£{totalOutstanding.toFixed(2)}</span> to {eligible.length} tutor{eligible.length !== 1 ? 's' : ''}?
        </p>
        {result?.error && <p className="text-xs text-red-500 font-bold">{result.error}</p>}
        <div className="flex gap-2">
          <button
            onClick={() => setConfirmMode(false)}
            disabled={isPending}
            className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-500 hover:bg-slate-50 disabled:opacity-50"
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
            className="min-h-10 rounded-xl bg-green-600 px-4 py-2 text-xs font-black text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            {isPending ? "Processing..." : "Confirm Pay All"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirmMode(true)}
      className="inline-flex min-h-10 items-center gap-2 rounded-2xl bg-green-600 px-4 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-white shadow-sm transition-all hover:bg-green-700 active:scale-95 md:px-5 md:text-sm"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Pay All Tutors · £{totalOutstanding.toFixed(2)}
    </button>
  );
}
