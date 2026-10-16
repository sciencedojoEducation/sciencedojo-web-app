"use client";

import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from "react";
import { prepareWorkbookAudio, workbookPlaybackError } from "@/lib/workbook-audio-player";
import type { WorkbookTrack } from "@/lib/aspekte-workbook";

export type WorkbookAudioHandle = { toggle: (track: number) => void; pause: () => void };
const API = "/api/workbook/aspekte-neu-b2/assets/audio/";

/** One media element for exercise markers, the toolbar, and the complete library. */
const WorkbookAudio = forwardRef<WorkbookAudioHandle, {
  tracks: WorkbookTrack[]; initialTrack?: number; initialSeconds?: number;
  onState: (track: number, playing: boolean) => void;
  onPosition?: (track: number, seconds: number) => void;
}> (function WorkbookAudio({ tracks, onState, onPosition, initialTrack = 0, initialSeconds = 0 }, ref) {
  const audio = useRef<HTMLAudioElement>(null);
  const selected = useRef(0);
  const playGeneration = useRef(0);
  const [track, setTrack] = useState(0);
  const [speed, setSpeed] = useState("1");
  const [message, setMessage] = useState("Tap a numbered speaker beside an exercise to listen.");
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [duration, setDuration] = useState(0);

  const resumeAt = useRef(0);
  useEffect(() => {
    if (selected.current || !initialTrack || !audio.current) return;
    selected.current = initialTrack; setTrack(initialTrack); resumeAt.current = initialSeconds;
    setSeconds(initialSeconds);
    audio.current.src = `${API}${initialTrack}`; audio.current.load(); onState(initialTrack, false);
    // Initialize from the saved bookmark once, without starting playback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTrack, initialSeconds]);
  useEffect(() => {
    if (!loading) return;
    const timer = window.setTimeout(() => { setLoading(false); setFailed(true); setMessage("This recording is taking longer to start. Retry playback or open the audio directly."); }, 15000);
    return () => window.clearTimeout(timer);
  }, [loading, track]);
  function toggle(number: number, retry = false) {
    const player = audio.current;
    if (!player || !tracks.some(t => t.number === number && t.available)) return;
    setOpen(true);
    const requestGeneration = ++playGeneration.current;
    const selection = prepareWorkbookAudio(player, selected.current, number, `${API}${number}`, Number(speed), retry);
    if (selection.pause) { setPlaying(false); onState(number, false); return; }
    if (selection.reloaded) { resumeAt.current = selection.resumeAt || 0; setSeconds(resumeAt.current); setDuration(0); }
    selected.current = number; setTrack(number);
    setMessage(`Loading track ${number}…`); setLoading(true); setFailed(false);
    // Called in the tap handler so mobile browsers retain the user's playback gesture.
    void player.play().catch(error => { if (selected.current !== number || playGeneration.current !== requestGeneration) return; setPlaying(false); setLoading(false); setFailed(true); setMessage(workbookPlaybackError(error, player.error)); onState(number, false); });
  }
  useImperativeHandle(ref, () => ({ toggle, pause: () => audio.current?.pause() }));
  function seek(value: number) {
    if (!audio.current || !Number.isFinite(audio.current.duration)) return;
    resumeAt.current = 0;
    audio.current.currentTime = Math.max(0, Math.min(value, audio.current.duration));
    setSeconds(audio.current.currentTime);
    onPosition?.(selected.current, audio.current.currentTime);
  }
  function close() {
    ++playGeneration.current;
    audio.current?.pause(); setPlaying(false); setOpen(false);
    onState(selected.current, false);
  }
  const time = (value: number) => `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, "0")}`;

  return <section className="wb-shared-player" aria-label="Workbook audio player" hidden={!open}>
    <div className="wb-audio-heading"><strong>Track {track}</strong><button type="button" className="wb-button" onClick={close} aria-label="Close audio player and pause">Close</button></div>
    <div className="wb-button-row">
      <button type="button" className="wb-primary-button" onClick={() => toggle(track)} aria-label={`${playing ? "Pause" : "Play"} recording`}>{playing ? "Pause" : "Play"}</button>
      <button type="button" className="wb-button" aria-label="Rewind 10 seconds" disabled={!duration} onClick={() => seek(seconds - 10)}>−10 s</button>
      <button type="button" className="wb-button" disabled={!duration} onClick={() => { seek(0); if (audio.current?.paused) toggle(track); }}>Restart</button>
      <label>Speed <select aria-label="Playback speed" value={speed} onChange={event => { setSpeed(event.target.value); if (audio.current) audio.current.playbackRate = Number(event.target.value); }}>{["0.75", "0.9", "1", "1.1", "1.25"].map(s => <option key={s} value={s}>{s}×</option>)}</select></label>
    </div>
    <div className="wb-audio-timeline"><span>{time(seconds)}</span><input type="range" aria-label="Recording position" aria-valuetext={`${time(seconds)} of ${time(duration)}`} min="0" max={duration || 0} step="0.1" value={Math.min(seconds, duration)} disabled={!duration} onChange={event => seek(Number(event.target.value))} /><span>{time(duration)}</span></div>
    <audio ref={audio} hidden preload="none" aria-label={track ? `Workbook track ${track}` : "Workbook recording"}
      onLoadedMetadata={() => { if (audio.current) { setDuration(Number.isFinite(audio.current.duration) ? audio.current.duration : 0); if (resumeAt.current > 0) { audio.current.currentTime = Math.min(resumeAt.current, audio.current.duration || resumeAt.current); setSeconds(audio.current.currentTime); resumeAt.current = 0; } } }}
      onPlay={() => { setPlaying(true); onState(selected.current, true); }}
      onWaiting={() => setLoading(true)} onPlaying={() => { setPlaying(true); setLoading(false); setFailed(false); setMessage(`Playing track ${selected.current}`); onState(selected.current, true); }}
      onPause={() => { if (!audio.current?.paused) return; setPlaying(false); setLoading(false); if (!audio.current?.error) setMessage(selected.current ? `Paused · track ${selected.current}` : "Choose a numbered speaker to listen."); onState(selected.current, false); }} onEnded={() => { setPlaying(false); setMessage("Track finished. Tap Play to listen again."); onState(selected.current, false); }}
      onError={() => { setPlaying(false); setLoading(false); setFailed(true); setMessage(workbookPlaybackError(null, audio.current?.error)); onState(selected.current, false); }}
      onTimeUpdate={() => { if (audio.current) { setSeconds(audio.current.currentTime); onPosition?.(selected.current, audio.current.currentTime); } }} />
    <small role="status">{loading ? `Loading track ${track}…` : message}</small>
    {failed && track > 0 && <div className="wb-button-row"><button className="wb-button" onClick={() => toggle(track, true)}>Retry playback</button><a className="wb-button" href={`${API}${track}`} target="_blank" rel="noopener noreferrer">Open audio directly</a></div>}
  </section>;
});
export default WorkbookAudio;
