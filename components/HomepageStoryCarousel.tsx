"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { Testimonial } from "@/components/Testimonials";

function subscribeToReducedMotion(listener: () => void) {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  preference.addEventListener("change", listener);
  return () => preference.removeEventListener("change", listener);
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function HomepageStoryCarousel({ stories }: { stories: Testimonial[] }) {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [interacting, setInteracting] = useState(false);
  const reducedMotion = useSyncExternalStore(subscribeToReducedMotion, getReducedMotion, () => false);

  useEffect(() => {
    if (!playing || interacting || reducedMotion || stories.length < 2) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % stories.length), 8000);
    return () => window.clearInterval(timer);
  }, [interacting, playing, reducedMotion, stories.length]);

  function showStory(direction: -1 | 1) {
    setPlaying(false);
    setActive((current) => (current + direction + stories.length) % stories.length);
  }

  if (stories.length === 0) return null;

  return (
    <div
      className="flex min-w-0 flex-col overflow-hidden rounded-3xl border border-secondary/10 bg-white shadow-sm"
      role="region"
      aria-roledescription="carousel"
      aria-label="Student stories"
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false);
      }}
    >
      <div className="flex flex-1 transition-transform duration-700 ease-in-out motion-reduce:transition-none" style={{ transform: `translateX(-${active * 100}%)` }} aria-live={playing && !reducedMotion ? "off" : "polite"}>
        {stories.map((story, index) => (
          <article key={`${story.firstName}-${index}`} className="flex min-w-full flex-col p-6 lg:p-8" aria-hidden={index !== active}>
            <p className="text-sm font-bold text-primary">{story.context}</p>
            <blockquote className="my-auto py-5 text-xl font-bold leading-8 text-secondary">“{story.quote}”</blockquote>
            <p className="mt-5 text-sm font-semibold text-secondary/70">{story.firstName} · {story.type === "student" ? "Student" : "Parent"}</p>
          </article>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-secondary/10 px-5 py-3">
        <p className="text-xs font-semibold text-secondary/60">{active + 1} of {stories.length} · Individual outcomes vary</p>
        <div className="flex items-center gap-1">
          {!reducedMotion && stories.length > 1 && (
            <button type="button" onClick={() => setPlaying((current) => !current)} className="inline-flex h-10 w-10 items-center justify-center rounded-full text-secondary hover:bg-secondary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" aria-label={playing ? "Pause story animation" : "Play story animation"}>
              {playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
            </button>
          )}
          <button type="button" onClick={() => showStory(-1)} disabled={stories.length < 2} className="inline-flex h-10 w-10 items-center justify-center rounded-full text-secondary hover:bg-secondary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-40" aria-label="Previous student story"><ChevronLeft className="h-5 w-5" aria-hidden="true" /></button>
          <button type="button" onClick={() => showStory(1)} disabled={stories.length < 2} className="inline-flex h-10 w-10 items-center justify-center rounded-full text-secondary hover:bg-secondary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-40" aria-label="Next student story"><ChevronRight className="h-5 w-5" aria-hidden="true" /></button>
        </div>
      </div>
    </div>
  );
}
