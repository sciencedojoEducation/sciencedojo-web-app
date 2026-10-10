import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { germanB2StoryEpisodes } from "../lib/german-b2-story.ts";

const root = resolve(import.meta.dirname, "..");
const directory = join(root, "docs/german-b2-story-audio-verification");
const ffmpeg = process.env.B2_STORY_FFMPEG || "ffmpeg";
const transcribe = process.argv.includes("--transcribe");
const selectedEpisode = process.argv.find(arg => arg.startsWith("--episode="))?.slice(10);
if (selectedEpisode && !["1", "2", "3"].includes(selectedEpisode)) throw new Error("Use --episode=1, --episode=2 or --episode=3.");
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
const words = text => text.toLowerCase().replace(/ß/g, "ss").replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(/\s+/u);
function wordError(expected, actual) {
  const a = words(expected), b = words(actual);
  let row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) next[j] = Math.min(row[j] + 1, next[j - 1] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    row = next;
  }
  return row[b.length] / a.length;
}

if (transcribe) {
  const envFile = process.env.B2_STORY_ENV_FILE || join(root, ".env.local");
  if (existsSync(envFile)) process.loadEnvFile(envFile);
}
const keyName = process.env.B2_STORY_GEMINI_KEY_ENV || "GEMINI_API_KEY";
if (transcribe && (!/^GEMINI_API_KEY\d*$/.test(keyName) || !process.env[keyName])) throw new Error("Configure a Gemini API key for transcription verification.");
mkdirSync(directory, { recursive: true });
const checks = [];
for (const [index, episode] of germanB2StoryEpisodes.entries()) {
  if (selectedEpisode && index + 1 !== Number(selectedEpisode)) continue;
  const path = join(root, `public/audio/german-b2-story/gemini-v1/episode-${index + 1}.m4a`);
  const bytes = readFileSync(path), sha256 = digest(bytes);
  const metadata = JSON.parse(readFileSync(`${path}.json`, "utf8"));
  const source = episode.dialogue.map(turn => `${turn.speaker}: ${turn.text}`).join("\n\n");
  if (metadata.provider !== "Google Gemini" || metadata.sha256 !== sha256 || metadata.transcriptSha256 !== digest(source)) throw new Error(`Episode ${index + 1}: audio or transcript hash mismatch.`);
  const result = spawnSync(ffmpeg, ["-v", "error", "-i", path, "-f", "s16le", "-ar", "24000", "-ac", "1", "pipe:1"], { maxBuffer: 32 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`Cannot decode episode ${index + 1}.`);
  const pcm = result.stdout;
  let peak = 0, squares = 0, clipped = 0;
  for (let offset = 0; offset < pcm.length; offset += 2) {
    const sample = pcm.readInt16LE(offset);
    peak = Math.max(peak, Math.abs(sample));
    squares += sample * sample;
    if (Math.abs(sample) >= 32760) clipped++;
  }
  const seconds = pcm.length / 48000, rms = Math.sqrt(squares / (pcm.length / 2));
  if (seconds < 60 || Math.abs(seconds - metadata.seconds) > 0.2 || peak < 1000 || rms < 100 || clipped / (pcm.length / 2) > 0.001) throw new Error(`Episode ${index + 1}: duration, silence or clipping check failed.`);
  const check = { episode: index + 1, sha256, seconds, wpm: metadata.wpm, peak, rms: Math.round(rms), clippedSamples: clipped };
  checks.push(check);
  console.log(`Decoded episode ${index + 1}: ${seconds.toFixed(1)} seconds, ${metadata.wpm} words/min, no excessive clipping.`);
  if (!transcribe) continue;
  const reportPath = join(directory, `episode-${index + 1}.json`);
  let report = existsSync(reportPath) ? JSON.parse(readFileSync(reportPath, "utf8")) : null;
  if (report?.sha256 !== sha256) {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
      method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": process.env[keyName] },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ inlineData: { mimeType: "audio/mp4", data: bytes.toString("base64") } }, { text: "Transcribe this German recording verbatim, from the first to the last spoken word. Return only the spoken words, without speaker labels, summaries, commentary, markdown or timestamps. Write all numbers as German words. Do not omit repetitions or sentence endings." }] }], generationConfig: { temperature: 0 } }),
      signal: AbortSignal.timeout(180000),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(`Gemini verification HTTP ${response.status}: ${payload.error?.status || "failed"}.`);
    const candidate = payload.candidates?.[0];
    if (candidate?.finishReason !== "STOP") throw new Error("Incomplete verification transcript.");
    const transcript = candidate.content?.parts?.map(part => part.text || "").join("").trim();
    if (!transcript) throw new Error("Empty verification transcript.");
    const expected = episode.dialogue.map(turn => turn.text).join(" ");
    report = { episode: index + 1, sha256, model: "gemini-2.5-flash", expected, transcript, wordErrorRate: wordError(expected, transcript), checkedAt: new Date().toISOString() };
    writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  }
  console.log(`Episode ${index + 1}: ${(report.wordErrorRate * 100).toFixed(1)}% independent transcription difference.`);
  if (report.wordErrorRate > 0.1) throw new Error(`Review episode ${index + 1}: transcription differs by more than 10%.`);
}
writeFileSync(join(directory, "local-checks.json"), `${JSON.stringify(checks, null, 2)}\n`);
