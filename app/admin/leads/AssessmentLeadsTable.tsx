"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import FollowUpDrafts from "./FollowUpDrafts";
import LeadStatusForm from "./LeadStatusForm";

export type AssessmentLeadTableRow = {
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
  whatsappDraft: string;
  emailSubject: string;
  emailBody: string;
  noteValues: {
    weakTopics: string;
    upcomingExams: string;
    hardestRightNow: string;
    studyConcerns: string;
    preferredSupport: string;
    goal: string;
  };
};

function formatLeadStatus(status: string) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getWhatsAppHref(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}

function getStatusTone(status: string) {
  if (status === "converted") return "border-emerald-100 bg-emerald-50 text-emerald-700";
  if (status === "consultation_booked") return "border-amber-100 bg-amber-50 text-amber-700";
  if (status === "tutor_matched") return "border-cyan-100 bg-cyan-50 text-cyan-700";
  if (status === "awaiting_review") return "border-indigo-100 bg-indigo-50 text-indigo-700";
  if (status === "new_inquiry") return "border-sky-100 bg-sky-50 text-sky-700";
  if (status === "inactive" || status === "closed") return "border-slate-100 bg-slate-50 text-slate-600";
  return "border-secondary/10 bg-surface text-secondary/55";
}

function getLearningSignalPreview(lead: AssessmentLeadTableRow) {
  return [
    lead.noteValues.hardestRightNow,
    lead.noteValues.studyConcerns,
    lead.noteValues.weakTopics,
    lead.main_challenge,
  ]
    .filter((value) => value && value !== "Not specified")
    .slice(0, 2)
    .join(" · ");
}

function DetailBlock({ label, value }: { label: string; value?: string | null }) {
  if (!value || value === "Not specified") return null;

  return (
    <div className="rounded-2xl border border-secondary/8 bg-white px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-secondary/35">{label}</p>
      <p className="mt-1 text-sm font-bold leading-6 text-secondary/72">{value}</p>
    </div>
  );
}

function IntakeSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.35rem] border border-secondary/10 bg-surface/60 p-4">
      <h3 className="text-sm font-black text-secondary">{title}</h3>
      <div className="mt-3 grid gap-2">{children}</div>
    </section>
  );
}

