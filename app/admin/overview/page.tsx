import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "Funnel Overview | ScienceDojo Admin",
  robots: {
    index: false,
    follow: false,
  },
};

type LeadStatus =
  | "new_inquiry"
  | "awaiting_review"
  | "consultation_booked"
  | "tutor_matched"
  | "converted"
  | "inactive"
  | "new"
  | "contacted"
  | "booked"
  | "closed";

type AssessmentLead = {
  id: string;
  parent_name: string;
  student_name: string;
  subject_needed: string;
  curriculum: string;
  status: LeadStatus;
  created_at: string;
};

const statuses: Array<{ key: LeadStatus; label: string; tone: string }> = [
  { key: "new_inquiry", label: "New inquiry", tone: "bg-sky-50 text-sky-700 border-sky-100" },
  { key: "awaiting_review", label: "Awaiting review", tone: "bg-indigo-50 text-indigo-700 border-indigo-100" },
  { key: "consultation_booked", label: "Consultation booked", tone: "bg-amber-50 text-amber-700 border-amber-100" },
  { key: "tutor_matched", label: "Tutor matched", tone: "bg-cyan-50 text-cyan-700 border-cyan-100" },
  { key: "converted", label: "Converted", tone: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  { key: "inactive", label: "Inactive", tone: "bg-slate-50 text-slate-600 border-slate-100" },
];

function getFilterStart(filter: string) {
  const now = new Date();

  if (filter === "week") {
    const start = new Date(now);
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
    start.setHours(0, 0, 0, 0);
    return start.toISOString();
  }

  if (filter === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  }

  return null;
}

function isMissingAssessmentLeadsTable(message?: string) {
  return Boolean(message?.includes("assessment_leads") && message.includes("schema cache"));
}

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const period = params.period === "week" || params.period === "month" ? params.period : "all";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/admin/overview");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect(`/dashboard/${profile?.role || "parent"}`);
  }

  const startDate = getFilterStart(period);
  const adminClient = await createAdminClient();
  let query = adminClient
    .from("assessment_leads")
    .select("id, parent_name, student_name, subject_needed, curriculum, status, created_at")
    .order("created_at", { ascending: false });

  if (startDate) {
    query = query.gte("created_at", startDate);
  }

  const { data, error } = await query;
  const leads = (data || []) as AssessmentLead[];
  const totalLeads = leads.length;
  const counts = Object.fromEntries(statuses.map((status) => [status.key, 0])) as Record<LeadStatus, number>;

  for (const lead of leads) {
    counts[lead.status] = (counts[lead.status] || 0) + 1;
  }

  const newestLeads = leads.slice(0, 5);
  const bookedCount = (counts.consultation_booked || 0) + (counts.tutor_matched || 0) + (counts.converted || 0) + (counts.booked || 0);
  const convertedCount = counts.converted;

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-secondary md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">ScienceDojo admin</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight">Funnel Overview</h1>
            <p className="mt-3 max-w-2xl text-secondary/60">
              Track free assessment leads and how they move toward booked or converted tutoring.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              ["week", "This Week"],
              ["month", "This Month"],
              ["all", "All Time"],
            ].map(([value, label]) => (
              <Link
                key={value}
                href={`/dashboard/admin/overview?period=${value}`}
                className={`rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.14em] transition-colors ${
                  period === value ? "bg-primary text-white" : "bg-white text-secondary border border-secondary/10"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            <p>Could not load funnel metrics: {error.message}</p>
            {isMissingAssessmentLeadsTable(error.message) && (
              <p className="mt-2 text-red-600">
                Run <span className="font-black">sql/035_assessment_leads.sql</span> in Supabase SQL Editor, then refresh this page.
              </p>
            )}
          </div>
        )}

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-secondary p-6 text-white shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/50">Total Leads</p>
            <p className="mt-4 text-5xl font-black">{totalLeads}</p>
          </div>
          <div className="rounded-3xl border border-secondary/10 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-secondary/45">Lead to Booked</p>
            <p className="mt-4 text-5xl font-black text-secondary">{bookedCount}</p>
            <p className="mt-2 text-sm font-bold text-secondary/45">Booked + converted leads</p>
          </div>
          <div className="rounded-3xl border border-secondary/10 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-secondary/45">Lead to Converted</p>
            <p className="mt-4 text-5xl font-black text-emerald-600">{convertedCount}</p>
            <p className="mt-2 text-sm font-bold text-secondary/45">Marked as converted</p>
          </div>
        </section>

        <section className="mb-8 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {statuses.map((status) => (
            <div key={status.key} className={`rounded-3xl border p-5 shadow-sm ${status.tone}`}>
              <p className="text-xs font-black uppercase tracking-[0.2em] opacity-70">{status.label}</p>
              <p className="mt-4 text-4xl font-black">{counts[status.key]}</p>
            </div>
          ))}
        </section>

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <Link href="/dashboard/admin/leads" className="rounded-3xl border border-secondary/10 bg-white p-6 font-black shadow-sm transition-colors hover:border-primary/30 hover:text-primary">
            Manage Leads
          </Link>
          <Link href="/free-assessment" className="rounded-3xl border border-secondary/10 bg-white p-6 font-black shadow-sm transition-colors hover:border-primary/30 hover:text-primary">
            View Assessment Page
          </Link>
          <Link href="/#directory" className="rounded-3xl border border-secondary/10 bg-white p-6 shadow-sm transition-colors hover:border-primary/30 hover:text-primary">
            <span className="block font-black">View Public Tutor Directory</span>
            <span className="mt-2 block text-sm font-bold text-secondary/45">Homepage tutor marketplace</span>
          </Link>
        </section>

        <section className="overflow-hidden rounded-3xl border border-secondary/10 bg-white shadow-sm">
          <div className="border-b border-secondary/10 p-6">
            <h2 className="text-2xl font-black">Newest 5 Leads</h2>
            <p className="mt-2 text-sm font-bold text-secondary/45">Most recent assessment requests in the selected period.</p>
          </div>
          <div className="divide-y divide-secondary/10">
            {newestLeads.map((lead) => (
              <div key={lead.id} className="grid gap-3 p-5 md:grid-cols-[1fr_1fr_1fr_auto] md:items-center">
                <div>
                  <p className="font-black">{lead.parent_name}</p>
                  <p className="text-sm font-bold text-secondary/45">{lead.student_name}</p>
                </div>
                <div>
                  <p className="font-bold">{lead.subject_needed}</p>
                  <p className="text-sm font-bold text-secondary/45">{lead.curriculum}</p>
                </div>
                <div>
                  <span className="rounded-full bg-surface px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-secondary/60">{lead.status}</span>
                </div>
                <p className="text-sm font-bold text-secondary/45">
                  {new Date(lead.created_at).toLocaleString("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            ))}
            {newestLeads.length === 0 && (
              <div className="p-12 text-center font-bold text-secondary/40">No leads for this period.</div>
            )}
          </div>
        </section>

        {/* TODO: Add GA event reporting for public funnel visits once GA Data API credentials are configured. */}
        {/* TODO: Add source attribution when assessment_leads stores UTM/page_slug values. */}
        {/* TODO: Add lead quality scoring based on challenge, subject demand, and response speed. */}
        {/* TODO: Add tutor booking conversion tracking by linking leads to booking records. */}
      </div>
    </main>
  );
}
