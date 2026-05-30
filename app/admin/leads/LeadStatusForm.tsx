"use client";

import { useActionState } from "react";
import { updateLeadStatus, type LeadStatusState } from "./actions";

const statuses = [
  { value: "new_inquiry", label: "New inquiry" },
  { value: "awaiting_review", label: "Awaiting review" },
  { value: "consultation_booked", label: "Consultation booked" },
  { value: "tutor_matched", label: "Tutor matched" },
  { value: "converted", label: "Converted" },
  { value: "inactive", label: "Inactive" },
  { value: "new", label: "New (legacy)" },
  { value: "contacted", label: "Contacted (legacy)" },
  { value: "booked", label: "Booked (legacy)" },
  { value: "closed", label: "Closed (legacy)" },
];

export default function LeadStatusForm({
  leadId,
  currentStatus,
  variant = "stacked",
}: {
  leadId: string;
  currentStatus: string;
  variant?: "stacked" | "compact";
}) {
  const initialState: LeadStatusState = {};
  const [state, formAction, isPending] = useActionState(updateLeadStatus, initialState);
  const isCompact = variant === "compact";

  return (
    <form action={formAction} className={isCompact ? "flex flex-wrap items-center gap-2" : "flex flex-col gap-2"}>
      <input type="hidden" name="leadId" value={leadId} />
      <select
        name="status"
        defaultValue={currentStatus}
        disabled={isPending}
        className={`rounded-xl border border-secondary/10 bg-white text-xs font-black uppercase tracking-[0.12em] text-secondary outline-none focus:border-primary ${
          isCompact ? "h-10 w-48 px-3 py-2" : "px-3 py-2"
        }`}
      >
        {statuses.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={isPending}
        className={`rounded-xl bg-primary text-xs font-black uppercase tracking-[0.12em] text-white disabled:opacity-50 ${
          isCompact ? "h-10 px-4 py-2" : "px-3 py-2"
        }`}
      >
        {isPending ? "Saving..." : "Update"}
      </button>
      {state?.error && <p className={isCompact ? "basis-full text-[10px] font-bold text-red-500" : "text-[10px] font-bold text-red-500"}>{state.error}</p>}
    </form>
  );
}
