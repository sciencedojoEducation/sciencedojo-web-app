import { germanA1PronunciationManifest } from "./german-a1-pronunciation.ts";
import { germanA1FullMockAudioManifest } from "./german-a1-full-mock.ts";

export const germanA1ListeningUpgradeManifest = [
  ...germanA1PronunciationManifest, ...germanA1FullMockAudioManifest,
];

/** Dependency injection keeps missing/invalid-file gates testable without touching storage. */
export function checkA1ListeningReadiness(read: (url: string) => Uint8Array | null) {
  const missing: string[] = [];
  const invalid: string[] = [];
  const decoder = new TextDecoder();
  for (const track of germanA1ListeningUpgradeManifest) {
    const bytes = read(track.outputPath);
    if (!bytes) { missing.push(track.outputPath); continue; }
    // M4A is an ISO base-media container with an ftyp box near the beginning.
    if (bytes.length < 1024 || bytes.length > 10 * 1024 * 1024 ||
        !decoder.decode(bytes.slice(0, 64)).includes("ftyp")) invalid.push(track.outputPath);
  }
  return { ready: !missing.length && !invalid.length, total: germanA1ListeningUpgradeManifest.length,
    available: germanA1ListeningUpgradeManifest.length - missing.length - invalid.length, missing, invalid };
}
