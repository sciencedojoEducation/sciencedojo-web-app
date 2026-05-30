"use client"

import { useTransition } from "react";
import { updatePlatformFeePercentage } from "./actions";

export default function FeeForm({ currentFee }: { currentFee: number }) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const res = await updatePlatformFeePercentage(formData);
      if (res.error) {
        alert(res.error);
      } else {
        alert("Platform fee updated successfully! All ledgers have been recalculated.");
      }
    });
  };

  return (
    <form className="max-w-xl" onSubmit={handleSubmit}>
       <label className="mb-2 block text-sm font-bold text-secondary">Platform cut percentage</label>
       <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input 
            type="number" 
            name="feePercent"
            defaultValue={currentFee} 
            min="0" 
            max="100" 
            required
            className="h-12 w-28 rounded-xl border border-secondary/20 bg-surface p-3 text-center text-lg font-black text-secondary focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10" 
          />
          <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold leading-relaxed text-secondary/60 sm:flex-1">
            Currently taking <span className="text-secondary">{currentFee}%</span> from each completed booking before tutor payouts are calculated.
          </div>
       </div>
       <button 
         type="submit" 
         disabled={isPending}
         className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-secondary px-5 py-2.5 text-sm font-black text-white shadow-sm transition-colors hover:bg-secondary/90 disabled:opacity-50 md:mt-6"
       >
          {isPending ? "Updating ledgers..." : "Update commission"}
       </button>
    </form>
  );
}
