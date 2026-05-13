"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Pause, Play, Volume2 } from "lucide-react";

type FocusTrack = {
  label: string;
  file: string;
};

type FocusPreset = {
  id: string;
  label: string;
  description: string;
  folder: string;
  tracks: FocusTrack[];
};

type FocusSoundtrackProps = {
  isFullscreen?: boolean;
};

const focusSoundtrackPresets: FocusPreset[] = [
  {
    id: "deep-focus",
    label: "Deep Focus",
    description: "Minimal atmosphere for sustained concentration.",
    folder: "deep-focus",
    tracks: [
      { label: "Glassnote Drift", file: "Glassnote Drift.mp3" },
      { label: "Quiet Graphite Room", file: "Quiet Graphite Room.mp3" },
    ],
  },
  {
    id: "calm-revision",
    label: "Calm Revision",
    description: "Soft evening study tone for steady review.",
    folder: "calm-revision",
    tracks: [
      { label: "Midnight Revision Room", file: "Midnight Revision Room.mp3" },
      { label: "Midnight Revision Room II", file: "Midnight Revision Room (1).mp3" },
    ],
  },
  {
    id: "reading-atmosphere",
    label: "Reading Atmosphere",
    description: "Quiet background texture for reading and notes.",
    folder: "reading-atmosphere",
    tracks: [
      { label: "Velvet Margin", file: "Velvet Margin.mp3" },
      { label: "Velvet Margin II", file: "Velvet Margin (1).mp3" },
    ],
  },
  {
    id: "exam-calm",
    label: "Exam Calm",
    description: "Settled sound for calm timed preparation.",
    folder: "exam-calm",
    tracks: [
      { label: "Quiet Exam Room", file: "Quiet Exam Room.mp3" },
      { label: "Quiet Exam Room II", file: "Quiet Exam Room (1).mp3" },
    ],
  },
  {
    id: "immersive-focus",
    label: "Immersive Focus",
    description: "Natural ambience for a focused study atmosphere.",
    folder: "immersive-focus",
    tracks: [
      { label: "Rain Under Cedar", file: "Rain Under Cedar.mp3" },
      { label: "Rain Under Cedar II", file: "Rain Under Cedar (1).mp3" },
    ],
  },
  {
    id: "digital-study-zone",
    label: "Digital Study Zone",
    description: "Gentle digital tone for structured screen study.",
    folder: "digital-study-zone",
    tracks: [
      { label: "Pixel Classroom", file: "Pixel Classroom.mp3" },
      { label: "Pixel Classroom II", file: "Pixel Classroom (1).mp3" },
    ],
  },
  {
    id: "creative-flow",
    label: "Creative Flow",
    description: "Warm rhythm for lighter study and problem solving.",
    folder: "creative-flow",
    tracks: [
      { label: "Bossa Study Terrace", file: "Bossa Study Terrace.mp3" },
      { label: "Bossa Study Terrace II", file: "Bossa Study Terrace (1).mp3" },
    ],
  },
  {
    id: "reflection-space",
    label: "Reflection Space",
    description: "Soft study-room atmosphere for review and planning.",
    folder: "reflection-space",
    tracks: [
      { label: "Velvet Study Room", file: "Velvet Study Room.mp3" },
      { label: "Velvet Study Room II", file: "Velvet Study Room (1).mp3" },
    ],
  },
];

function getAudioSrc(preset: FocusPreset, track: FocusTrack) {
  return `/audio/focus/${preset.folder}/${encodeURIComponent(track.file)}`;
}

