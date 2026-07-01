"use client";

import { useEffect, useRef, useState } from "react";
import { focusEnvironments } from "@/lib/focusEnvironments";
import FocusStatusDot from "./FocusStatusDot";
import FocusEnvironmentSelector from "./FocusEnvironmentSelector";

type FocusSoundtrackProps = {
  /** When true, only the tiny status dot is shown — pure focus. */
  fullscreen: boolean;
};

/** The local audio system + minimal soundtrack UI.
 *
 *  Rules enforced here:
 *  - native HTML audio, one track at a time, looping, no visible controls
 *  - no autoplay; playback only starts on an explicit tap
 *  - changing environment or track stops audio and reloads the source
 *  - the breathing dot is driven by the real <audio> element state
 *
 *  This component is only ever mounted in Focus Mode. Switching to Exam
 *  Mode unmounts it, which inherently stops any playing atmosphere. */
export default function FocusSoundtrack({ fullscreen }: FocusSoundtrackProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [environmentId, setEnvironmentId] = useState(focusEnvironments[0].id);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showSelector, setShowSelector] = useState(false);

  const environment =
    focusEnvironments.find((e) => e.id === environmentId) ??
    focusEnvironments[0];
  const track = environment.tracks[trackIndex] ?? environment.tracks[0];

  // Changing environment or track always stops audio and reloads the source.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    audio.load();
    setIsPlaying(false);
  }, [track.src]);

  // Keep the breathing dot in sync with the *real* audio element state.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const sync = () => setIsPlaying(!audio.paused && !audio.ended);
    const onError = () => setIsPlaying(false);
    audio.addEventListener("play", sync);
    audio.addEventListener("playing", sync);
    audio.addEventListener("pause", sync);
    audio.addEventListener("ended", sync);
    audio.addEventListener("error", onError);
    return () => {
      audio.removeEventListener("play", sync);
      audio.removeEventListener("playing", sync);
      audio.removeEventListener("pause", sync);
      audio.removeEventListener("ended", sync);
      audio.removeEventListener("error", onError);
    };
  }, []);

  // Fullscreen is pure focus — collapse every audio panel.
  useEffect(() => {
    if (fullscreen) {
      setExpanded(false);
      setShowSelector(false);
    }
  }, [fullscreen]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        // Missing file or blocked playback — stay calm, stay silent.
        setIsPlaying(false);
      }
    } else {
      audio.pause();
    }
  };

  const changeEnvironment = (id: string) => {
    setEnvironmentId(id);
    setTrackIndex(0);
    setShowSelector(false);
  };

  return (
    <div className={fullscreen ? "" : "mt-7 flex flex-col items-center"}>
      {/* Native HTML audio — looping, no controls, nothing preloaded eagerly. */}
      <audio ref={audioRef} loop preload="metadata">
        <source src={track.src} type="audio/mpeg" />
      </audio>

      {fullscreen ? (
        <div className="flex justify-center">
          <FocusStatusDot isPlaying={isPlaying} variant="fullscreen" />
        </div>
      ) : (
        <>
          <FocusStatusDot
            isPlaying={isPlaying}
            variant="panel"
            expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
          />

          {expanded && (
            <div className="mt-3 w-full max-w-sm rounded-2xl bg-white/[0.05] p-4 ring-1 ring-white/10">
              {showSelector ? (
                <FocusEnvironmentSelector
                  environments={focusEnvironments}
                  selectedId={environmentId}
                  onSelect={changeEnvironment}
                  onClose={() => setShowSelector(false)}
                />
              ) : (
                <div className="relative z-10">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                    Study environment
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {environment.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-white/45">
                    {environment.mood}
                  </p>

                  <div className="mt-3 flex gap-2">
                    {environment.tracks.map((t, i) => {
                      const active = i === trackIndex;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTrackIndex(i)}
                          aria-pressed={active}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                            active
                              ? "bg-white text-navy"
                              : "bg-white/8 text-white/60 hover:text-white/90"
                          }`}
                        >
                          {t.title}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={togglePlay}
                      aria-label={
                        isPlaying
                          ? "Pause focus atmosphere"
                          : "Play focus atmosphere"
                      }
                      className="flex-1 rounded-full bg-blue px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
                    >
                      {isPlaying ? "Pause" : "Play"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSelector(true)}
                      className="rounded-full bg-white/8 px-4 py-2 text-sm font-medium text-white/70 ring-1 ring-white/10 transition hover:text-white"
                    >
                      Change environment
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
