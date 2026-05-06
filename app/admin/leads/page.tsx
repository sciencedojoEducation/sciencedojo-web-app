import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createAdminClient, createClient } from "@/utils/supabase/server";
import LeadStatusForm from "./LeadStatusForm";

export const metadata: Metadata = {
  title: "Assessment Leads | ScienceDojo Admin",
  robots: {
    index: false,
    follow: false,
  },
};

type AssessmentLead = {
  id: string;
  parent_name: string;
  email: string;
  whatsapp_number: string;
  student_name: string;
  student_grade: string;
  curriculum: string;
  subject_needed: string;
  main_challenge: string;
  preferred_time: string;
  message: string | null;
  status: string;
  source: string;
  created_at: string;
};

function isMissingAssessmentLeadsTable(message?: string) {
  return Boolean(message?.includes("assessment_leads") && message.includes("schema cache"));
}

export default async function AdminLeadsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/admin/leads");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect(`/dashboard/${profile?.role || "parent"}`);
  }

  const adminClient = await createAdminClient();
  const { data: leads, error } = await adminClient
    .from("assessment_leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (leads || []) as AssessmentLead[];

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-secondary md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">ScienceDojo admin</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight">Assessment Leads</h1>
            <p className="mt-3 text-secondary/60">Manage free assessment requests captured from the public website.</p>
          </div>
          <Link href="/dashboard/admin" className="rounded-2xl bg-secondary px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white">
            Admin Dashboard
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            <p>Could not load leads: {error.message}</p>
            {isMissingAssessmentLeadsTable(error.message) && (
              <p className="mt-2 text-red-600">
                Run <span className="font-black">sql/035_assessment_leads.sql</span> in Supabase SQL Editor, then refresh this page.
              </p>
            )}
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-secondary/10 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full text-left">
              <thead className="bg-surface text-[10px] font-black uppercase tracking-[0.18em] text-secondary/45">
                <tr>
                  <th className="px-5 py-4">Parent</th>
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Subject</th>
                  <th className="px-5 py-4">Curriculum</th>
                  <th className="px-5 py-4">Contact</th>
                  <th className="px-5 py-4">Challenge</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary/10">
                {rows.map((lead) => (
                  <tr key={lead.id} className="align-top">
                    <td className="px-5 py-5">
                      <p className="font-black">{lead.parent_name}</p>
                      <p className="mt-1 text-xs text-secondary/45">{lead.source}</p>
                    </td>
                    <td className="px-5 py-5">
                      <p className="font-bold">{lead.student_name}</p>
                      <p className="mt-1 text-xs text-secondary/45">{lead.student_grade}</p>
                    </td>
                    <td className="px-5 py-5 font-bold">{lead.subject_needed}</td>
                    <td className="px-5 py-5 font-bold">{lead.curriculum}</td>
                    <td className="px-5 py-5">
                      <a href={`mailto:${lead.email}`} className="block text-sm font-bold text-primary">{lead.email}</a>
                      <a href={`https://wa.me/${lead.whatsapp_number.replace(/[^\d]/g, "")}`} target="_blank" rel="noreferrer" className="mt-1 block text-sm font-bold text-emerald-600">
                        {lead.whatsapp_number}
                      </a>
                      <p className="mt-2 text-xs text-secondary/45">{lead.preferred_time}</p>
                    </td>
                    <td className="max-w-xs px-5 py-5">
                      <p className="text-sm font-bold leading-6">{lead.main_challenge}</p>
                      {lead.message && <p className="mt-2 text-xs leading-5 text-secondary/50">{lead.message}</p>}
                    </td>
                    <td className="px-5 py-5">
                      <LeadStatusForm leadId={lead.id} currentStatus={lead.status} />
                    </td>
                    <td className="px-5 py-5 text-sm font-bold text-secondary/55">
                      {new Date(lead.created_at).toLocaleString("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center font-bold text-secondary/40">
                      No assessment leads yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