export default function FocusSoundtrack({ isFullscreen = false }: FocusSoundtrackProps) {
  const [selectedPresetId, setSelectedPresetId] = useState(focusSoundtrackPresets[0]?.id || "");
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [volume, setVolume] = useState(35);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const shouldResumeAfterTrackChangeRef = useRef(false);

  const selectedPreset = useMemo(
    () => focusSoundtrackPresets.find((preset) => preset.id === selectedPresetId) || focusSoundtrackPresets[0],
    [selectedPresetId],
  );

  const selectedTrack = selectedPreset?.tracks[selectedTrackIndex] || selectedPreset?.tracks[0];
  const audioSrc = selectedPreset && selectedTrack ? getAudioSrc(selectedPreset, selectedTrack) : "";

  const syncAudioState = () => {
    const audio = audioRef.current;
    setIsPlaying(!!audio && !audio.paused && !audio.ended);
  };

  useEffect(() => {
    return () => {
      if (!audioRef.current) return;
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    };
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.load();
    setError(null);

    if (!shouldResumeAfterTrackChangeRef.current) {
      syncAudioState();
      return;
    }

    shouldResumeAfterTrackChangeRef.current = false;
    audioRef.current.play()
      .then(syncAudioState)
      .catch(() => {
        syncAudioState();
        setError("Soundtrack could not start. Please try again.");
      });
  }, [audioSrc]);

  useEffect(() => {
    syncAudioState();
  }, [isFullscreen]);

  const toggleSoundtrack = () => {
    const audio = audioRef.current;
    if (!audio) return;

    setError(null);

    if (!audio.paused && !audio.ended) {
      audio.pause();
      syncAudioState();
      return;
    }

    audio.play()
      .then(syncAudioState)
      .catch(() => {
        syncAudioState();
        setError("Soundtrack could not start. Please try again.");
      });
  };

  const selectPreset = (preset: FocusPreset) => {
    const audio = audioRef.current;
    shouldResumeAfterTrackChangeRef.current = !!audio && !audio.paused && !audio.ended;
    setSelectedPresetId(preset.id);
    setSelectedTrackIndex(0);
    setError(null);
  };

  const selectTrack = (trackIndex: number) => {
    const audio = audioRef.current;
    shouldResumeAfterTrackChangeRef.current = !!audio && !audio.paused && !audio.ended;
    setSelectedTrackIndex(trackIndex);
    setError(null);
  };

  const playNextTrack = () => {
    if (!selectedPreset) return;
    shouldResumeAfterTrackChangeRef.current = true;
    syncAudioState();
    setSelectedTrackIndex((currentIndex) => (currentIndex + 1) % selectedPreset.tracks.length);
  };

  if (!selectedPreset || !selectedTrack) return null;

  const soundtrackStateLabel = isPlaying ? "Focus soundtrack playing." : "Focus soundtrack off.";
  const disclosureLabel = isExpanded ? "Close focus soundtrack controls." : "Open focus soundtrack controls.";

  return (
    <section className={isFullscreen ? "mt-5 flex justify-center" : "mt-5 flex w-full max-w-xl flex-col items-center text-white md:mt-7"}>
      <audio
        ref={audioRef}
        preload="none"
        src={audioSrc}
        onEnded={playNextTrack}
        onPause={syncAudioState}
        onPlay={syncAudioState}
        onPlaying={syncAudioState}
        onLoadedData={syncAudioState}
      />

      {isFullscreen ? (
        <span
          role="status"
          aria-label={soundtrackStateLabel}
          style={isPlaying ? { animation: "focus-soundtrack-breathe 4s ease-in-out infinite" } : undefined}
          className={`block h-3 w-3 rounded-full transition-all ${
            isPlaying
              ? "bg-cyan-100 shadow-[0_0_18px_rgba(165,243,252,0.45)]"
              : "border border-white/35 bg-transparent"
          }`}
        />
      ) : (
        <>
          <button
            type="button"
            onClick={() => setIsExpanded((current) => !current)}
            aria-expanded={isExpanded}
            aria-label={`${disclosureLabel} ${soundtrackStateLabel}`}
            className="group flex min-h-11 min-w-11 flex-col items-center justify-center gap-1 rounded-full text-white/50 transition-all hover:text-white/75 focus:outline-none focus:ring-2 focus:ring-cyan-100/30"
          >
            <span
              aria-hidden="true"
              style={isPlaying ? { animation: "focus-soundtrack-breathe 4s ease-in-out infinite" } : undefined}
              className={`block h-3 w-3 rounded-full transition-all ${
                isPlaying
                  ? "bg-cyan-100 shadow-[0_0_18px_rgba(165,243,252,0.45)]"
                  : "border border-white/35 bg-transparent group-hover:border-white/55"
              }`}
            />
            {isExpanded ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
          </button>

          {isExpanded && (
            <div className="mt-3 w-full rounded-[1.35rem] border border-white/10 bg-black/18 p-3 shadow-lg shadow-black/10 backdrop-blur-md md:rounded-[1.75rem] md:p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Study environment</p>
                  <p className="mt-1 text-sm font-black tracking-tight text-white">{selectedPreset.label}</p>
                  <p className="text-xs font-medium leading-relaxed text-white/50">{selectedTrack.label}</p>
                </div>

                <button
                  type="button"
                  onClick={toggleSoundtrack}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-navy shadow-sm transition-all hover:bg-cyan-50 active:scale-95"
                >
                  {isPlaying ? <Pause size={16} className="fill-current" /> : <Play size={16} className="fill-current" />}
                  {isPlaying ? "Pause" : "Play"}
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {focusSoundtrackPresets.map((preset) => {
                  const isSelected = preset.id === selectedPreset.id;

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => selectPreset(preset)}
                      className={`rounded-full border px-3 py-1.5 text-[11px] font-black transition-all ${
                        isSelected
                          ? "border-white/25 bg-white/[0.16] text-white"
                          : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-medium leading-relaxed text-white/50">{selectedPreset.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {selectedPreset.tracks.map((track, index) => (
                      <button
                        key={track.file}
                        type="button"
                        onClick={() => selectTrack(index)}
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-black transition-all ${
                          index === selectedTrackIndex
                            ? "border-white/25 bg-white/[0.14] text-white"
                            : "border-white/10 bg-black/10 text-white/45 hover:bg-white/10 hover:text-white/75"
                        }`}
                      >
                        Track {index === 0 ? "I" : "II"}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex min-w-0 items-center gap-2 text-white/50 md:w-40" aria-label="Soundtrack volume">
                  <Volume2 size={15} className="shrink-0" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(event) => setVolume(Number(event.target.value))}
                    className="h-1 w-full accent-white"
                  />
                </label>
              </div>

              {error && <p className="mt-2 text-xs font-bold text-rose-100/80">{error}</p>}
            </div>
          )}
        </>
      )}

      <style jsx global>{`
        @keyframes focus-soundtrack-breathe {
          0%,
          100% {
            opacity: 0.78;
            transform: scale(0.94);
          }
          50% {
            opacity: 1;
            transform: scale(1.12);
          }
        }
      `}</style>
    </section>
  );
}
