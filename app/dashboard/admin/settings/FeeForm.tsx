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
    <form className="max-w-sm" onSubmit={handleSubmit}>
       <label className="block text-sm font-bold text-secondary mb-2">Platform Cut Percentage (%)</label>
       <div className="flex items-center gap-4">
          <input 
            type="number" 
            name="feePercent"
            defaultValue={currentFee} 
            min="0" 
            max="100" 
            required
            className="w-24 p-3 rounded-xl border border-secondary/20 bg-surface focus:outline-none focus:border-primary text-lg font-bold text-center" 
          />
          <span className="text-secondary/60 font-medium">Currently taking {currentFee}%</span>
       </div>
       <button 
         type="submit" 
         disabled={isPending}
         className="mt-6 px-6 py-2 bg-secondary text-white font-bold rounded-xl hover:bg-secondary/90 transition-colors shadow-sm text-sm disabled:opacity-50"
       >
          {isPending ? "Updating Ledgers..." : "Update Ledger Logic"}
       </button>
    </form>
  );
}
