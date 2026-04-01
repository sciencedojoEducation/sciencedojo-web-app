import React from "react";
import YouTubeLite from "./YouTubeLite";

interface LinkPreviewProps {
  url: string;
}

export default function LinkPreview({ url }: LinkPreviewProps) {
  // Simple check for YouTube
  const isYouTube = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/.test(url);

  if (isYouTube) {
    return (
      <div className="mt-4">
        <YouTubeLite url={url} />
      </div>
    );
  }

  // Fallback generic link card
  try {
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname.replace("www.", "");
    
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex flex-col sm:flex-row border border-secondary/10 rounded-2xl overflow-hidden hover:bg-slate-50 transition-colors group"
      >
        <div className="w-full sm:w-48 h-32 bg-secondary/5 flex items-center justify-center border-r border-secondary/10 group-hover:bg-secondary/10 transition-colors shrink-0">
          <svg className="w-10 h-10 text-secondary/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <div className="p-4 flex flex-col justify-center flex-1 min-w-0">
          <p className="font-bold text-secondary text-base truncate">{domain}</p>
          <p className="text-secondary/60 text-xs mt-1 line-clamp-2 break-all">{url}</p>
          <div className="mt-auto pt-2 flex items-center gap-1.5 font-black text-[10px] uppercase tracking-widest text-primary group-hover:underline">
            Visit Link
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
        </div>
      </a>
    );
  } catch (e) {
    // Basic fallback if URL is invalid string format
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-primary hover:underline text-sm font-bold">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        {url}
      </a>
    );
  }
}
