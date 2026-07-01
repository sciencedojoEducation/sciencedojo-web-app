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

type MetricCard = {
  label: string;
  value: number;
  context: string;
  accent?: string;
  tone: string;
  valueTone?: string;
  labelTone?: string;
  contextTone?: string;
};

const statuses: Array<{ key: LeadStatus; label: string; accent: string; context: string; tone: string; valueTone: string; labelTone: string; contextTone: string }> = [
  { key: "new_inquiry", label: "New inquiry", accent: "bg-sky-400", context: "active inquiries", tone: "border-sky-100 bg-sky-50/85", valueTone: "text-sky-800", labelTone: "text-sky-700", contextTone: "text-sky-700/55" },
  { key: "awaiting_review", label: "Awaiting review", accent: "bg-indigo-400", context: "ready for review", tone: "border-indigo-100 bg-indigo-50/85", valueTone: "text-indigo-800", labelTone: "text-indigo-700", contextTone: "text-indigo-700/55" },
  { key: "consultation_booked", label: "Consultation", accent: "bg-amber-400", context: "calls booked", tone: "border-amber-100 bg-amber-50/85", valueTone: "text-amber-800", labelTone: "text-amber-700", contextTone: "text-amber-700/55" },
  { key: "tutor_matched", label: "Tutor matched", accent: "bg-cyan-400", context: "support matched", tone: "border-cyan-100 bg-cyan-50/85", valueTone: "text-cyan-800", labelTone: "text-cyan-700", contextTone: "text-cyan-700/55" },
  { key: "converted", label: "Converted", accent: "bg-emerald-400", context: "families converted", tone: "border-emerald-100 bg-emerald-50/85", valueTone: "text-emerald-800", labelTone: "text-emerald-700", contextTone: "text-emerald-700/55" },
  { key: "inactive", label: "Inactive", accent: "bg-slate-300", context: "paused leads", tone: "border-slate-100 bg-slate-50/90", valueTone: "text-slate-700", labelTone: "text-slate-600", contextTone: "text-slate-500" },
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
    redirect(`/dashboard/${profile?.role || "user"}`);
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
  const needsAttentionCount = (counts.new_inquiry || 0) + (counts.awaiting_review || 0) + (counts.inactive || 0);
  const metricCards: MetricCard[] = [
    {
      label: "Total leads",
      value: totalLeads,
      context: "assessment requests",
      accent: "bg-cyan-300",
      tone: "border-secondary/20 bg-gradient-to-br from-secondary to-primary",
      valueTone: "text-white",
      labelTone: "text-white/82",
      contextTone: "text-white/58",
    },
    {
      label: "Booked / matched",
      value: bookedCount,
      context: "booked or matched",
      accent: "bg-primary",
      tone: "border-primary/15 bg-primary/5",
      valueTone: "text-secondary",
      labelTone: "text-primary",
      contextTone: "text-secondary/40",
    },
    {
      label: "Converted",
      value: convertedCount,
      context: "families converted",
      accent: "bg-emerald-400",
      tone: "border-emerald-100 bg-emerald-50/85",
      valueTone: "text-emerald-800",
      labelTone: "text-emerald-700",
      contextTone: "text-emerald-700/55",
    },
    {
      label: "Needs attention",
      value: needsAttentionCount,
      context: "new, review, or paused",
      accent: "bg-amber-400",
      tone: "border-amber-100 bg-amber-50/85",
      valueTone: "text-amber-800",
      labelTone: "text-amber-700",
      contextTone: "text-amber-700/55",
    },
  ];
  const pipelineStages = [
    { label: "Inquiry", value: counts.new_inquiry || 0, tone: "border-sky-100 bg-sky-50/80", labelTone: "text-sky-700/65", valueTone: "text-sky-800" },
    { label: "Review", value: counts.awaiting_review || 0, tone: "border-indigo-100 bg-indigo-50/80", labelTone: "text-indigo-700/65", valueTone: "text-indigo-800" },
    { label: "Consultation", value: counts.consultation_booked || 0, tone: "border-amber-100 bg-amber-50/80", labelTone: "text-amber-700/65", valueTone: "text-amber-800" },
    { label: "Tutor match", value: counts.tutor_matched || 0, tone: "border-cyan-100 bg-cyan-50/80", labelTone: "text-cyan-700/65", valueTone: "text-cyan-800" },
    { label: "Converted", value: counts.converted || 0, tone: "border-emerald-100 bg-emerald-50/80", labelTone: "text-emerald-700/65", valueTone: "text-emerald-800" },
  ];

  return (
    <main className="min-h-screen bg-background px-3 py-6 text-secondary sm:px-4 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl space-y-5 md:space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/65">ScienceDojo admin</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Funnel Overview</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-secondary/58">
              Track assessment interest, review flow, and movement toward matched tutoring support.
            </p>
          </div>
          <div className="inline-flex w-fit rounded-2xl border border-secondary/10 bg-white p-1 shadow-sm">
            {[
              ["week", "This Week"],
              ["month", "This Month"],
              ["all", "All Time"],
            ].map(([value, label]) => (
              <Link
                key={value}
                href={`/dashboard/admin/overview?period=${value}`}
                className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] transition-colors sm:px-4 ${
                  period === value ? "bg-primary text-white shadow-sm" : "text-secondary/45 hover:text-secondary"
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

        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {metricCards.map((metric, index) => (
            <div
              key={`${metric.label}-${index}`}
              className={`rounded-2xl border p-4 shadow-sm ${metric.tone}`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className={`text-3xl font-black leading-none ${metric.valueTone || "text-secondary"}`}>{metric.value}</p>
                {metric.accent && <span className={`mt-1 h-2 w-2 rounded-full ${metric.accent}`} />}
              </div>
              <p className={`mt-3 text-xs font-black ${metric.labelTone || "text-secondary/62"}`}>{metric.label}</p>
              <p className={`mt-1 text-[11px] font-bold leading-4 ${metric.contextTone || "text-secondary/38"}`}>{metric.context}</p>
            </div>
          ))}
        </section>

        <section className="rounded-[1.5rem] border border-secondary/10 bg-white p-4 shadow-sm md:rounded-[2rem] md:p-5">
          <div className="mb-4 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-secondary/35">Operational pipeline</p>
              <h2 className="mt-1 text-xl font-black text-secondary">Assessment to support</h2>
            </div>
            <p className="text-xs font-bold text-secondary/42">{period === "all" ? "All time" : period === "week" ? "This week" : "This month"}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-5">
            {pipelineStages.map((stage, index) => (
              <div key={stage.label} className={`relative rounded-2xl border px-4 py-3 ${stage.tone}`}>
                {index < pipelineStages.length - 1 && (
                  <span className="absolute right-[-0.55rem] top-1/2 z-10 hidden -translate-y-1/2 text-secondary/20 sm:block">&rarr;</span>
                )}
                <p className={`text-xl font-black ${stage.valueTone}`}>{stage.value}</p>
                <p className={`mt-1 text-[10px] font-black uppercase tracking-[0.09em] ${stage.labelTone}`}>{stage.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-2 sm:grid-cols-3">
          {[
            {
              href: "/dashboard/admin/leads",
              title: "Manage leads",
              description: "Review and organize assessment requests.",
            },
            {
              href: "/free-assessment",
              title: "View assessment page",
              description: "Open the public intake experience.",
            },
            {
              href: "/#directory",
              title: "View tutor directory",
              description: "Review the public tutor marketplace.",
            },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group rounded-2xl border border-secondary/10 bg-white px-4 py-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <span className="flex items-center justify-between gap-3 text-sm font-black text-secondary transition-colors group-hover:text-primary">
                {action.title}
                <span className="text-secondary/32 transition-transform group-hover:translate-x-0.5 group-hover:text-primary/70" aria-hidden="true">&rarr;</span>
              </span>
              <span className="mt-1 block text-xs font-bold leading-5 text-secondary/40">{action.description}</span>
            </Link>
          ))}
        </section>

        <section className="overflow-hidden rounded-[1.5rem] border border-secondary/10 bg-white shadow-sm md:rounded-[2rem]">
          <div className="border-b border-secondary/8 p-4 md:p-5">
            <h2 className="text-xl font-black">Recent assessment activity</h2>
            <p className="mt-1 text-sm font-bold text-secondary/42">Latest intake requests for the selected period.</p>
          </div>
          <div className="divide-y divide-secondary/8">
            {newestLeads.map((lead) => {
              const status = statuses.find((item) => item.key === lead.status);
              const statusTone = status ? `${status.tone} ${status.labelTone}` : "border-secondary/10 bg-surface text-secondary/55";

              return (
                <div key={lead.id} className="grid gap-3 p-4 md:grid-cols-[1fr_1fr_auto_auto] md:items-center">
                  <div>
                    <p className="font-black">{lead.parent_name}</p>
                    <p className="text-sm font-bold text-secondary/45">{lead.student_name}</p>
                  </div>
                  <div>
                    <p className="font-bold">{lead.subject_needed}</p>
                    <p className="text-sm font-bold text-secondary/45">{lead.curriculum}</p>
                  </div>
                  <div>
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${statusTone}`}>{lead.status.replace(/_/g, " ")}</span>
                  </div>
                  <p className="text-sm font-bold text-secondary/42 md:text-right">
                    {new Date(lead.created_at).toLocaleString("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              );
            })}
            {newestLeads.length === 0 && (
              <div className="p-8 text-center text-sm font-bold text-secondary/40">No leads for this period.</div>
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
