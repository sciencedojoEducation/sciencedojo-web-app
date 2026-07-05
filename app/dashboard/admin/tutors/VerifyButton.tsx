"use client";

import { useTransition } from "react";
import { updateTutorStatus } from "./actions";

interface Props {
  tutorId: string;
  isVerified?: boolean;
  action?: "approve" | "verify" | "remove_verified" | "reject" | "suspend" | "feature" | "unfeature";
  label?: string;
  variant?: "primary" | "success" | "danger" | "muted";
}

const variantClasses = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-200",
  danger: "bg-red-50 text-red-600 hover:bg-red-100",
  muted: "bg-slate-100 text-slate-500 hover:bg-slate-200",
};

export default function VerifyButton({ tutorId, isVerified = false, action, label, variant }: Props) {
  const [isPending, startTransition] = useTransition();
  const resolvedAction = action || (isVerified ? "remove_verified" : "verify");
  const resolvedLabel =
    label ||
    (resolvedAction === "approve" ? "Approve Tutor" :
      resolvedAction === "verify" ? "Award Verified Badge" :
      resolvedAction === "remove_verified" ? "Remove Verified Badge" :
      resolvedAction === "reject" ? "Reject" :
      resolvedAction === "suspend" ? "Suspend" :
      resolvedAction === "feature" ? "Feature" :
      "Unfeature");
  const resolvedVariant =
    variant ||
    (resolvedAction === "approve" ? "primary" :
      resolvedAction === "verify" ? "success" :
      resolvedAction === "reject" || resolvedAction === "suspend" || resolvedAction === "remove_verified" ? "danger" :
      "muted");

  const handleToggle = () => {
    startTransition(async () => {
      const result = await updateTutorStatus(tutorId, resolvedAction);
      if (result?.error) {
        alert(`Failed to update status: ${result.error}`);
      }
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${variantClasses[resolvedVariant]} disabled:opacity-50`}
    >
      {isPending ? "Updating..." : resolvedLabel}
    </button>
  );
}
