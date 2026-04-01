"use client";

import { useMemo } from "react";

export default function YoutubePreview({ url }: { url: string }) {
  // Extract video ID from URL
  const videoId = useMemo(() => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }, [url]);

  if (!url) {
    return (
      <div className="w-full aspect-video bg-slate-100 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-slate-300 text-slate-400">
        <svg className="w-12 h-12 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <span className="text-sm font-bold tracking-tight">Paste a URL above to preview your intro video.</span>
      </div>
    );
  }

  if (!videoId) {
    return (
      <div className="w-full aspect-video bg-red-50 rounded-2xl flex flex-col items-center justify-center border-2 border-red-200 text-red-500">
        <span className="text-sm font-bold tracking-tight">Invalid YouTube URL. Please check the link.</span>
      </div>
    );
  }

  return (
    <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-black">
      <iframe
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
}
