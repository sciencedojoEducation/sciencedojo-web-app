"use client";

import { useRef, useState, useTransition } from "react";
import { createInternalProject } from "@/app/dashboard/projects/actions";
import type { InternalProjectMember } from "@/lib/internal-projects";
import { INTERNAL_PROJECT_PRIORITY_META } from "@/lib/internal-projects";

const inputClass = "min-h-11 w-full rounded-2xl border border-secondary/10 bg-slate-50 px-4 py-3 text-sm font-bold text-secondary outline-none focus:border-primary focus:ring-4 focus:ring-primary/10";

export default function AdminProjectCreateForm({ members }: { members: InternalProjectMember[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function submit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      try {
        await createInternalProject(formData);
        formRef.current?.reset();
        setMessage("Project idea created.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not create the project idea.");
      }
    });
  }

  return (
    <details className="group rounded-[1.5rem] border border-primary/10 bg-white shadow-sm md:rounded-[2rem]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 md:p-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/60">Admin brief</p>
          <h2 className="mt-1 text-xl font-black text-secondary">Add a project idea</h2>
        </div>
        <span className="rounded-xl bg-primary px-4 py-2 text-xs font-black text-white group-open:bg-secondary">New idea</span>
      </summary>
      <form ref={formRef} action={submit} className="grid gap-4 border-t border-secondary/8 p-5 md:grid-cols-2 md:p-6">
        <label className="md:col-span-2">
          <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-secondary/40">Title</span>
          <input name="title" required minLength={3} maxLength={160} className={inputClass} placeholder="e.g. Add parent lesson progress summaries" />
        </label>
        <label className="md:col-span-2">
          <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-secondary/40">Problem or opportunity</span>
          <textarea name="brief" required minLength={10} maxLength={6000} rows={5} className={inputClass} placeholder="Explain the context, user need, and important constraints." />
        </label>
        <label className="md:col-span-2">
          <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-secondary/40">Expected outcome</span>
          <textarea name="expected_outcome" required minLength={3} maxLength={3000} rows={3} className={inputClass} placeholder="Describe what success looks like." />
        </label>
        <label>
          <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-secondary/40">Assign to</span>
          <select name="assigned_to" className={inputClass} defaultValue="">
            <option value="">Unassigned backlog</option>
            {members.map((member) => <option key={member.id} value={member.id}>{member.name} · {member.title || member.role.replace(/_/g, " ")}</option>)}
          </select>
        </label>
        <label>
          <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-secondary/40">Priority</span>
          <select name="priority" defaultValue="p2" className={inputClass}>
            {Object.entries(INTERNAL_PROJECT_PRIORITY_META).map(([value, meta]) => <option key={value} value={value}>{meta.symbol} {meta.code} · {meta.label}</option>)}
          </select>
        </label>
        <label>
          <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-secondary/40">Target date</span>
          <input name="target_date" type="date" className={inputClass} />
        </label>
        <div className="flex items-end gap-3">
          <button disabled={pending} className="min-h-11 rounded-2xl bg-primary px-5 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50">{pending ? "Creating…" : "Create idea"}</button>
          {message && <p role="status" className="text-sm font-bold text-secondary/60">{message}</p>}
        </div>
      </form>
    </details>
  );
}
