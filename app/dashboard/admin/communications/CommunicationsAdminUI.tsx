"use client";

import { useState, useTransition } from "react";
import { PlatformAnnouncement } from "@/lib/platform-announcements";
import { createPlatformAnnouncement, sendTestAnnouncementEmail } from "./actions";

type EmailEventRow = {
  id: string;
  recipient_email: string;
  category: string;
  audience: string;
  template_key: string;
  subject: string;
  status: string;
  created_at: string;
  error_message?: string | null;
};

export default function CommunicationsAdminUI({
  announcements,
  emailEvents,
}: {
  announcements: PlatformAnnouncement[];
  emailEvents: EmailEventRow[];
}) {
  const [isPending, startTransition] = useTransition();
  const [preview, setPreview] = useState({
    title: "ScienceDojo update",
    message: "A short, helpful update for the selected audience.",
    category: "product",
    audience: "all",
  });

  function runAction(action: (formData: FormData) => Promise<void>, formData: FormData) {
    startTransition(async () => {
      try {
        await action(formData);
        alert("Done.");
      } catch (error) {
        alert(error instanceof Error ? error.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 md:p-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-primary/70">ScienceDojo admin</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-secondary">Communications</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-secondary/55">
            Send calm platform updates, tutor follow-ups, and policy messages by role and channel.
          </p>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <form
          action={(formData) => runAction(createPlatformAnnouncement, formData)}
          className="space-y-5 rounded-[1.5rem] border border-secondary/10 bg-white p-5 shadow-sm md:p-7"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-secondary/40">Audience</span>
              <select name="audience" className="w-full rounded-2xl border border-secondary/10 bg-slate-50 p-4 font-bold" onChange={(e) => setPreview((p) => ({ ...p, audience: e.target.value }))}>
                <option value="all">All users</option>
                <option value="tutor">Tutors</option>
                <option value="parent">Parents</option>
                <option value="student">Students</option>
                <option value="user">General users</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-secondary/40">Category</span>
              <select name="category" className="w-full rounded-2xl border border-secondary/10 bg-slate-50 p-4 font-bold" onChange={(e) => setPreview((p) => ({ ...p, category: e.target.value }))}>
                <option value="product">Product update</option>
                <option value="tutor_growth">Tutor growth</option>
                <option value="onboarding">Onboarding</option>
                <option value="service">Service/account</option>
                <option value="policy">Policy</option>
              </select>
            </label>
          </div>

          <label className="space-y-2 block">
            <span className="text-xs font-black uppercase tracking-widest text-secondary/40">Title</span>
            <input name="title" required className="w-full rounded-2xl border border-secondary/10 bg-slate-50 p-4 font-bold" value={preview.title} onChange={(e) => setPreview((p) => ({ ...p, title: e.target.value }))} />
          </label>

          <label className="space-y-2 block">
            <span className="text-xs font-black uppercase tracking-widest text-secondary/40">Message</span>
            <textarea name="message" required rows={5} className="w-full rounded-2xl border border-secondary/10 bg-slate-50 p-4 font-semibold leading-7" value={preview.message} onChange={(e) => setPreview((p) => ({ ...p, message: e.target.value }))} />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <input name="cta_label" placeholder="CTA label" className="rounded-2xl border border-secondary/10 bg-slate-50 p-4 font-bold" />
            <input name="cta_url" placeholder="https:// or /dashboard/..." className="rounded-2xl border border-secondary/10 bg-slate-50 p-4 font-bold" />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-secondary/70">
              <input name="show_dashboard" type="checkbox" defaultChecked className="h-5 w-5 accent-primary" /> Dashboard
            </label>
            <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-secondary/70">
              <input name="send_email" type="checkbox" className="h-5 w-5 accent-primary" /> Email
            </label>
            <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-secondary/70">
              <input name="show_public_updates_page" type="checkbox" className="h-5 w-5 accent-primary" /> Public updates
            </label>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="submit" disabled={isPending} className="min-h-11 rounded-2xl bg-primary px-5 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-60">
              Publish / send
            </button>
            <button formAction={(formData) => runAction(sendTestAnnouncementEmail, formData)} disabled={isPending} className="min-h-11 rounded-2xl bg-slate-100 px-5 py-3 text-xs font-black uppercase tracking-widest text-secondary/70 disabled:opacity-60">
              Send test to me
            </button>
          </div>
        </form>

        <aside className="space-y-4 rounded-[1.5rem] border border-primary/10 bg-blue-50/60 p-5">
          <p className="text-xs font-black uppercase tracking-widest text-primary/70">Preview</p>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">{preview.category.replace(/_/g, " ")} · {preview.audience}</p>
            <h2 className="mt-3 text-xl font-black text-secondary">{preview.title}</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-6 text-secondary/60">{preview.message}</p>
          </div>
          <p className="text-xs font-semibold leading-5 text-secondary/55">
            Product and tutor-growth emails respect preferences and duplicate suppression. Policy/service messages are treated separately.
          </p>
        </aside>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[1.5rem] border border-secondary/10 bg-white p-5">
          <h2 className="text-lg font-black text-secondary">Recent announcements</h2>
          <div className="mt-4 space-y-3">
            {announcements.slice(0, 8).map((announcement) => (
              <article key={announcement.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-black text-secondary">{announcement.title}</h3>
                  <span className="rounded-full bg-white px-2 py-1 text-[9px] font-black uppercase text-secondary/50">{announcement.audience}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm font-semibold text-secondary/55">{announcement.message}</p>
              </article>
            ))}
            {announcements.length === 0 && <p className="text-sm font-bold text-secondary/40">No platform announcements yet.</p>}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-secondary/10 bg-white p-5">
          <h2 className="text-lg font-black text-secondary">Email history</h2>
          <div className="mt-4 space-y-3">
            {emailEvents.slice(0, 10).map((event) => (
              <article key={event.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-black text-secondary">{event.subject}</p>
                  <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${event.status === "sent" ? "bg-emerald-50 text-emerald-600" : event.status === "failed" ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"}`}>{event.status}</span>
                </div>
                <p className="mt-1 text-xs font-semibold text-secondary/45">{event.recipient_email} · {event.template_key}</p>
                {event.error_message && <p className="mt-2 text-xs font-semibold text-red-500">{event.error_message}</p>}
              </article>
            ))}
            {emailEvents.length === 0 && <p className="text-sm font-bold text-secondary/40">No email events logged yet.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
