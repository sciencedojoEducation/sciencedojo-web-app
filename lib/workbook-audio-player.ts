/** Media preparation shared by the book's one player and exercised without a browser. */
type WorkbookAudioPort = Pick<HTMLAudioElement, "paused" | "currentTime" | "error" | "src" | "pause" | "load" | "playbackRate">;
export function prepareWorkbookAudio(player: WorkbookAudioPort, currentTrack: number, nextTrack: number, url: string, speed: number) {
  if (currentTrack === nextTrack && !player.paused && !player.error) { player.pause(); return { pause: true, reloaded: false }; }
  if (currentTrack !== nextTrack || player.error) {
    const resumeAt = currentTrack === nextTrack && Number.isFinite(player.currentTime) ? player.currentTime : 0;
    player.pause(); player.src = url; player.load(); player.playbackRate = speed;
    return { pause: false, reloaded: true, resumeAt };
  }
  player.playbackRate = speed;
  return { pause: false, reloaded: false };
}
