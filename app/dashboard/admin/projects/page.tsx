import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ProjectBoard from "@/app/dashboard/projects/ProjectBoard";
import AdminProjectCreateForm from "./AdminProjectCreateForm";
import type { InternalProject, InternalProjectMember } from "@/lib/internal-projects";

export const metadata = { title: "Project Ideas | ScienceDojo Admin" };

export default async function AdminProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin" && user.user_metadata?.role !== "admin") redirect("/dashboard");

  const [{ data: projects, error: projectsError }, { data: members, error: membersError }] = await Promise.all([
    supabase
      .from("internal_projects")
      .select("*, assignee:internal_team_members!internal_projects_assigned_to_fkey(id, user_id, name, role, title)")
      .order("updated_at", { ascending: false }),
    supabase
      .from("internal_team_members")
      .select("id, user_id, name, role, title")
      .eq("status", "active")
      .not("user_id", "is", null)
      .order("name"),
  ]);

  if (projectsError) throw new Error(projectsError.message);
  if (membersError) throw new Error(membersError.message);

  const projectRows = (projects || []) as InternalProject[];
  const memberRows = (members || []) as InternalProjectMember[];
  const activeCount = projectRows.filter((project) => !project.archived_at && !["live", "discontinued"].includes(project.status)).length;
  const unassignedCount = projectRows.filter((project) => !project.archived_at && !project.assigned_to).length;
  const pausedCount = projectRows.filter((project) => !project.archived_at && project.status === "paused").length;

  return (
    <div className="mx-auto max-w-[96rem] space-y-6 px-3 py-5 sm:px-4 md:p-8">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary/60">Internal delivery</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-secondary md:text-4xl">Project Ideas</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-secondary/55">Turn product opportunities into clear, owned work for the internal team.</p>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:min-w-[25rem]">
          <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4"><p className="text-[9px] font-black uppercase tracking-wider text-sky-700/60">Active</p><p className="mt-1 text-2xl font-black text-sky-900">{activeCount}</p></div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Unassigned</p><p className="mt-1 text-2xl font-black text-slate-800">{unassignedCount}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4"><p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Paused</p><p className="mt-1 text-2xl font-black text-slate-800">{pausedCount}</p></div>
        </div>
      </header>

      <AdminProjectCreateForm members={memberRows} />
      <ProjectBoard projects={projectRows} members={memberRows} showAdminFilters />
    </div>
  );
}
