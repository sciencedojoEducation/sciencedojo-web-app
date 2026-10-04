"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { RotateCcw, ExternalLink } from "lucide-react";

const StreamPlayer = dynamic(() => import("react-player"), { ssr: false });

export default function AcademyVideoPlayer({ embedUrl, sourceUrl, title, german, startSeconds = 0, endSeconds }: {
  embedUrl?: string; sourceUrl: string; title: string; german: boolean; startSeconds?: number; endSeconds?: number;
}) {
  const [replay, setReplay] = useState(0);
  const [failed, setFailed] = useState(false);
  const player = useRef<HTMLVideoElement>(null);
  return (
    <div className="space-y-3">
      {embedUrl ? <iframe key={replay} src={embedUrl} title={title}
        className="aspect-video w-full border-0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> :
        <StreamPlayer key={replay} ref={player} src={sourceUrl} controls playsInline preload="metadata" aria-label={title}
          width="100%" height="auto" style={{ aspectRatio: "16 / 9" }}
          onLoadedMetadata={() => { if (player.current) player.current.currentTime = startSeconds; }}
          onTimeUpdate={() => { if (player.current && endSeconds !== undefined && player.current.currentTime >= endSeconds) player.current.pause(); }}
          onError={() => setFailed(true)} />}
      {failed ? <p role="alert" className="text-sm text-amber-900">{german ? "Das Video konnte nicht geladen werden. Öffnen Sie die offizielle DW-Lektion unter Ressourcen." : "Video could not load. Open the official DW lesson under resources."}</p> : null}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <button type="button" onClick={() => { setFailed(false); setReplay((value) => value + 1); }}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#DEDFE1] px-4 font-bold">
          <RotateCcw size={16} /> {german ? "Szene neu laden" : "Reset scene"}
        </button>
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 underline">
          <ExternalLink size={16} /> {german ? "Originalvideo öffnen" : "Open original video"}
        </a>
      </div>
    </div>
  );
}
