"use client";

import { useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { answerSoundsMuted, setAnswerSoundsMuted, subscribeAnswerSounds } from "@/lib/academy-answer-sounds";

export default function AcademyAnswerSoundToggle({ german = true }: { german?: boolean }) {
  const muted = useSyncExternalStore(subscribeAnswerSounds, answerSoundsMuted, () => false);
  const label = german
    ? `Ton ${muted ? "einschalten" : "ausschalten"} · ${muted ? "Unmute" : "Mute"} answer sounds`
    : `${muted ? "Unmute" : "Mute"} answer sounds`;
  return <button type="button" aria-pressed={!muted} aria-label={label} title={label}
    onClick={() => setAnswerSoundsMuted(!muted)}
    className="fixed top-1/2 z-40 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-[#B8CADA] bg-white text-[#344B60] shadow-lg transition-colors hover:bg-[#EAF3FB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 motion-reduce:transition-none"
    style={{ right: "max(0.75rem, env(safe-area-inset-right))" }}>
    {muted ? <VolumeX size={22} aria-hidden="true"/> : <Volume2 size={22} aria-hidden="true"/>}
  </button>;
}
