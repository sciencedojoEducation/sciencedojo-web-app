"use client";

import { useActionState } from "react";
import { updateLeadStatus, type LeadStatusState } from "./actions";

const statuses = ["new", "contacted", "booked", "converted", "closed"];

export default function LeadStatusForm({ leadId, currentStatus }: { leadId: string; currentStatus: string }) {
  const initialState: LeadStatusState = {};
  const [state, formAction, isPending] = useActionState(updateLeadStatus, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="leadId" value={leadId} />
      <select
        name="status"
        defaultValue={currentStatus}
        disabled={isPending}
        className="rounded-xl border border-secondary/10 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-secondary outline-none focus:border-primary"
      >
        {statuses.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-primary px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-white disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Update"}
      </button>
      {state?.error && <p className="text-[10px] font-bold text-red-500">{state.error}</p>}
    </form>
  );
}
