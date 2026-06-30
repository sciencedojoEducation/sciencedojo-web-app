import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { updateInternalSettings } from "./actions";
import { getActiveInternalMemberByUserId, repairLinkedInternalUserRole } from "@/lib/internal-auth";

export const metadata = {
  title: "Internal Settings | ScienceDojo",
};

type InternalSettingsMember = {
  name: string;
  email: string;
  role: string;
  title: string | null;
  responsibility_area: string | null;
  status: string;
};

type InternalProfile = {
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: string | null;
};

function inputClass(extra = "") {
  return `min-h-11 w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm font-bold text-emerald-950 outline-none transition-colors placeholder:text-emerald-950/30 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 ${extra}`;
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
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700/45">
        {label}
      </span>
      {children}
    </label>
  );
}

function formatRole(role: string) {
  return role.replace(/_/g, " ");
}

export default async function InternalSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const resolvedParams = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login/internal");
  }

  const activeMember = await getActiveInternalMemberByUserId(supabase, user.id);

  if (!activeMember) {
    redirect(`/login/internal/denied?error=${encodeURIComponent("Your internal access is inactive or has not been linked yet.")}`);
  }

  try {
    await repairLinkedInternalUserRole(user.id);
  } catch (repairError) {
    console.error("[internal-settings] Internal role repair failed:", repairError);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, avatar_url, bio, role")
    .eq("id", user.id)
    .maybeSingle();

  const { data: member } = await supabase
    .from("internal_team_members")
    .select("name, email, role, title, responsibility_area, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!member) {
    redirect(`/login/internal/denied?error=${encodeURIComponent("Your internal access is inactive or has not been linked yet.")}`);
  }

  const internalProfile = (profile || {
    full_name: null,
    email: user.email || null,
    avatar_url: null,
    bio: null,
    role: null,
  }) as InternalProfile;
  const internalMember = member as InternalSettingsMember;
  const displayName = internalProfile.full_name || internalMember.name;
  const avatarUrl = internalProfile.avatar_url || user.user_metadata?.avatar_url || "";

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-3 py-5 sm:px-4 md:p-8">
      <section className="overflow-hidden rounded-[1.5rem] border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/70 to-lime-50 p-5 shadow-sm md:rounded-[2rem] md:p-7">
        <div className="grid gap-5 md:grid-cols-[auto_1fr] md:items-center">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[2rem] border border-white bg-white text-3xl font-black text-emerald-700 shadow-sm">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700/60">Internal settings</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-emerald-950 md:text-4xl">
              Your ScienceDojo profile
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-bold leading-7 text-emerald-900/60">
              Keep your personal details current. Admin-controlled access settings stay protected.
            </p>
          </div>
        </div>
      </section>

      {resolvedParams.message && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
          {resolvedParams.message}
        </div>
      )}

      {resolvedParams.error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {resolvedParams.error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm md:rounded-[2rem]">
          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700/50">Editable profile</p>
            <h2 className="mt-2 text-xl font-black text-emerald-950">Personal details</h2>
          </div>

          <form action={updateInternalSettings} className="grid gap-4 lg:grid-cols-2">
            <Field label="Display name">
              <input name="name" required defaultValue={displayName} className={inputClass()} />
            </Field>
            <Field label="Title">
              <input name="title" defaultValue={internalMember.title || ""} placeholder="Technical collaborator" className={inputClass()} />
            </Field>
            <Field label="Short bio" className="lg:col-span-2">
              <textarea
                name="bio"
                rows={4}
                defaultValue={internalProfile.bio || ""}
                placeholder="A short personal note for your internal profile."
                className={inputClass("resize-y")}
              />
            </Field>
            <Field label="Profile photo" className="lg:col-span-2">
              <input
                name="avatar"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="block w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm font-bold text-emerald-950 file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-[10px] file:font-black file:uppercase file:tracking-[0.12em] file:text-emerald-700"
              />
              <span className="mt-2 block text-xs font-bold text-emerald-900/45">
                JPG, PNG, or WebP. Maximum 2MB.
              </span>
            </Field>
            <div className="lg:col-span-2">
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                Save profile
              </button>
            </div>
          </form>
        </section>

        <aside className="space-y-5">
          <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm md:rounded-[2rem]">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700/50">Access</p>
            <h2 className="mt-2 text-xl font-black text-emerald-950">Admin-controlled</h2>
            <dl className="mt-4 space-y-3">
              <div>
                <dt className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-900/35">Email</dt>
                <dd className="mt-1 break-words text-sm font-bold text-emerald-950/70">{internalMember.email || internalProfile.email}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-900/35">Internal role</dt>
                <dd className="mt-1 text-sm font-black capitalize text-emerald-950">{formatRole(internalMember.role)}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-900/35">Status</dt>
                <dd className="mt-1 text-sm font-black capitalize text-emerald-700">{internalMember.status}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-900/35">Responsibility area</dt>
                <dd className="mt-1 text-sm font-medium leading-6 text-emerald-950/60">
                  {internalMember.responsibility_area || "Not set yet."}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-[1.5rem] border border-sky-100 bg-sky-50 p-5 shadow-sm md:rounded-[2rem]">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-sky-700/50">Password</p>
            <h2 className="mt-2 text-xl font-black text-sky-950">Need a new password?</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-sky-900/60">
              Use the reset page to request a secure password reset email.
            </p>
            <Link href="/forgot-password?internal=1" className="mt-4 inline-flex min-h-10 items-center justify-center rounded-2xl bg-sky-600 px-4 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white hover:bg-sky-700">
              Reset password
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
