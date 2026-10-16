/** Media preparation shared by the book's one player and exercised without a browser. */
type WorkbookAudioPort = Pick<HTMLAudioElement, "paused" | "currentTime" | "error" | "src" | "pause" | "load" | "playbackRate">;
export function prepareWorkbookAudio(player: WorkbookAudioPort, currentTrack: number, nextTrack: number, url: string, speed: number, forceReload = false) {
  if (!forceReload && currentTrack === nextTrack && !player.paused && !player.error) { player.pause(); return { pause: true, reloaded: false }; }
  if (forceReload || currentTrack !== nextTrack || player.error) {
    const resumeAt = currentTrack === nextTrack && Number.isFinite(player.currentTime) ? player.currentTime : 0;
    player.pause(); player.src = url; player.load(); player.playbackRate = speed;
    return { pause: false, reloaded: true, resumeAt };
  }
  player.playbackRate = speed;
  return { pause: false, reloaded: false };
}

export function workbookPlaybackError(error?: { name?: string } | null, mediaError?: { code: number } | null) {
  if (error?.name === "NotAllowedError") return "Your browser needs a playback tap. Tap Retry playback below.";
  if (mediaError?.code === 2) return "The recording could not load over this connection. Retry playback or open the audio directly.";
  if (mediaError?.code === 3) return "This browser could not decode the recording. Try opening the audio directly.";
  if (mediaError?.code === 4) return "The recording is unavailable or unsupported in this player. Retry or open the audio directly.";
  return "Playback could not start. Retry playback or open the audio directly.";
}
