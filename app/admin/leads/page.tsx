import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createAdminClient, createClient } from "@/utils/supabase/server";
import AssessmentLeadsTable, { type AssessmentLeadTableRow } from "./AssessmentLeadsTable";
import { generateEmailFollowUp, generateWhatsAppFollowUp, getLeadNoteValue } from "./followUpDraftGenerators";

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
  const tableRows: AssessmentLeadTableRow[] = rows.map((lead) => {
    const whatsappDraft = generateWhatsAppFollowUp(lead);
    const emailDraft = generateEmailFollowUp(lead);

    return {
      ...lead,
      whatsappDraft: whatsappDraft.message,
      emailSubject: emailDraft.subject,
      emailBody: emailDraft.body,
      noteValues: {
        weakTopics: getLeadNoteValue(lead.message, "Weak topics"),
        upcomingExams: getLeadNoteValue(lead.message, "Upcoming exams"),
        hardestRightNow: getLeadNoteValue(lead.message, "What feels hardest"),
        studyConcerns: getLeadNoteValue(lead.message, "Study habits and concerns"),
        preferredSupport: getLeadNoteValue(lead.message, "Preferred support style"),
        goal: getLeadNoteValue(lead.message, "Successful next few months"),
      },
    };
  });

  return (
    <main className="min-h-screen bg-background px-3 py-6 text-secondary sm:px-4 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary/75 md:text-xs md:tracking-[0.25em]">ScienceDojo admin</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:mt-3 md:text-4xl">Assessment Leads</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-secondary/58 md:mt-3">Review learning intake profiles, parent concerns, confidence signals, and assessment pipeline status.</p>
          </div>
          <Link href="/dashboard/admin" className="inline-flex w-fit items-center justify-center rounded-2xl bg-secondary px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-white shadow-sm md:px-5 md:py-3 md:text-sm md:tracking-[0.14em]">
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

        <AssessmentLeadsTable rows={tableRows} />
      </div>
    </main>
  );
}