function LeadDetailDrawer({
  lead,
  onClose,
}: {
  lead: AssessmentLeadTableRow;
  onClose: () => void;
}) {
  const whatsappHref = getWhatsAppHref(lead.whatsapp_number);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Assessment lead details">
      <button
        type="button"
        aria-label="Close assessment lead details"
        className="absolute inset-0 h-full w-full bg-slate-950/45 backdrop-blur-sm"
        onClick={onClose}
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-3xl flex-col overflow-hidden bg-white shadow-2xl shadow-slate-950/25 md:w-[min(46rem,calc(100vw-3rem))] md:rounded-l-[2rem]">
        <header className="border-b border-secondary/10 bg-gradient-to-br from-white via-[#fbfdff] to-[#f4f9ff] px-5 py-5 md:px-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/70">Assessment lead</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-secondary md:text-3xl">{lead.student_name || "Student"}</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-secondary/55">
                {lead.subject_needed || "Subject not specified"} · {lead.curriculum || "Curriculum not specified"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-secondary/10 bg-white text-2xl leading-none text-secondary/55 shadow-sm transition-colors hover:bg-surface hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label="Close details"
            >
              ×
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-secondary/45">
            <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${getStatusTone(lead.status)}`}>
              {formatLeadStatus(lead.status)}
            </span>
            <span>{formatDate(lead.created_at)}</span>
            {lead.source && <span>Source: {lead.source}</span>}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-7">
          <div className="grid gap-5">
            <section className="rounded-[1.5rem] border border-primary/10 bg-primary/5 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-primary/70">Parent concern summary</p>
              <p className="mt-2 text-base font-black leading-7 text-secondary">
                {lead.main_challenge || lead.noteValues.hardestRightNow || "The family has shared an assessment request and needs a calm review before follow-up."}
              </p>
              <p className="mt-2 text-sm font-bold leading-6 text-secondary/55">
                Next step → Review the intake, confirm the assessment time, and guide the family toward the right support pathway.
              </p>
            </section>

            <div className="grid gap-3 md:grid-cols-2">
              <IntakeSection title="Student profile">
                <DetailBlock label="Student" value={lead.student_name} />
                <DetailBlock label="Year / grade" value={lead.student_grade} />
                <DetailBlock label="Curriculum" value={lead.curriculum} />
              </IntakeSection>

              <IntakeSection title="Subject & goals">
                <DetailBlock label="Subject" value={lead.subject_needed} />
                <DetailBlock label="Weak topics" value={lead.noteValues.weakTopics} />
                <DetailBlock label="Upcoming exams" value={lead.noteValues.upcomingExams} />
                <DetailBlock label="Goal" value={lead.noteValues.goal} />
              </IntakeSection>

              <IntakeSection title="Confidence & gaps">
                <DetailBlock label="What feels hardest" value={lead.noteValues.hardestRightNow || lead.main_challenge} />
                <DetailBlock label="Why support feels needed now" value={lead.main_challenge} />
              </IntakeSection>

              <IntakeSection title="Study habits & concerns">
                <DetailBlock label="Study concerns" value={lead.noteValues.studyConcerns} />
              </IntakeSection>

              <IntakeSection title="Support style">
                <DetailBlock label="Preferred support" value={lead.noteValues.preferredSupport} />
                <DetailBlock label="Successful next few months" value={lead.noteValues.goal} />
              </IntakeSection>

              <IntakeSection title="Contact preferences">
                <DetailBlock label="Parent" value={lead.parent_name} />
                <DetailBlock label="Email" value={lead.email} />
                <DetailBlock label="WhatsApp" value={lead.whatsapp_number} />
                <DetailBlock label="Preferred assessment time" value={lead.preferred_time} />
              </IntakeSection>
            </div>

            {lead.message && (
              <section className="rounded-[1.5rem] border border-secondary/10 bg-white p-4">
                <h3 className="text-sm font-black text-secondary">Full intake notes</h3>
                <pre className="mt-3 max-h-72 overflow-y-auto whitespace-pre-wrap rounded-2xl bg-surface p-4 text-xs font-semibold leading-6 text-secondary/60">
                  {lead.message}
                </pre>
              </section>
            )}

            <section className="rounded-[1.5rem] border border-primary/10 bg-primary/5 p-4">
              <h3 className="text-sm font-black text-secondary">Suggested follow-up</h3>
              <p className="mt-1 text-xs font-bold leading-5 text-secondary/50">
                Calm drafts for quick response. Review and personalize before sending.
              </p>
              <div className="mt-4">
                <FollowUpDrafts
                  variant="panel"
                  whatsappMessage={lead.whatsappDraft}
                  emailSubject={lead.emailSubject}
                  emailBody={lead.emailBody}
                />
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-secondary/10 bg-white p-4">
              <h3 className="text-sm font-black text-secondary">Operational actions</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-start">
                <LeadStatusForm leadId={lead.id} currentStatus={lead.status} />
                <a
                  href={`mailto:${lead.email}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-secondary/10 bg-surface px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-secondary/60 transition-colors hover:border-primary/25 hover:text-primary"
                >
                  Email parent
                </a>
                {whatsappHref && (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700 transition-colors hover:border-emerald-200 hover:bg-emerald-100/70"
                  >
                    WhatsApp
                  </a>
                )}
              </div>
            </section>
          </div>
        </div>
      </aside>
    </div>
  );
}

