"use client";

import { useState, useTransition } from "react";
import { triggerTutorPayout } from "./actions";

interface PayoutButtonProps {
  tutorId: string;
  tutorName: string;
  amountOwed: number;
  stripeReady: boolean;
}

export default function PayoutButton({ tutorId, tutorName, amountOwed, stripeReady }: PayoutButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [confirmMode, setConfirmMode] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);

  if (result?.success) {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-green-100">
        ✓ Paid
      </span>
    );
  }

  if (!stripeReady) {
    return (
      <span className="text-[10px] text-slate-300 font-bold uppercase">
        No Stripe
      </span>
    );
  }

  if (amountOwed <= 0) {
    return (
      <span className="text-[10px] text-slate-300 font-bold uppercase">
        All Paid
      </span>
    );
  }

  if (confirmMode) {
    return (
      <div className="flex flex-col items-end gap-2">
        <p className="text-[10px] text-slate-500 font-bold text-right max-w-[160px]">
          Transfer <span className="text-amber-600">£{amountOwed.toFixed(2)}</span> to {tutorName}?
        </p>
        {result?.error && (
          <p className="text-[9px] text-red-500 font-bold max-w-[160px] text-right">{result.error}</p>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => setConfirmMode(false)}
            disabled={isPending}
            className="px-3 py-1 text-[10px] font-black uppercase tracking-widest border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              startTransition(async () => {
                const res = await triggerTutorPayout(tutorId, amountOwed);
                setResult(res);
                if (!res.error) setConfirmMode(false);
              });
            }}
            disabled={isPending}
            className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? "Sending..." : "Confirm"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirmMode(true)}
      className="px-4 py-2 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-700 transition-colors shadow-sm active:scale-95"
    >
      Pay £{amountOwed.toFixed(2)}
    </button>
  );
}
