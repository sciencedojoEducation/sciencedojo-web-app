"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { RotateCcw, ExternalLink, Play } from "lucide-react";

const StreamPlayer = dynamic(() => import("react-player"), { ssr: false });

export default function AcademyVideoPlayer({ embedUrl, sourceUrl, title, german, startSeconds = 0, endSeconds, clickToLoad = false }: {
  embedUrl?: string; sourceUrl: string; title: string; german: boolean; startSeconds?: number; endSeconds?: number; clickToLoad?: boolean;
}) {
  const [replay, setReplay] = useState(0);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(!clickToLoad);
  const youtube = embedUrl?.startsWith('https://www.youtube.com/embed/');
  const player = useRef<HTMLVideoElement>(null);
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!clickToLoad || !loaded) return;
    const topic = container.current?.closest('.academy-topic-content');
    if (!topic) return;
    const observer = new MutationObserver(() => { if (topic.hasAttribute('hidden')) setLoaded(false); });
    observer.observe(topic, { attributes: true, attributeFilter: ['hidden'] });
    return () => observer.disconnect();
  }, [clickToLoad, loaded]);
  return (
    <div ref={container} className="space-y-3">
      {!loaded ? <div className="flex min-h-48 flex-col items-center justify-center gap-4 rounded-2xl border border-[#B8CADA] bg-white p-6 text-center">
        <p className="font-bold">{title}</p>
        <button type="button" data-academy-action="primary" onClick={() => setLoaded(true)} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[var(--academy-accent)] px-6 py-3 font-bold text-white">
          <Play size={18} aria-hidden="true" />Play · Video laden · වීඩියෝව විවෘත කරන්න
        </button>
        <p className="text-sm">{youtube ? 'Loads YouTube after you press Play. · Play එබූ පසුව YouTube විවෘත වේ.' : 'The player loads after you press Play.'}</p>
      </div> : embedUrl ? <iframe key={replay} src={embedUrl} title={title} onError={() => setFailed(true)}
        className="aspect-video w-full border-0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> :
        <StreamPlayer key={replay} ref={player} src={sourceUrl} controls playsInline preload="metadata" aria-label={title}
          width="100%" height="auto" style={{ aspectRatio: "16 / 9" }}
          onLoadedMetadata={() => { if (player.current) player.current.currentTime = startSeconds; }}
          onTimeUpdate={() => { if (player.current && endSeconds !== undefined && player.current.currentTime >= endSeconds) player.current.pause(); }}
          onError={() => setFailed(true)} />}
      {failed ? <p role="alert" className="text-sm text-amber-900">{german ? "Das Video konnte nicht geladen werden. Öffnen Sie das Originalvideo über den Link unten." : "Video could not load. Open the original video using the link below."}</p> : null}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        {loaded && clickToLoad ? <button type="button" onClick={() => { setLoaded(false); setFailed(false); }} className="min-h-11 rounded-lg border border-[#DEDFE1] px-4 font-bold">Hide video · Video schließen</button> : null}
        {loaded ? <button type="button" onClick={() => { setFailed(false); setReplay((value) => value + 1); }}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#DEDFE1] px-4 font-bold">
          <RotateCcw size={16} /> {german ? "Szene neu laden" : "Reset scene"}
        </button> : null}
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 underline">
          <ExternalLink size={16} /> {youtube ? 'Open on YouTube · Auf YouTube öffnen' : german ? "Originalvideo öffnen" : "Open original video"}
        </a>
      </div>
    </div>
  );
}
