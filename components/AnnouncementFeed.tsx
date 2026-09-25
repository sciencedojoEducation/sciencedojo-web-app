"use client";

import { Announcement } from "@/lib/announcement-queries";
import { PlatformAnnouncement } from "@/lib/platform-announcements";
import { useState } from "react";

const announcementDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function formatAnnouncementDate(value: string): string {
  return announcementDateFormatter.format(new Date(value));
}

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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-secondary">
          Dojo updates
        </h2>
      </div>

      <div className="grid gap-3">
        {platformActive.map((ann) => (
          <div
            key={ann.id}
            className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 sm:p-5"
          >
            <div className="pr-12">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold capitalize text-primary">{ann.category.replace(/_/g, " ")}</span>
                <span className="text-xs text-slate-500">• {formatAnnouncementDate(ann.starts_at)}</span>
              </div>
              <h3 className="mb-2 text-base font-semibold text-secondary">
                {ann.title}
              </h3>
              <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-secondary/70">
                {ann.message}
              </p>
              {ann.cta_label && ann.cta_url && (
                <a href={ann.cta_url} className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                  {ann.cta_label}
                </a>
              )}
            </div>
            <button
              onClick={() => setDismissed([...dismissed, ann.id])}
              className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:right-4 sm:top-4"
              aria-label={`Dismiss ${ann.title}`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l18 18" /></svg>
            </button>
          </div>
        ))}
        {active.map((ann) => (
          <div 
            key={ann.id} 
            className={`relative overflow-hidden rounded-xl border p-4 sm:p-5 ${
              ann.is_pinned 
                ? "border-primary/30 bg-blue-50/60"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="pr-12">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-primary">Official announcement</span>
                <span className="text-xs text-slate-500">• {formatAnnouncementDate(ann.created_at)}</span>
              </div>
              
              <h3 className="mb-2 text-base font-semibold text-secondary">
                {ann.title}
              </h3>
              
              <p className="text-sm text-secondary/70 font-medium leading-relaxed whitespace-pre-wrap">
                {ann.content}
              </p>
            </div>

            <button 
              onClick={() => setDismissed([...dismissed, ann.id])}
              className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:right-4 sm:top-4"
              aria-label={`Dismiss ${ann.title}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l18 18" /></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
