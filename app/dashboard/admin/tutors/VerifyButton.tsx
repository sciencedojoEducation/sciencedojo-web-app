"use client";

import { useTransition } from "react";
import { toggleTutorVerification } from "./actions";

interface Props {
  tutorId: string;
  isVerified: boolean;
}

export default function VerifyButton({ tutorId, isVerified }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleTutorVerification(tutorId, isVerified);
      if (result?.error) {
        alert(`Failed to update status: ${result.error}`);
      }
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${
        isVerified 
          ? "bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-600" 
          : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200"
      } disabled:opacity-50`}
    >
      {isPending ? "Updating..." : isVerified ? "Revoke Verification" : "Verify Tutor"}
    </button>
  );
}
