import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getActiveInternalMemberByUserId } from "@/lib/internal-auth";
import {
  formatProjectStatus,
  getActivityActor,
  getProjectAssignee,
  INTERNAL_PROJECT_PRIORITY_META,
  type InternalProject,
  type InternalProjectActivity,
  type InternalProjectMember,
} from "@/lib/internal-projects";
import ProjectDetailControls from "../ProjectDetailControls";

function formatDate(value: string, includeTime = false) {
  return new Date(value).toLocaleString(undefined, includeTime
    ? { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }
    : { month: "short", day: "numeric", year: "numeric" });
}

function activityTitle(activity: InternalProjectActivity) {
  if (activity.activity_type === "status_changed") return `${formatProjectStatus(activity.previous_status)} → ${formatProjectStatus(activity.new_status)}`;
  return activity.activity_type.replace(/_/g, " ");
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const isAdmin = profile?.role === "admin" || user.user_metadata?.role === "admin";
  const member = isAdmin ? null : await getActiveInternalMemberByUserId(supabase, user.id);
  if (!isAdmin && !member) redirect("/dashboard");

  const [{ data: projectData, error: projectError }, { data: activityData, error: activityError }] = await Promise.all([
    supabase.from("internal_projects").select("*, assignee:internal_team_members!internal_projects_assigned_to_fkey(id, user_id, name, role, title)").eq("id", id).maybeSingle(),
    supabase.from("internal_project_activity").select("*, actor:profiles!internal_project_activity_actor_id_fkey(full_name)").eq("project_id", id).order("created_at", { ascending: false }),
  ]);
  if (projectError) throw new Error(projectError.message);
  if (!projectData) notFound();
  if (activityError) throw new Error(activityError.message);

  const project = projectData as InternalProject;
  const priorityMeta = INTERNAL_PROJECT_PRIORITY_META[project.priority];
  const activities = (activityData || []) as InternalProjectActivity[];
  const assignee = getProjectAssignee(project);
  let members: InternalProjectMember[] = [];
  if (isAdmin) {
    const { data, error } = await supabase.from("internal_team_members").select("id, user_id, name, role, title").eq("status", "active").not("user_id", "is", null).order("name");
    if (error) throw new Error(error.message);
    members = (data || []) as InternalProjectMember[];
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-3 py-5 sm:px-4 md:p-8">
      <Link href={isAdmin ? "/dashboard/admin/projects" : "/dashboard/internal/projects"} className="text-xs font-black uppercase tracking-widest text-primary/70 hover:text-primary">← Back to project board</Link>
      <header className={`rounded-[1.5rem] border p-5 shadow-sm md:rounded-[2rem] md:p-7 ${priorityMeta.cardClass}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary/8 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">{formatProjectStatus(project.status)}</span>
          <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm ${priorityMeta.badgeClass}`}>{priorityMeta.symbol} {priorityMeta.code} · {priorityMeta.label}</span>
          {project.archived_at && <span className="rounded-full bg-slate-800 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">Archived</span>}
        </div>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-secondary md:text-4xl">{project.title}</h1>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-[9px] font-black uppercase tracking-wider text-secondary/35">Owner</p><p className="mt-1 text-sm font-black text-secondary">{assignee?.name || "Unassigned backlog"}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-[9px] font-black uppercase tracking-wider text-secondary/35">Target</p><p className="mt-1 text-sm font-black text-secondary">{project.target_date ? formatDate(`${project.target_date}T00:00:00`) : "No target date"}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-[9px] font-black uppercase tracking-wider text-secondary/35">Last updated</p><p className="mt-1 text-sm font-black text-secondary">{formatDate(project.updated_at, true)}</p></div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.8fr)]">
        <div className="space-y-5">
          <section className="rounded-[1.5rem] border border-secondary/10 bg-white p-5 shadow-sm"><p className="text-[10px] font-black uppercase tracking-widest text-secondary/35">Problem or opportunity</p><p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-7 text-secondary/65">{project.brief}</p></section>
          <section className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/50 p-5"><p className="text-[10px] font-black uppercase tracking-widest text-emerald-700/55">Expected outcome</p><p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-7 text-emerald-950/70">{project.expected_outcome}</p></section>
          <ProjectDetailControls project={project} members={members} isAdmin={isAdmin} />
        </div>

        <aside className="rounded-[1.5rem] border border-secondary/10 bg-white p-5 shadow-sm lg:self-start">
          <p className="text-[10px] font-black uppercase tracking-widest text-secondary/35">Activity</p>
          <h2 className="mt-1 text-xl font-black text-secondary">Project timeline</h2>
          <div className="mt-5 space-y-4">
            {activities.map((activity) => {
              const actor = getActivityActor(activity);
              return <article key={activity.id} className="relative border-l-2 border-primary/15 pl-4"><span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-primary" /><p className="text-xs font-black capitalize text-secondary">{activityTitle(activity)}</p>{activity.note && <p className="mt-1 whitespace-pre-wrap text-xs font-semibold leading-5 text-secondary/55">{activity.note}</p>}<p className="mt-2 text-[9px] font-bold uppercase tracking-wider text-secondary/30">{actor?.full_name || "ScienceDojo team"} · {formatDate(activity.created_at, true)}</p></article>;
            })}
            {activities.length === 0 && <p className="text-sm font-semibold text-secondary/40">No activity has been recorded yet.</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
