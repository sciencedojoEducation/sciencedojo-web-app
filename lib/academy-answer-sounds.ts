/** Original, quiet practice tones synthesized locally; no audio downloads or requests. */
export type AnswerSound = "correct" | "retry" | "select" | "complete";
const preferenceKey = "academy-answer-sounds-muted";
const preferenceEvent = "academy-answer-sounds-preference";
let context: AudioContext | undefined;
let active: { gain: GainNode; endsAt: number } | undefined;
let muted: boolean | undefined;
let playbackRequest = 0;

export function answerSoundsMuted(): boolean {
  if (typeof window === "undefined") return false;
  if (muted !== undefined) return muted;
  try { return window.localStorage.getItem(preferenceKey) === "true"; }
  catch { return false; }
}
export function setAnswerSoundsMuted(value: boolean) {
  muted = value;
  if (value) playbackRequest++;
  try { window.localStorage.setItem(preferenceKey, String(value)); } catch { /* In-memory preference works when storage is unavailable. */ }
  if (value && context && active) {
    active.gain.gain.cancelScheduledValues(context.currentTime);
    active.gain.gain.setTargetAtTime(0, context.currentTime, 0.01);
  }
  window.dispatchEvent(new Event(preferenceEvent));
}
export function subscribeAnswerSounds(listener: () => void) {
  window.addEventListener(preferenceEvent, listener);
  const onStorage = () => { muted = undefined; listener(); };
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(preferenceEvent, listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Call directly from a learner gesture, never from mount/save effects. */
export async function playAnswerSound(outcome: AnswerSound): Promise<void> {
  if (typeof window === "undefined" || answerSoundsMuted()) return;
  try {
    if (!context || context.state === "closed") context = new AudioContext();
    const audio = context;
    const request = ++playbackRequest;
    // Resume inside the click gesture, but schedule only once the browser is ready.
    // This also handles browsers that interrupt an audio context after tab switching.
    if (audio.state !== "running") await audio.resume();
    if (audio.state !== "running" || request !== playbackRequest || answerSoundsMuted()) return;
    const now = audio.currentTime;
    if (active && active.endsAt > now) {
      active.gain.gain.cancelScheduledValues(now);
      active.gain.gain.setTargetAtTime(0, now, 0.01);
    }
    const master = audio.createGain();
    master.gain.setValueAtTime(outcome === "select" ? 0.045 : 0.11, now);
    master.connect(audio.destination);
    // An ascending major chime celebrates success; two soft lower notes invite a retry.
    const notes = outcome === "select" ? [523.25]
      : outcome === "complete" ? [523.25, 659.25, 783.99, 1046.5]
      : outcome === "correct" ? [659.25, 830.61, 987.77] : [349.23, 311.13];
    const step = outcome === "retry" ? 0.14 : 0.09;
    const duration = outcome === "select" ? 0.06 : outcome === "complete" ? 0.3 : outcome === "correct" ? 0.24 : 0.2;
    active = { gain: master, endsAt: now + step * (notes.length - 1) + duration };
    notes.forEach((frequency, index) => {
      const start = now + index * step;
      const oscillator = audio.createOscillator();
      const envelope = audio.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      envelope.gain.setValueAtTime(0, start);
      envelope.gain.linearRampToValueAtTime(0.65, start + 0.012);
      envelope.gain.exponentialRampToValueAtTime(0.001, start + duration);
      oscillator.connect(envelope);
      envelope.connect(master);
      oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); if (index === notes.length - 1) master.disconnect(); };
      oscillator.start(start);
      oscillator.stop(start + duration + 0.01);
    });
  } catch { /* Visual feedback remains available when audio is unsupported or blocked. */ }
}
