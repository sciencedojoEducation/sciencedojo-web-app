"use client";

import { useState } from "react";
import { Announcement } from "@/lib/announcement-queries";
import { createAnnouncement, deleteAnnouncement, toggleAnnouncementActive } from "./actions";
import { formatDistanceToNow } from "date-fns";

interface AdminBroadcastUIProps {
  announcements: Announcement[];
}

export default function AdminBroadcastUI({ announcements }: AdminBroadcastUIProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function handleCreate(formData: FormData) {
    setIsSubmitting(true);
    try {
      await createAnnouncement(formData);
      setShowForm(false);
    } catch (err) {
      alert("Failed to create announcement: " + (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-3 py-5 sm:px-4 md:p-8 md:space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/70 md:text-xs">ScienceDojo admin</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-secondary md:text-3xl">
            Broadcast Center
          </h1>
          <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-secondary/55">
            Manage communication across the ScienceDojo platform quickly and clearly.
          </p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="inline-flex min-h-11 w-fit items-center justify-center rounded-2xl bg-primary px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-white shadow-sm shadow-primary/15 transition-colors hover:bg-primary-hover md:px-6 md:text-sm"
        >
          {showForm ? "Cancel" : "New Announcement"}
        </button>
      </div>

      {showForm && (
        <section className="animate-in fade-in slide-in-from-top-4 rounded-[1.5rem] border border-primary/15 bg-white p-4 shadow-lg shadow-primary/5 duration-300 md:rounded-[2rem] md:p-8">
          <form action={handleCreate} className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              <div className="space-y-2">
                <label className="pl-1 text-[10px] font-black uppercase tracking-[0.14em] text-secondary/40 md:pl-2 md:text-xs">Headline</label>
                <input 
                  name="title" 
                  required 
                  placeholder="e.g., Upcoming Maintenance" 
                  className="w-full rounded-2xl border border-secondary/10 bg-slate-50 p-3 font-bold outline-none focus:border-primary md:p-4"
                />
              </div>
              <div className="space-y-2">
                <label className="pl-1 text-[10px] font-black uppercase tracking-[0.14em] text-secondary/40 md:pl-2 md:text-xs">Target Audience</label>
                <select 
                  name="target_role" 
                  className="w-full appearance-none rounded-2xl border border-secondary/10 bg-slate-50 p-3 font-bold outline-none focus:border-primary md:p-4"
                >
                  <option value="all">Everyone</option>
                  <option value="tutor">Tutors Only</option>
                  <option value="parent">Parents Only</option>
                  <option value="student">Students Only</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="pl-1 text-[10px] font-black uppercase tracking-[0.14em] text-secondary/40 md:pl-2 md:text-xs">Announcement Content</label>
              <textarea 
                name="content" 
                required 
                rows={4}
                placeholder="Write your platform update here..."
                className="w-full rounded-2xl border border-secondary/10 bg-slate-50 p-3 font-medium leading-relaxed outline-none focus:border-primary md:p-4"
              ></textarea>
            </div>

            <div className="flex items-center gap-4 pl-1 md:pl-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input name="is_pinned" type="checkbox" className="w-5 h-5 rounded-lg border-2 border-secondary/20 text-primary focus:ring-primary focus:ring-offset-0" />
                <span className="text-sm font-bold text-secondary group-hover:text-primary transition-colors">Pin to Dashboard Top</span>
              </label>
            </div>

            <div className="pt-2 md:pt-4">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="min-h-11 w-full rounded-2xl bg-primary px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50 md:py-4 md:text-sm"
              >
                {isSubmitting ? "Launching..." : "Broadcast to Platform"}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="space-y-4 md:space-y-6">
        <h2 className="flex items-center gap-3 text-lg font-black text-secondary md:text-xl">
          <span className="h-5 w-1 rounded-full bg-primary md:h-6"></span>
          Previous Broadcasts
        </h2>
        
        <div className="grid gap-3 md:gap-6">
          {announcements.map((ann) => (
            <div key={ann.id} className={`rounded-[1.5rem] border bg-white p-4 transition-all md:rounded-[2rem] md:p-6 ${ann.is_active ? 'border-secondary/5 shadow-sm md:shadow-md' : 'opacity-60 grayscale border-dashed border-secondary/20'}`}>
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between md:mb-4">
                <div className="flex min-w-0 items-start gap-3">
                  {ann.is_pinned && <span className="mt-0.5 text-sm md:text-lg">📌</span>}
                  <div>
                    <h3 className="text-base font-black leading-6 text-secondary md:text-lg">{ann.title}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2 md:mt-1">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                        ann.target_role === 'all' ? 'bg-slate-100 text-slate-500' :
                        ann.target_role === 'tutor' ? 'bg-primary/10 text-primary' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        Target: {ann.target_role}
                      </span>
                      <span className="text-[10px] font-bold text-secondary/30">{formatDistanceToNow(new Date(ann.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button 
                    onClick={async () => {
                      try {
                        await toggleAnnouncementActive(ann.id, ann.is_active);
                      } catch (err) {
                        alert("Failed to toggle: " + (err as Error).message);
                      }
                    }}
                    className={`min-h-10 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all md:px-4 ${
                      ann.is_active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {ann.is_active ? "Archive" : "Activate"}
                  </button>
                  <button 
                    onClick={async () => { 
                      if(confirm("Permanently delete?")) {
                        try {
                          await deleteAnnouncement(ann.id);
                        } catch (err) {
                          alert("Failed to delete: " + (err as Error).message);
                        }
                      } 
                    }}
                    className="min-h-10 rounded-xl p-2 text-secondary/25 transition-colors hover:bg-red-50 hover:text-red-500"
                    aria-label={`Delete announcement ${ann.title}`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm font-medium leading-6 text-secondary/68 md:leading-relaxed">{ann.content}</p>
            </div>
          ))}

          {announcements.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-[1.5rem] border border-dashed border-secondary/10 bg-slate-50 p-8 text-center md:rounded-[2.5rem] md:p-20">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl text-secondary/20 shadow-sm md:h-16 md:w-16 md:text-3xl">🗞️</div>
              <p className="text-sm font-black uppercase tracking-widest text-secondary/30">No announcements broadcast yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
