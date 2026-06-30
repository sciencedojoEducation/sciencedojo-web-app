import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getEmailProviderStatus } from "@/lib/email";
import { createTeamMember } from "./actions";
import TeamMemberManagementList, { type InternalTeamMember } from "./TeamMemberManagementList";

export const metadata = {
  title: "Internal Team | ScienceDojo Admin",
};

const teamRoles = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "developer", label: "Developer" },
  { value: "support", label: "Support" },
  { value: "tutor_manager", label: "Tutor manager" },
  { value: "finance", label: "Finance" },
];

function inputClass(extra = "") {
  return `min-h-11 w-full rounded-2xl border border-secondary/10 bg-white px-4 py-3 text-sm font-bold text-secondary outline-none transition-colors placeholder:text-secondary/35 focus:border-primary focus:ring-4 focus:ring-primary/10 ${extra}`;
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] text-secondary/40">
        {label}
      </span>
      {children}
    </label>
  );
}

function RoleSelect() {
  return (
    <select name="role" defaultValue="developer" className={inputClass()}>
      {teamRoles.map((role) => (
        <option key={role.value} value={role.value}>
          {role.label}
        </option>
      ))}
    </select>
  );
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin" && user.user_metadata?.role !== "admin") {
    redirect("/dashboard/parent");
  }

  return supabase;
}

export default async function AdminTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; warning?: string; error?: string }>;
}) {
  const supabase = await requireAdmin();
  const resolvedParams = await searchParams;
  const { data: members, error } = await supabase
    .from("internal_team_members")
    .select("*")
    .order("status", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const linkedUserIds = (members || [])
    .map((member) => member.user_id)
    .filter((userId): userId is string => Boolean(userId));
  const adminClient = createAdminClient();
  const profileRoles = new Map<string, string | null>();
  const authRoles = new Map<string, string | null>();

  if (linkedUserIds.length > 0) {
    const { data: linkedProfiles } = await adminClient
      .from("profiles")
      .select("id, role")
      .in("id", linkedUserIds);

    for (const profile of linkedProfiles || []) {
      profileRoles.set(profile.id, profile.role || null);
    }

    const { data: authUsers, error: authUsersError } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (authUsersError) {
      console.error("[admin-team] Could not fetch linked auth user roles:", authUsersError.message);
    } else {
      const linkedSet = new Set(linkedUserIds);
      for (const authUser of authUsers.users) {
        if (linkedSet.has(authUser.id)) {
          authRoles.set(authUser.id, authUser.user_metadata?.role || null);
        }
      }
    }
  }

  const teamMembers = ((members || []) as InternalTeamMember[]).map((member) => {
    const profileRole = member.user_id ? profileRoles.get(member.user_id) || null : null;
    const authRole = member.user_id ? authRoles.get(member.user_id) || null : null;

    return {
      ...member,
      profile_role: profileRole,
      auth_role: authRole,
      has_role_mismatch: Boolean(
        member.user_id &&
        member.status === "active" &&
        (profileRole !== "internal" || authRole !== "internal")
      ),
    };
  });
  const activeCount = teamMembers.filter((member) => member.status === "active").length;
  const loginEnabledCount = teamMembers.filter((member) => member.status === "active" && member.user_id).length;
  const message = resolvedParams?.message;
  const warning = resolvedParams?.warning;
  const actionError = resolvedParams?.error;
  const emailStatus = getEmailProviderStatus();

  return (
    <div className="mx-auto max-w-6xl px-3 py-5 sm:px-4 md:p-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-secondary/40">
            Internal operations
          </p>
          <h1 className="text-2xl font-black tracking-tight text-secondary md:text-3xl">
            Internal Team
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-secondary/60">
            Manage private ScienceDojo collaborators, responsibilities, and limited internal access.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:min-w-[26rem]">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Total</p>
            <p className="mt-1 text-2xl font-black text-slate-800">{teamMembers.length}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700/60">Active</p>
            <p className="mt-1 text-2xl font-black text-emerald-800">{activeCount}</p>
          </div>
          <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-sky-700/60">Logins</p>
            <p className="mt-1 text-2xl font-black text-sky-800">{loginEnabledCount}</p>
          </div>
        </div>
      </div>

      {message && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
          {message}
        </div>
      )}

      {warning && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-700">
          {warning}
        </div>
      )}

      {actionError && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {actionError}
        </div>
      )}

      {emailStatus.mockMode && (
        <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm font-bold leading-6 text-sky-800">
          Email provider is in local mock mode. Internal invite emails are printed in the server terminal until RESEND_API_KEY is configured.
        </div>
      )}

      {!emailStatus.configured && !emailStatus.mockMode && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold leading-6 text-red-700">
          Email provider is not configured. Add RESEND_API_KEY in production so internal invite emails can be sent.
        </div>
      )}

      <details className="group mb-6 rounded-[1.5rem] border border-primary/10 bg-white shadow-sm md:rounded-[2rem]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 md:p-5 [&::-webkit-details-marker]:hidden">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/55">Add collaborator</p>
            <h2 className="mt-1 text-xl font-black text-secondary">Create internal profile</h2>
            <p className="mt-1 text-xs font-bold text-secondary/45">Open this panel only when you need to add someone new.</p>
          </div>
          <span className="rounded-2xl bg-secondary px-4 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white transition-colors group-open:bg-primary">
            Add member
          </span>
        </summary>
        <form action={createTeamMember} className="grid gap-4 border-t border-secondary/8 p-4 lg:grid-cols-2 md:p-5">
          <Field label="Name">
            <input name="name" required placeholder="Technical collaborator" className={inputClass()} />
          </Field>
          <Field label="Email">
            <input name="email" required type="email" placeholder="friend@example.com" className={inputClass()} />
          </Field>
          <Field label="Role">
            <RoleSelect />
          </Field>
          <Field label="Title">
            <input name="title" placeholder="Technical collaborator" className={inputClass()} />
          </Field>
          <Field label="Responsibility area" className="lg:col-span-2">
            <input name="responsibility_area" placeholder="Code edits, internal project communication, technical QA" className={inputClass()} />
          </Field>
          <Field label="Internal notes" className="lg:col-span-2">
            <textarea name="notes" rows={4} placeholder="Context, boundaries, current tasks, or handoff notes" className={inputClass("resize-y")} />
          </Field>
          <div className="lg:col-span-2">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-secondary px-5 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-white shadow-sm transition-colors hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Add team member
            </button>
          </div>
        </form>
      </details>

      <TeamMemberManagementList members={teamMembers} />
    </div>
  );
}