function LeadDetailPanel({
  lead,
  onCollapse,
}: {
  lead: AssessmentLeadTableRow | null;
  onCollapse: () => void;
}) {
  if (!lead) {
    return (
      <div className="rounded-2xl border border-secondary/10 bg-white px-4 py-3 text-sm font-bold text-secondary/48 shadow-sm">
        Select a lead to review intake details.
      </div>
    );
  }

  const whatsappHref = getWhatsAppHref(lead.whatsapp_number);

  return (
    <section className="overflow-hidden rounded-[2rem] border border-secondary/10 bg-white shadow-sm">
      <header className="border-b border-secondary/10 bg-gradient-to-br from-white via-[#fbfdff] to-[#f4f9ff] p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/70">Selected lead</p>
        <div className="mt-3 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-black tracking-tight text-secondary">{lead.student_name || "Student"}</h2>
            <p className="mt-1 text-sm font-bold text-secondary/50">Parent: {lead.parent_name || "Not specified"}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${getStatusTone(lead.status)}`}>
              {formatLeadStatus(lead.status)}
            </span>
            <button
              type="button"
              onClick={onCollapse}
              className="rounded-full border border-secondary/10 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-secondary/45 transition-colors hover:border-primary/25 hover:text-primary"
            >
              Collapse
            </button>
          </div>
        </div>
        <p className="mt-3 text-sm font-bold leading-6 text-secondary/55">
          {lead.subject_needed || "Subject not specified"} · {lead.curriculum || "Curriculum not specified"} {lead.student_grade ? `· ${lead.student_grade}` : ""}
        </p>
      </header>

      <div className="p-5">
        <div className="grid gap-4">
          <section className="rounded-[1.5rem] border border-primary/10 bg-primary/5 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-primary/70">Parent concern summary</p>
            <p className="mt-2 text-base font-black leading-7 text-secondary">
              {lead.main_challenge || lead.noteValues.hardestRightNow || "The family has shared an assessment request and needs a calm review before follow-up."}
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-secondary/55">
              Next step → Review the intake, confirm the assessment time, and guide the family toward the right support pathway.
            </p>
          </section>

          <section className="rounded-[1.5rem] border border-secondary/10 bg-white p-4">
            <h3 className="text-sm font-black text-secondary">Contact</h3>
            <div className="mt-3 grid gap-2">
              <DetailBlock label="Email" value={lead.email} />
              <DetailBlock label="WhatsApp" value={lead.whatsapp_number} />
              <DetailBlock label="Preferred time" value={lead.preferred_time} />
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-secondary/10 bg-surface/60 p-4">
            <h3 className="text-sm font-black text-secondary">Learning profile</h3>
            <div className="mt-3 grid gap-2">
              <DetailBlock label="Main challenge" value={lead.main_challenge} />
              <DetailBlock label="Hardest right now" value={lead.noteValues.hardestRightNow} />
              <DetailBlock label="Study concerns" value={lead.noteValues.studyConcerns} />
              <DetailBlock label="Weak topics" value={lead.noteValues.weakTopics} />
              <DetailBlock label="Preferred support" value={lead.noteValues.preferredSupport} />
              <DetailBlock label="Goal" value={lead.noteValues.goal} />
            </div>
          </section>

          {lead.message && (
            <section className="rounded-[1.5rem] border border-secondary/10 bg-white p-4">
              <h3 className="text-sm font-black text-secondary">Full intake notes</h3>
              <pre className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-2xl bg-surface p-4 text-xs font-semibold leading-6 text-secondary/60">
                {lead.message}
              </pre>
            </section>
          )}

          <section className="rounded-[1.5rem] border border-primary/10 bg-primary/5 p-4">
            <h3 className="text-sm font-black text-secondary">Suggested follow-up</h3>
            <p className="mt-1 text-xs font-bold leading-5 text-secondary/50">
              Review and personalize before sending.
            </p>
            <div className="mt-4">
              <FollowUpDrafts
                variant="panel"
                whatsappMessage={lead.whatsappDraft}
                emailSubject={lead.emailSubject}
                emailBody={lead.emailBody}
              />
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-secondary/10 bg-white p-4">
            <h3 className="text-sm font-black text-secondary">Actions</h3>
            <div className="mt-3 grid gap-3 lg:flex lg:flex-wrap lg:items-center">
              <LeadStatusForm leadId={lead.id} currentStatus={lead.status} variant="compact" />
              <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:items-center">
                <a
                  href={`mailto:${lead.email}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-secondary/10 bg-surface px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-secondary/60 transition-colors hover:border-primary/25 hover:text-primary lg:h-10 lg:min-h-10 lg:rounded-xl lg:px-3 lg:py-2"
                >
                  Email parent
                </a>
                {whatsappHref && (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700 transition-colors hover:border-emerald-200 hover:bg-emerald-100/70 lg:h-10 lg:min-h-10 lg:rounded-xl lg:px-3 lg:py-2"
                  >
                    WhatsApp
                  </a>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

export default function AssessmentLeadsTable({ rows }: { rows: AssessmentLeadTableRow[] }) {
  const [selectedLead, setSelectedLead] = useState<AssessmentLeadTableRow | null>(null);
  const [drawerLead, setDrawerLead] = useState<AssessmentLeadTableRow | null>(null);

  return (
    <>
      <div className="grid gap-3 lg:hidden">
        {rows.map((lead) => {
          const signalPreview = getLearningSignalPreview(lead);

          return (
            <article key={lead.id} className="rounded-[1.5rem] border border-secondary/10 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-black text-secondary">{lead.student_name || "Student"}</h2>
                  <p className="mt-1 text-xs font-bold text-secondary/45">Parent: {lead.parent_name || "Not specified"}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.09em] ${getStatusTone(lead.status)}`}>
                  {formatLeadStatus(lead.status)}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-secondary/50">
                {lead.subject_needed && <span>{lead.subject_needed}</span>}
                {lead.curriculum && <span>· {lead.curriculum}</span>}
                {lead.student_grade && <span>· {lead.student_grade}</span>}
              </div>

              <p className="mt-2 text-xs font-bold text-secondary/38">{formatDate(lead.created_at)}</p>

              <div className="mt-4 rounded-2xl bg-surface px-3 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-secondary/35">Signal</p>
                <p className="mt-1 line-clamp-3 text-sm font-bold leading-6 text-secondary/68">
                  {signalPreview || "Open details to review this family's learning intake."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDrawerLead(lead)}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-primary px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-white shadow-sm shadow-primary/15 transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                View details
              </button>
            </article>
          );
        })}

        {rows.length === 0 && (
          <div className="rounded-[1.5rem] border border-secondary/10 bg-white p-8 text-center text-sm font-bold text-secondary/40 shadow-sm">
            No assessment leads yet.
          </div>
        )}
      </div>

      <div className="hidden space-y-4 lg:block">
        <section className="overflow-hidden rounded-[2rem] border border-secondary/10 bg-white shadow-sm">
          <div className="border-b border-secondary/8 bg-surface/70 px-5 py-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-secondary/38">Lead list</p>
            <h2 className="mt-1 text-xl font-black text-secondary">Assessment pipeline</h2>
          </div>
          <div className="divide-y divide-secondary/8">
            {rows.map((lead) => {
              const signalPreview = getLearningSignalPreview(lead);
              const isSelected = selectedLead?.id === lead.id;

              return (
                <button
                  key={lead.id}
                  type="button"
                  onClick={() => setSelectedLead((current) => (current?.id === lead.id ? null : lead))}
                  className={`grid w-full gap-3 px-5 py-4 text-left transition-colors hover:bg-primary/4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
                    isSelected ? "bg-primary/5" : "bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-secondary">{lead.student_name || "Student"}</p>
                      <p className="mt-1 truncate text-xs font-bold text-secondary/45">Parent: {lead.parent_name || "Not specified"}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${getStatusTone(lead.status)}`}>
                      {formatLeadStatus(lead.status)}
                    </span>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[0.85fr_1.15fr_auto] md:items-start">
                    <div>
                      <p className="text-sm font-black text-secondary">{lead.subject_needed || "Subject not specified"}</p>
                      <p className="mt-1 text-xs font-bold text-secondary/45">
                        {[lead.curriculum, lead.student_grade].filter(Boolean).join(" · ") || "Curriculum not specified"}
                      </p>
                    </div>
                    <p className="line-clamp-2 text-sm font-bold leading-6 text-secondary/58">
                      {signalPreview || "Open details to review this family's learning intake."}
                    </p>
                    <p className="text-xs font-bold text-secondary/38 md:text-right">{formatDate(lead.created_at)}</p>
                  </div>
                </button>
              );
            })}

            {rows.length === 0 && (
              <div className="p-12 text-center text-sm font-bold text-secondary/40">
                No assessment leads yet.
              </div>
            )}
          </div>
        </section>

        <LeadDetailPanel lead={selectedLead} onCollapse={() => setSelectedLead(null)} />
      </div>

      {drawerLead && (
        <LeadDetailDrawer
          lead={drawerLead}
          onClose={() => setDrawerLead(null)}
        />
      )}
    </>
  );
}
