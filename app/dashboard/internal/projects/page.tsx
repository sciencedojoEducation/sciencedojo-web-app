import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getActiveInternalMemberByUserId } from "@/lib/internal-auth";
import ProjectBoard from "@/app/dashboard/projects/ProjectBoard";
import type { InternalProject } from "@/lib/internal-projects";

export const metadata = { title: "My Projects | ScienceDojo Internal" };

export default async function InternalProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login/internal");

  const member = await getActiveInternalMemberByUserId(supabase, user.id);
  if (!member) redirect("/login/internal/denied");

  const { data, error } = await supabase
    .from("internal_projects")
    .select("*, assignee:internal_team_members!internal_projects_assigned_to_fkey(id, user_id, name, role, title)")
    .eq("assigned_to", member.id)
    .is("archived_at", null)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);

  const projects = (data || []) as InternalProject[];
  const newCount = projects.filter((project) => project.status === "idea").length;
  const activeCount = projects.filter((project) => !["live", "discontinued"].includes(project.status)).length;
  const pausedCount = projects.filter((project) => project.status === "paused").length;

  return (
    <div className="mx-auto max-w-[96rem] space-y-6 px-3 py-5 sm:px-4 md:p-8">
      <header className="overflow-hidden rounded-[1.5rem] border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/70 to-lime-50 p-5 shadow-sm md:rounded-[2rem] md:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700/60">Internal delivery</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-emerald-950 md:text-4xl">My Projects</h1>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-emerald-900/55">Accept new ideas, keep delivery status current, and capture progress for the admin team.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:min-w-[24rem]">
            <div className="rounded-2xl border border-sky-100 bg-white p-4"><p className="text-[9px] font-black uppercase tracking-wider text-sky-700/60">New</p><p className="mt-1 text-2xl font-black text-sky-900">{newCount}</p></div>
            <div className="rounded-2xl border border-emerald-100 bg-white p-4"><p className="text-[9px] font-black uppercase tracking-wider text-emerald-700/60">Active</p><p className="mt-1 text-2xl font-black text-emerald-900">{activeCount}</p></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Paused</p><p className="mt-1 text-2xl font-black text-slate-800">{pausedCount}</p></div>
          </div>
        </div>
      </header>
      <ProjectBoard projects={projects} />
    </div>
  );
}
