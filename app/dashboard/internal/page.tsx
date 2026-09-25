import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import InternalClock from "./InternalClock";
import { getActiveInternalMemberByUserId, repairLinkedInternalUserRole } from "@/lib/internal-auth";
import { formatProjectStatus, type InternalProjectStatus } from "@/lib/internal-projects";
import { HomeListRow, HomeMetricStrip, HomePrimaryAction, HomeSectionHeading } from "@/components/DashboardHomeUI";
import { CirclePause, FolderKanban, Lightbulb, MessageCircle } from "lucide-react";

export const metadata = {
  title: "Internal Dashboard | ScienceDojo",
};

type InternalTeamMember = {
  name: string;
  email: string;
  role: string;
  title: string | null;
  responsibility_area: string | null;
  status: string;
  notes: string | null;
  updated_at: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  }).format(new Date(value));
}

export default async function InternalDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login/internal");

  const activeMember = await getActiveInternalMemberByUserId(supabase, user.id);
  if (!activeMember) {
    redirect(`/login/internal/denied?error=${encodeURIComponent("Your internal access is inactive or has not been linked yet.")}`);
  }
  try {
    await repairLinkedInternalUserRole(user.id);
  } catch (repairError) {
    console.error("[internal-dashboard] Internal role repair failed:", repairError);
  }

  const [{ data: profile }, { data: member }, { data: projectData, error: projectsError }] = await Promise.all([
    supabase.from("profiles").select("role, full_name, avatar_url, bio").eq("id", user.id).maybeSingle(),
    supabase.from("internal_team_members").select("name, email, role, title, responsibility_area, status, notes, updated_at").eq("user_id", user.id).eq("status", "active").maybeSingle(),
    supabase.from("internal_projects").select("id, title, status, priority, target_date, updated_at").eq("assigned_to", activeMember.id).is("archived_at", null).order("updated_at", { ascending: false }),
  ]);
  if (!member) {
    redirect(`/login/internal/denied?error=${encodeURIComponent("Your internal access is inactive or has not been linked yet.")}`);
  }
  if (projectsError) throw new Error(projectsError.message);

  const internalMember = member as InternalTeamMember;
  const projects = projectData || [];
  const activeProjects = projects.filter((project) => !["live", "discontinued"].includes(project.status));
  const newProjectCount = projects.filter((project) => project.status === "idea").length;
  const pausedProjectCount = projects.filter((project) => project.status === "paused").length;
  const recentProjects = projects.slice(0, 5);
  const nextProject = activeProjects.find((project) => project.status !== "paused") || activeProjects[0];
  const focusDojoUrl = process.env.NEXT_PUBLIC_FOCUSDOJO_URL || "https://focusdojo.co.uk";

  return (
    <div data-role="internal" className="dashboard-home mx-auto max-w-6xl space-y-6 px-3 py-5 sm:px-6 md:px-8 md:pb-12 md:pt-7">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,1fr)]">
        <HomePrimaryAction
          eyebrow="Assigned work"
          title={nextProject ? nextProject.title : "Your project queue is clear"}
          description={nextProject ? `${formatProjectStatus(nextProject.status as InternalProjectStatus)} · ${internalMember.responsibility_area || "Your next project step is ready."}` : "No projects are assigned right now. Open the board to see the wider team context."}
          href={nextProject ? `/dashboard/projects/${nextProject.id}` : "/dashboard/internal/projects"}
          label={nextProject ? "Open project" : "Open projects"}
          detail={`${activeProjects.length} active project${activeProjects.length === 1 ? "" : "s"}`}
          icon={<FolderKanban size={23} />}
        />
        <section className="home-surface sm:p-6">
          <HomeSectionHeading eyebrow="Today" title="Your workspace" />
          <InternalClock />
          <HomeListRow href="/dashboard/internal/projects" title="Project board" detail="All assigned work" />
          <HomeListRow href="/dashboard/messages" title="Team messages" detail="Collaborate with the team" />
        </section>
      </div>

      <HomeMetricStrip label="Project overview" items={[
        { label: "Active projects", value: activeProjects.length, icon: <FolderKanban size={20} />, tone: "mint" },
        { label: "New ideas", value: newProjectCount, icon: <Lightbulb size={20} />, tone: "amber" },
        { label: "Paused", value: pausedProjectCount, icon: <CirclePause size={20} />, tone: "violet" },
      ]} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(17rem,1fr)]">
        <section className="home-surface sm:p-6">
          <HomeSectionHeading eyebrow="Recently updated" title="My project queue" href="/dashboard/internal/projects" linkLabel="Open board" />
          {recentProjects.map((project) => (
            <HomeListRow key={project.id} href={`/dashboard/projects/${project.id}`} title={project.title} detail={`${formatProjectStatus(project.status as InternalProjectStatus)} · updated ${formatDate(project.updated_at)}`} />
          ))}
          {recentProjects.length === 0 && <p className="mt-4 text-sm leading-6 text-[var(--theme-muted)]">No projects are assigned yet. Your board is ready when work is added.</p>}
        </section>
        <section className="home-surface sm:p-6">
          <HomeSectionHeading eyebrow="Useful tools" title="Keep moving" />
          <HomeListRow href="/dashboard/messages" title="Message team" detail="Coordinate the next step" trailing={<MessageCircle size={17} className="text-[var(--theme-muted)]" />} />
          <a href={focusDojoUrl} target="_blank" rel="noopener noreferrer" className="home-list-row focus-visible:outline-2 focus-visible:outline-[var(--theme-accent)]">
            <span className="min-w-0 flex-1"><span className="home-list-title">FocusDojo</span><span className="home-list-detail">Open the deep-work tool ↗</span></span>
          </a>
        </section>
      </div>

      <section className="home-surface sm:p-6">
        <HomeSectionHeading eyebrow="Team context" title={internalMember.title || internalMember.role.replace(/_/g, " ")} href="/dashboard/internal/settings" linkLabel="Edit settings" />
        <p className="text-sm leading-6 text-[var(--theme-muted)]">{internalMember.responsibility_area || "No responsibility area has been set yet."}</p>
        <div className="mt-4 grid gap-4 border-t border-[var(--theme-line)] pt-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-[var(--theme-ink)]">About you</p>
            <p className="mt-1 text-sm leading-6 text-[var(--theme-muted)]">{profile?.bio || "Add a short bio so collaborators know how you help ScienceDojo."}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--theme-ink)]">Internal notes <span className="font-normal text-[var(--theme-muted)]">· {formatDate(internalMember.updated_at)}</span></p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[var(--theme-muted)]">{internalMember.notes || "No internal notes have been added yet."}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
