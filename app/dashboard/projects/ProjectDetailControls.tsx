"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  adminAddProjectNote,
  setInternalProjectArchived,
  updateAssignedInternalProject,
  updateInternalProject,
} from "./actions";
import {
  INTERNAL_PROJECT_STATUSES,
  INTERNAL_PROJECT_STATUS_LABELS,
  INTERNAL_PROJECT_PRIORITY_META,
  type InternalProject,
  type InternalProjectMember,
} from "@/lib/internal-projects";

const inputClass = "min-h-11 w-full rounded-2xl border border-secondary/10 bg-slate-50 px-4 py-3 text-sm font-bold text-secondary outline-none focus:border-primary focus:ring-4 focus:ring-primary/10";

export default function ProjectDetailControls({
  project,
  members,
  isAdmin,
}: {
  project: InternalProject;
  members: InternalProjectMember[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function run(action: (formData: FormData) => Promise<unknown>, formData: FormData, success: string) {
    setMessage(null);
    startTransition(async () => {
      try {
        await action(formData);
        setMessage(success);
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Something went wrong.");
      }
    });
  }

  if (isAdmin) {
    return (
      <div className="space-y-4">
        <details className="group rounded-[1.5rem] border border-secondary/10 bg-white shadow-sm" open>
          <summary className="cursor-pointer list-none p-5 text-lg font-black text-secondary">Edit project brief</summary>
          <form action={(data) => run(updateInternalProject, data, "Project updated.")} className="grid gap-4 border-t border-secondary/8 p-5 md:grid-cols-2">
            <input type="hidden" name="project_id" value={project.id} />
            <label className="md:col-span-2"><span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-secondary/40">Title</span><input name="title" defaultValue={project.title} required minLength={3} maxLength={160} className={inputClass} /></label>
            <label className="md:col-span-2"><span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-secondary/40">Problem or opportunity</span><textarea name="brief" defaultValue={project.brief} required minLength={10} maxLength={6000} rows={6} className={inputClass} /></label>
            <label className="md:col-span-2"><span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-secondary/40">Expected outcome</span><textarea name="expected_outcome" defaultValue={project.expected_outcome} required minLength={3} maxLength={3000} rows={4} className={inputClass} /></label>
            <label><span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-secondary/40">Assignee</span><select name="assigned_to" defaultValue={project.assigned_to || ""} className={inputClass}><option value="">Unassigned backlog</option>{members.map((member) => <option key={member.id} value={member.id}>{member.name} · {member.title || member.role.replace(/_/g, " ")}</option>)}</select></label>
            <label><span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-secondary/40">Status</span><select name="status" defaultValue={project.status} className={inputClass}>{INTERNAL_PROJECT_STATUSES.map((status) => <option key={status} value={status}>{INTERNAL_PROJECT_STATUS_LABELS[status]}</option>)}</select></label>
            <label><span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-secondary/40">Priority</span><select name="priority" defaultValue={project.priority} className={inputClass}>{Object.entries(INTERNAL_PROJECT_PRIORITY_META).map(([value, meta]) => <option key={value} value={value}>{meta.symbol} {meta.code} · {meta.label}</option>)}</select></label>
            <label><span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-secondary/40">Target date</span><input name="target_date" type="date" defaultValue={project.target_date || ""} className={inputClass} /></label>
            <button disabled={pending} className="min-h-11 rounded-2xl bg-primary px-5 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50 md:w-fit">Save changes</button>
          </form>
        </details>

        <form action={(data) => run(adminAddProjectNote, data, "Progress note added.")} className="rounded-[1.5rem] border border-secondary/10 bg-white p-5 shadow-sm">
          <input type="hidden" name="project_id" value={project.id} />
          <label><span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-secondary/40">Add timeline note</span><textarea name="note" required maxLength={3000} rows={3} className={inputClass} placeholder="Add delivery context or a decision…" /></label>
          <button disabled={pending} className="mt-3 min-h-11 rounded-2xl bg-secondary px-5 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50">Add note</button>
        </form>

        <form action={(data) => run(setInternalProjectArchived, data, project.archived_at ? "Project restored." : "Project archived.")} className="rounded-[1.5rem] border border-secondary/10 bg-white p-5 shadow-sm">
          <input type="hidden" name="project_id" value={project.id} /><input type="hidden" name="archived" value={String(!project.archived_at)} />
          <button disabled={pending} className="min-h-11 rounded-2xl border border-secondary/15 px-5 py-3 text-xs font-black uppercase tracking-widest text-secondary/65 disabled:opacity-50">{project.archived_at ? "Restore project" : "Archive project"}</button>
        </form>
        {message && <p role="status" className="rounded-xl bg-slate-100 p-3 text-sm font-bold text-secondary/65">{message}</p>}
      </div>
    );
  }

  return (
    <form action={(data) => run(updateAssignedInternalProject, data, "Project updated.")} className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
      <input type="hidden" name="project_id" value={project.id} />
      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700/55">Delivery update</p>
      {project.status === "idea" ? (
        <><input type="hidden" name="status" value="exploring" /><p className="mt-2 text-sm font-semibold leading-6 text-emerald-950/60">Accept this idea to begin exploring it. You can include your first note below.</p></>
      ) : !["live", "discontinued"].includes(project.status) ? (
        <label className="mt-4 block"><span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-secondary/40">Update status</span><select name="status" defaultValue={project.status} className={inputClass}>{["exploring", "planned", "in_development", "testing", "pilot", "live", "paused"].map((status) => <option key={status} value={status}>{INTERNAL_PROJECT_STATUS_LABELS[status as keyof typeof INTERNAL_PROJECT_STATUS_LABELS]}</option>)}</select></label>
      ) : (
        <p className="mt-2 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">This project is {project.status === "live" ? "live" : "discontinued"}. An admin can reopen it if more work is needed.</p>
      )}
      <label className="mt-4 block"><span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-secondary/40">Progress note</span><textarea name="note" maxLength={3000} rows={4} className={inputClass} placeholder="What changed, what is blocked, or what comes next?" /></label>
      <button disabled={pending} className="mt-3 min-h-11 rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50">{pending ? "Saving…" : project.status === "idea" ? "Accept and explore" : "Save update"}</button>
      {message && <p role="status" className="mt-3 text-sm font-bold text-emerald-900/65">{message}</p>}
    </form>
  );
}
