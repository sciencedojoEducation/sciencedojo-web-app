"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  INTERNAL_PROJECT_STATUSES,
  INTERNAL_PROJECT_STATUS_LABELS,
  INTERNAL_PROJECT_PRIORITY_META,
  getProjectAssignee,
  type InternalProject,
  type InternalProjectMember,
} from "@/lib/internal-projects";

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function ProjectBoard({
  projects,
  members = [],
  showAdminFilters = false,
}: {
  projects: InternalProject[];
  members?: InternalProjectMember[];
  showAdminFilters?: boolean;
}) {
  const [assignee, setAssignee] = useState("all");
  const [priority, setPriority] = useState("all");
  const [showArchived, setShowArchived] = useState(false);

  const filtered = useMemo(() => projects.filter((project) => {
    if (!showArchived && project.archived_at) return false;
    if (showArchived && !project.archived_at) return false;
    if (priority !== "all" && project.priority !== priority) return false;
    if (assignee === "unassigned" && project.assigned_to) return false;
    if (assignee !== "all" && assignee !== "unassigned" && project.assigned_to !== assignee) return false;
    return true;
  }), [projects, assignee, priority, showArchived]);

  return (
    <div className="space-y-5">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" aria-label="Priority legend">
        {Object.values(INTERNAL_PROJECT_PRIORITY_META).map((meta) => (
          <div key={meta.code} className={`rounded-2xl border p-3 ${meta.cardClass}`}>
            <p className="text-[10px] font-black uppercase tracking-wider text-secondary">{meta.symbol} {meta.code} · {meta.label}</p>
          </div>
        ))}
      </div>
      {showAdminFilters && (
        <div className="flex flex-col gap-3 rounded-2xl border border-secondary/10 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
          <select value={assignee} onChange={(event) => setAssignee(event.target.value)} className="min-h-11 rounded-xl border border-secondary/10 bg-slate-50 px-3 text-sm font-bold text-secondary">
            <option value="all">All assignees</option>
            <option value="unassigned">Unassigned</option>
            {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
          </select>
          <select value={priority} onChange={(event) => setPriority(event.target.value)} className="min-h-11 rounded-xl border border-secondary/10 bg-slate-50 px-3 text-sm font-bold text-secondary">
            <option value="all">All priorities</option>
            {Object.entries(INTERNAL_PROJECT_PRIORITY_META).map(([value, meta]) => <option key={value} value={value}>{meta.code} · {meta.label}</option>)}
          </select>
          <label className="flex min-h-11 items-center gap-2 rounded-xl bg-slate-50 px-3 text-sm font-bold text-secondary/65 sm:ml-auto">
            <input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} className="h-4 w-4 accent-primary" />
            Archived only
          </label>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-secondary/15 bg-white p-10 text-center">
          <p className="text-lg font-black text-secondary">No projects here yet</p>
          <p className="mt-2 text-sm font-semibold text-secondary/50">New ideas and assignments will appear on this board.</p>
        </div>
      ) : (
        <div className="flex snap-x gap-4 overflow-x-auto pb-4">
          {INTERNAL_PROJECT_STATUSES.map((status) => {
            const statusProjects = filtered.filter((project) => project.status === status);
            return (
              <section key={status} className="w-[18rem] shrink-0 snap-start rounded-[1.5rem] border border-secondary/10 bg-slate-50/80 p-3">
                <div className="mb-3 flex items-center justify-between px-1">
                  <h2 className="text-sm font-black text-secondary">{INTERNAL_PROJECT_STATUS_LABELS[status]}</h2>
                  <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-secondary/45 shadow-sm">{statusProjects.length}</span>
                </div>
                <div className="space-y-3">
                  {statusProjects.map((project) => {
                    const projectAssignee = getProjectAssignee(project);
                    const priorityMeta = INTERNAL_PROJECT_PRIORITY_META[project.priority];
                    const overdue = Boolean(project.target_date && project.status !== "live" && project.status !== "discontinued" && new Date(`${project.target_date}T23:59:59`) < new Date());
                    return (
                      <Link key={project.id} href={`/dashboard/projects/${project.id}`} className={`block rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${priorityMeta.cardClass} ${project.status === "idea" ? "ring-2 ring-sky-200" : ""}`}>
                        <div className="flex items-start justify-between gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] shadow-sm ${priorityMeta.badgeClass}`}>{priorityMeta.symbol} {priorityMeta.code} · {priorityMeta.label}</span>
                          {project.archived_at && <span className="text-[9px] font-black uppercase text-slate-400">Archived</span>}
                        </div>
                        <h3 className="mt-3 text-sm font-black leading-5 text-secondary">{project.title}</h3>
                        <p className="mt-2 line-clamp-3 text-xs font-semibold leading-5 text-secondary/55">{project.brief}</p>
                        <div className="mt-4 space-y-1 border-t border-black/8 pt-3 text-[10px] font-bold text-secondary/55">
                          <p>{projectAssignee ? projectAssignee.name : "Unassigned backlog"}</p>
                          {project.target_date && <p className={overdue ? "text-rose-600" : ""}>{overdue ? "Overdue · " : "Target · "}{formatDate(project.target_date)}</p>}
                        </div>
                      </Link>
                    );
                  })}
                  {statusProjects.length === 0 && <p className="rounded-xl border border-dashed border-secondary/10 p-3 text-center text-[10px] font-black uppercase tracking-wider text-secondary/25">Empty</p>}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
