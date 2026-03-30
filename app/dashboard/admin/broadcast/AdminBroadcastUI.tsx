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
    <div className="p-8 max-w-5xl mx-auto space-y-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-secondary tracking-tight mb-1">
            Broadcast Center 🏴📢
          </h1>
          <p className="text-secondary/50 font-medium">Manage platform-wide updates and announcements.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-primary text-white font-black rounded-2xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/20"
        >
          {showForm ? "Cancel" : "New Announcement"}
        </button>
      </div>

      {showForm && (
        <section className="bg-white rounded-[2rem] p-8 border-2 border-primary/20 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <form action={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-secondary/40 pl-2">Headline</label>
                <input 
                  name="title" 
                  required 
                  placeholder="e.g., Upcoming Maintenance" 
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-secondary/10 focus:outline-none focus:border-primary font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-secondary/40 pl-2">Target Audience</label>
                <select 
                  name="target_role" 
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-secondary/10 focus:outline-none focus:border-primary font-bold appearance-none"
                >
                  <option value="all">Everyone</option>
                  <option value="tutor">Tutors Only</option>
                  <option value="parent">Parents Only</option>
                  <option value="student">Students Only</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-secondary/40 pl-2">Announcement Content</label>
              <textarea 
                name="content" 
                required 
                rows={4}
                placeholder="Write your platform update here..."
                className="w-full p-4 rounded-2xl bg-slate-50 border border-secondary/10 focus:outline-none focus:border-primary font-medium leading-relaxed"
              ></textarea>
            </div>

            <div className="flex items-center gap-4 pl-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input name="is_pinned" type="checkbox" className="w-5 h-5 rounded-lg border-2 border-secondary/20 text-primary focus:ring-primary focus:ring-offset-0" />
                <span className="text-sm font-bold text-secondary group-hover:text-primary transition-colors">Pin to Dashboard Top</span>
              </label>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-4 bg-primary text-white font-black rounded-2xl hover:bg-primary-hover transition-all shadow-xl disabled:opacity-50"
              >
                {isSubmitting ? "Launching..." : "Broadcast to Platform"}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="space-y-6">
        <h2 className="text-xl font-black text-secondary flex items-center gap-3">
          <span className="h-6 w-1 bg-primary rounded-full"></span>
          Previous Broadcasts
        </h2>
        
        <div className="grid gap-6">
          {announcements.map((ann) => (
            <div key={ann.id} className={`bg-white rounded-[2rem] p-6 border transition-all ${ann.is_active ? 'border-secondary/5 shadow-md' : 'opacity-50 grayscale border-dashed border-secondary/20'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  {ann.is_pinned && <span className="text-lg">📌</span>}
                  <div>
                    <h3 className="text-lg font-black text-secondary">{ann.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                        ann.target_role === 'all' ? 'bg-slate-100 text-slate-500' :
                        ann.target_role === 'tutor' ? 'bg-primary/10 text-primary' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        Target: {ann.target_role}
                      </span>
                      <span className="text-[10px] text-secondary/30 font-bold">• {formatDistanceToNow(new Date(ann.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleAnnouncementActive(ann.id, ann.is_active)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      ann.is_active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {ann.is_active ? "Archive" : "Activate"}
                  </button>
                  <button 
                    onClick={() => { if(confirm("Permanently delete?")) deleteAnnouncement(ann.id) }}
                    className="p-2 text-secondary/20 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
              <p className="text-sm text-secondary/70 font-medium leading-relaxed whitespace-pre-wrap">{ann.content}</p>
            </div>
          ))}

          {announcements.length === 0 && (
            <div className="p-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-secondary/10 flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl opacity-20 shadow-sm text-secondary">🗞️</div>
              <p className="text-secondary/30 font-black uppercase tracking-widest text-sm">No announcements broadcasted yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
