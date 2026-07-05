"use client";

import { Announcement } from "@/lib/announcement-queries";
import { PlatformAnnouncement } from "@/lib/platform-announcements";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

interface AnnouncementFeedProps {
  announcements: Announcement[];
  platformAnnouncements?: PlatformAnnouncement[];
}

export default function AnnouncementFeed({ announcements, platformAnnouncements = [] }: AnnouncementFeedProps) {
  const [dismissed, setDismissed] = useState<string[]>([]);

  const active = announcements.filter(a => !dismissed.includes(a.id));
  const platformActive = platformAnnouncements.filter(a => !dismissed.includes(a.id));

  if (active.length === 0 && platformActive.length === 0) return null;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black text-secondary flex items-center gap-3">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
          Dojo Updates 🏴📢
        </h2>
      </div>

      <div className="grid gap-4">
        {platformActive.map((ann) => (
          <div
            key={ann.id}
            className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-gradient-to-br from-white to-blue-50/60 p-6 shadow-md shadow-primary/5"
          >
            <div className="pr-12">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{ann.category.replace(/_/g, " ")}</span>
                <span className="text-[10px] font-bold tracking-tight text-secondary/30">• {formatDistanceToNow(new Date(ann.starts_at), { addSuffix: true })}</span>
              </div>
              <h3 className="mb-2 text-lg font-black tracking-tight text-secondary">
                {ann.title}
              </h3>
              <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-secondary/70">
                {ann.message}
              </p>
              {ann.cta_label && ann.cta_url && (
                <a href={ann.cta_url} className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-xs font-black uppercase tracking-widest text-white">
                  {ann.cta_label}
                </a>
              )}
            </div>
            <button
              onClick={() => setDismissed([...dismissed, ann.id])}
              className="absolute right-6 top-6 rounded-full p-2 text-secondary/20 transition-all hover:bg-secondary/5 hover:text-secondary"
              aria-label={`Dismiss ${ann.title}`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l18 18" /></svg>
            </button>
          </div>
        ))}
        {active.map((ann) => (
          <div 
            key={ann.id} 
            className={`relative overflow-hidden p-6 rounded-[2rem] border transition-all ${
              ann.is_pinned 
                ? "bg-gradient-to-br from-indigo-50 to-white border-primary/20 shadow-xl shadow-primary/5" 
                : "bg-white border-secondary/5 shadow-md"
            }`}
          >
            {/* Background Decorative Element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[4rem] -z-10 group-hover:scale-110 transition-transform"></div>

            <div className="pr-12">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Official Announcement</span>
                <span className="text-[10px] text-secondary/30 font-bold tracking-tight">• {formatDistanceToNow(new Date(ann.created_at), { addSuffix: true })}</span>
              </div>
              
              <h3 className="text-lg font-black text-secondary mb-2 tracking-tight group-hover:text-primary transition-colors">
                {ann.title}
              </h3>
              
              <p className="text-sm text-secondary/70 font-medium leading-relaxed whitespace-pre-wrap">
                {ann.content}
              </p>
            </div>

            <button 
              onClick={() => setDismissed([...dismissed, ann.id])}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-secondary/5 text-secondary/20 hover:text-secondary transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l18 18" /></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
