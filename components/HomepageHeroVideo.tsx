"use client";

import { Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

export default function HomepageHeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const subscribeToPlayback = useCallback((listener: () => void) => {
    const video = videoRef.current;
    video?.addEventListener("play", listener);
    video?.addEventListener("pause", listener);
    return () => {
      video?.removeEventListener("play", listener);
      video?.removeEventListener("pause", listener);
    };
  }, []);
  const getPlayback = useCallback(() => Boolean(videoRef.current && !videoRef.current.paused), []);
  const playing = useSyncExternalStore(subscribeToPlayback, getPlayback, () => false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const video = videoRef.current;
    if (video && !preference.matches) void video.play().catch(() => video.pause());

    const pauseForReducedMotion = () => {
      if (preference.matches) videoRef.current?.pause();
    };

    pauseForReducedMotion();
    preference.addEventListener("change", pauseForReducedMotion);
    return () => preference.removeEventListener("change", pauseForReducedMotion);
  }, []);

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play().catch(() => video.pause());
    } else {
      video.pause();
    }
  }

  return (
    <>
      <video
        ref={videoRef}
        aria-hidden="true"
        loop
        muted
        playsInline
        preload="metadata"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
      >
        <source src="/videos/home-hero-airplane-mobile.mp4" type="video/mp4" media="(max-width: 640px) and (prefers-reduced-motion: no-preference)" />
        <source src="/videos/home-hero-airplane.mp4" type="video/mp4" media="(prefers-reduced-motion: no-preference)" />
      </video>
      <button
        type="button"
        onClick={togglePlayback}
        aria-label={playing ? "Pause background animation" : "Play background animation"}
        className="absolute bottom-4 right-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-[#071a35]/60 text-white shadow-md backdrop-blur-sm transition hover:bg-[#071a35]/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:hidden"
      >
        {playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
      </button>
    </>
  );
}
