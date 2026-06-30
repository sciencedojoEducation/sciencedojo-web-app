import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import InternalClock from "./InternalClock";
import { getActiveInternalMemberByUserId, repairLinkedInternalUserRole } from "@/lib/internal-auth";

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

type InternalProfile = {
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
};

function formatRole(role: string) {
  return role.replace(/_/g, " ");
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildCalendarDays(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = firstDay.getDay();

  return [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
}

function PlantIllustration() {
  return (
    <svg viewBox="0 0 220 180" role="img" aria-label="Small green plant" className="h-32 w-40">
      <rect x="74" y="120" width="72" height="38" rx="14" fill="#d9f99d" />
      <path d="M84 126h52l-8 38H92z" fill="#84cc16" />
      <path d="M110 125c-2-30 1-58 8-84" stroke="#166534" strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M113 78c-24-24-48-27-70-10 21 10 42 10 70 10z" fill="#22c55e" />
      <path d="M118 68c18-30 43-42 74-34-16 22-39 33-74 34z" fill="#16a34a" />
      <path d="M115 98c-18-12-38-10-58 7 18 7 36 5 58-7z" fill="#4ade80" />
      <path d="M120 100c16-17 35-21 58-11-14 13-31 18-58 11z" fill="#86efac" />
      <ellipse cx="110" cy="164" rx="62" ry="10" fill="#dcfce7" />
    </svg>
  );
}

export default async function InternalDashboardPage() {
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
    console.error("[internal-dashboard] Internal role repair failed:", repairError);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, avatar_url, bio")
    .eq("id", user.id)
    .maybeSingle();

  const { data: member } = await supabase
    .from("internal_team_members")
    .select("name, email, role, title, responsibility_area, status, notes, updated_at")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!member) {
    redirect(`/login/internal/denied?error=${encodeURIComponent("Your internal access is inactive or has not been linked yet.")}`);
  }

  const internalMember = member as InternalTeamMember;
  const internalProfile = (profile || {
    full_name: null,
    avatar_url: null,
    bio: null,
  }) as InternalProfile & { role?: string };
  const displayName = internalProfile.full_name || internalMember.name;
  const avatarUrl = internalProfile.avatar_url || user.user_metadata?.avatar_url || "";
  const focusDojoUrl = process.env.NEXT_PUBLIC_FOCUSDOJO_URL || "https://focusdojo.co.uk";
  const today = new Date();
  const calendarDays = buildCalendarDays(today);
  const todayDate = today.getDate();
  const weeklyPlan = ["Review open edits", "Check team messages", "Ship one small improvement", "Capture blockers"];
  const todoItems = ["Reply to admin notes", "Update responsibility area", "Plan next FocusDojo session"];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-3 py-5 sm:px-4 md:p-8">
      <section className="overflow-hidden rounded-[1.5rem] border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/70 to-lime-50 p-5 shadow-sm md:rounded-[2rem] md:p-7">
        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700/60">ScienceDojo internal</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-emerald-950 md:text-4xl">
              Good momentum, {displayName.split(" ")[0] || "team"}.
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-bold leading-7 text-emerald-900/60">
              A calm workspace for internal notes, weekly focus, profile context, and deep-work tools.
            </p>
          </div>
          <div className="flex items-center justify-center gap-4 md:justify-end">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.75rem] border border-white bg-white text-2xl font-black text-emerald-700 shadow-sm">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
            <PlantIllustration />
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.35fr_1fr]">
        <InternalClock />

        <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm md:rounded-[2rem]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700/50">Weekly plan</p>
              <h2 className="mt-2 text-xl font-black text-emerald-950">This week</h2>
            </div>
            <span className="rounded-full bg-lime-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-lime-700">Static v1</span>
          </div>
          <div className="mt-4 grid gap-2">
            {weeklyPlan.map((item, index) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl bg-emerald-50/70 p-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white text-xs font-black text-emerald-700">{index + 1}</span>
                <p className="text-sm font-bold text-emerald-950/70">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm md:rounded-[2rem]">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700/50">
            {today.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </p>
          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase tracking-[0.08em] text-emerald-900/35">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <div
                key={`${day || "blank"}-${index}`}
                className={`flex aspect-square items-center justify-center rounded-xl text-xs font-black ${
                  day === todayDate ? "bg-emerald-600 text-white" : day ? "bg-emerald-50 text-emerald-900/65" : ""
                }`}
              >
                {day || ""}
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm md:rounded-[2rem]">
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700/50">Profile</p>
            <h2 className="mt-2 text-xl font-black text-emerald-950">About you</h2>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
            <p className="text-sm font-bold leading-7 text-emerald-950/65">
              {internalProfile.bio || "Add a short bio in settings so internal collaborators know how you help ScienceDojo."}
            </p>
            <Link href="/dashboard/internal/settings" className="mt-4 inline-flex rounded-xl bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700 shadow-sm hover:bg-emerald-600 hover:text-white">
              Edit settings
            </Link>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm md:rounded-[2rem]">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700/50">To-do list</p>
          <h2 className="mt-2 text-xl font-black text-emerald-950">Today&apos;s quick wins</h2>
          <div className="mt-4 grid gap-2">
            {todoItems.map((item) => (
              <label key={item} className="flex items-center gap-3 rounded-2xl bg-lime-50/70 p-3">
                <input type="checkbox" className="h-4 w-4 rounded border-emerald-200 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-950/70">{item}</span>
              </label>
            ))}
          </div>
          <Link href={focusDojoUrl} target="_blank" rel="noopener noreferrer" className="mt-5 flex items-center justify-between rounded-2xl bg-gradient-to-br from-emerald-600 to-lime-500 p-4 text-white shadow-lg shadow-emerald-200 transition-transform hover:-translate-y-0.5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/70">FocusDojo</p>
              <p className="mt-1 text-lg font-black">Open deep-work tool</p>
            </div>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black">Launch</span>
          </Link>
          <Link href="/dashboard/messages" className="mt-3 flex items-center justify-between rounded-2xl border border-emerald-100 bg-white p-4 text-emerald-950 shadow-sm transition-colors hover:border-emerald-200 hover:bg-emerald-50">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700/50">Messages</p>
              <p className="mt-1 text-lg font-black">Message team</p>
            </div>
            <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-black text-white">Open</span>
          </Link>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
        <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm md:rounded-[2rem]">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700/50">Role</p>
          <h2 className="mt-2 text-xl font-black capitalize text-emerald-950">
            {internalMember.title || formatRole(internalMember.role)}
          </h2>
          <p className="mt-4 text-sm font-medium leading-7 text-emerald-950/60">
            {internalMember.responsibility_area || "No responsibility area has been set yet."}
          </p>
        </section>

        <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm md:rounded-[2rem]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700/50">Internal notes</p>
              <h2 className="mt-2 text-xl font-black text-emerald-950">Current context</h2>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-900/30">
              {formatDate(internalMember.updated_at)}
            </p>
          </div>
          <div className="min-h-36 whitespace-pre-wrap rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm font-medium leading-7 text-emerald-950/65">
            {internalMember.notes || "No internal notes have been added yet."}
          </div>
        </section>
      </div>
    </div>
  );
}
