import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { germanB2Chapters } from "../lib/german-b2-curriculum.ts";
import { germanB2AdvancedListening } from "../lib/german-b2-advanced-listening.ts";
import { germanB2WorkbookUnits } from "../lib/german-b2-workbook.ts";

const root = resolve(import.meta.dirname, "..");
const sourceEnv = process.env.B2_ENV_FILE || join(root, ".env.local");
for (const line of readFileSync(sourceEnv, "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^[ '\"]+|[ '\"]+$/g, "");
}
const keyEnv = process.env.B2_GEMINI_KEY_ENV || "GEMINI_API_KEY";
if (!process.env[keyEnv]) throw new Error(`${keyEnv} is required.`);
const ffmpeg = process.env.B2_FFMPEG || "ffmpeg";
if (spawnSync(ffmpeg, ["-version"], { stdio: "ignore" }).status !== 0) throw new Error("FFmpeg is required for AAC encoding.");
const model = process.env.B2_GEMINI_MODEL || "gemini-3.8-flash-lite-tts";
if (!["gemini-3.8-flash-lite-tts", "gemini-3.8-flash-tts", "gemini-3.1-flash-tts-preview", "gemini-2.5-flash-preview-tts"].includes(model)) throw new Error("Unsupported Gemini speech model.");
const legacy = model.includes("3.1-") || model.includes("2.5-");
const voices = legacy ? { Anna: "Kore", Eddy: "Charon", Reed: "Puck" }
  : { Anna: "de-de-assistant-11", Eddy: "de-de-assistant-8", Reed: "Puck" };
const style = "Speak only the exact German transcript. Natural Standard German, clear B2 exam listening pace, convincing intonation and pauses. Avoid theatrical delivery. Do not say speaker labels or add words.";
const outputDirectory = join(root, "public/audio/german-b2/natural-v1");
const cacheDirectory = join(tmpdir(), "b2-gemini-pcm-cache");
mkdirSync(outputDirectory, { recursive: true });
mkdirSync(cacheDirectory, { recursive: true });
const n = (index) => String(index + 1).padStart(2, "0");
const recordings = [
  ...germanB2Chapters.map((chapter, index) => ({ id: `de-b2-${n(index)}`, kind: "listening", segments: chapter.listening.split(/\s+—\s+/).map((text, turn) => ({ speaker: turn % 2 ? "Eddy" : "Anna", text })) })),
  ...germanB2AdvancedListening.map((item) => ({ id: `de-b2-${n(item.chapterIndex)}-advanced`, kind: "advanced", segments: item.segments })),
  ...germanB2WorkbookUnits.map((unit, index) => ({ id: `de-b2-${n(index)}-pronunciation`, kind: "pronunciation", segments: [{ speaker: index % 2 ? "Eddy" : "Anna", text: unit.pronunciationLine }] })),
];
const start = Number(process.argv.find((arg) => arg.startsWith("--start="))?.slice(8) || 0);
const count = Number(process.argv.find((arg) => arg.startsWith("--count="))?.slice(8) || recordings.length - start);
if (!Number.isInteger(start) || !Number.isInteger(count) || start < 0 || count < 1 || start + count > recordings.length) throw new Error(`Choose a valid range of ${recordings.length} tracks.`);
const pause = (ms) => new Promise((done) => setTimeout(done, ms));
let lastRequest = 0;
function wav(pcm) {
  const header = Buffer.alloc(44);
  header.write("RIFF"); header.writeUInt32LE(pcm.length + 36, 4); header.write("WAVE", 8);
  header.write("fmt ", 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22); header.writeUInt32LE(24000, 24); header.writeUInt32LE(48000, 28);
  header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34);
  header.write("data", 36); header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}
function trim(pcm) {
  if (pcm.length < 48000 || pcm.length % 2) throw new Error("Empty or malformed PCM speech.");
  let first = 0, last = pcm.length - 2;
  while (first < last && Math.abs(pcm.readInt16LE(first)) < 100) first += 2;
  while (last > first && Math.abs(pcm.readInt16LE(last)) < 100) last -= 2;
  if (last - first < 2400) throw new Error("Generated speech is silent.");
  const pad = 5760;
  return pcm.subarray(Math.max(0, first - pad), Math.min(pcm.length, last + 2 + pad));
}
async function generate(group, cacheKey) {
  const cache = join(cacheDirectory, `${cacheKey}.pcm`);
  if (existsSync(cache)) return trim(readFileSync(cache));
  const speakers = [...new Set(group.map((segment) => segment.speaker))];
  const voiceConfig = (speaker) => legacy ? { prebuiltVoiceConfig: { voiceName: voices[speaker] } } : { voice: voices[speaker] };
  const speechConfig = speakers.length === 1
    ? { voiceConfig: voiceConfig(speakers[0]) }
    : { multiSpeakerVoiceConfig: { speakerVoiceConfigs: speakers.map((speaker) => ({ speaker, voiceConfig: voiceConfig(speaker) })) } };
  const legacyText = `Read the following German transcript naturally at a clear B2 listening pace. Speak only the dialogue, without speaker names or commentary.\n\n${group.map((segment) => `${segment.speaker}: ${segment.text}`).join("\n")}`;
  const parts = legacy ? [{ text: legacyText }] : group.map((segment) => ({ text: segment.text, speech_metadata: { speaker: segment.speaker, style } }));
  const body = JSON.stringify({
    contents: [{ role: "user", parts }],
    generationConfig: { responseModalities: ["AUDIO"], ...(!legacy ? { responseFormat: { audio: { mimeType: "AUDIO_L16", sampleRate: 24000 } } } : {}), speechConfig },
  });
  for (let attempt = 0; attempt < 8; attempt++) {
    await pause(Math.max(0, 11000 - (Date.now() - lastRequest)));
    lastRequest = Date.now();
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": process.env[keyEnv] },
      body, signal: AbortSignal.timeout(180000),
    });
    const result = await response.json();
    if (!response.ok) {
      const message = result.error?.message || "Unknown Gemini error";
      const dailyLimit = (result.error?.details || []).some((detail) =>
        (detail.violations || []).some((violation) => /PerDay|Daily/i.test(violation.quotaId || "")));
      if ([429, 503].includes(response.status) && attempt < 7 && !dailyLimit) {
        const seconds = Number(message.match(/retry in ([\d.]+)s/i)?.[1] || 30);
        console.warn(`Gemini ${response.status}: ${message.slice(0, 220)}; retrying in ${Math.ceil(seconds + 2)}s`);
        await pause(Math.min(60000, (seconds + 2) * 1000));
        continue;
      }
      throw new Error(`Gemini ${response.status}: ${message}`);
    }
    const audio = result.candidates?.[0]?.content?.parts?.find((part) => part.inlineData)?.inlineData;
    if (!audio?.data || !/^audio\/l16/i.test(audio.mimeType || "")) throw new Error(`No 24 kHz PCM speech: ${audio?.mimeType || "empty response"}`);
    const pcm = trim(Buffer.from(audio.data, "base64"));
    writeFileSync(cache, pcm);
    return pcm;
  }
  throw new Error("Gemini retries exhausted.");
}
function groupsFor(recording) {
  if (new Set(recording.segments.map((segment) => segment.speaker)).size <= 2) return [recording.segments];
  // Gemini supports two speakers per generation. Keep consecutive turns together.
  const groups = []; let current = [];
  for (const segment of recording.segments) {
    if (new Set([...current.map((turn) => turn.speaker), segment.speaker]).size > 2) { groups.push(current); current = []; }
    current.push(segment);
  }
  if (current.length) groups.push(current);
  return groups;
}
for (const recording of recordings.slice(start, start + count)) {
  const output = join(outputDirectory, `${recording.id}.m4a`);
  const metadataPath = `${output}.json`;
  const fingerprint = createHash("sha256").update(JSON.stringify({ model, voices, style, recording })).digest("hex");
  if (existsSync(output) && existsSync(metadataPath) && !process.argv.includes("--force")) {
    const meta = JSON.parse(readFileSync(metadataPath, "utf8"));
    if (meta.fingerprint === fingerprint && meta.sha256 === createHash("sha256").update(readFileSync(output)).digest("hex")) {
      console.log(`Verified ${recording.id}`); continue;
    }
  }
  const groups = groupsFor(recording);
  const chunks = [];
  for (const [index, group] of groups.entries()) {
    if (index) chunks.push(Buffer.alloc(24000 * 2 * 0.4));
    chunks.push(await generate(group, createHash("sha256").update(`${fingerprint}:${index}`).digest("hex")));
  }
  const pcm = Buffer.concat(chunks);
  const seconds = pcm.length / 48000;
  const words = recording.segments.map((segment) => segment.text).join(" ").trim().split(/\s+/).length;
  const wpm = Math.round(words / seconds * 60);
  if (seconds < 1.5 || wpm > 210 || wpm < 60) throw new Error(`Implausible speech pace for ${recording.id}: ${wpm} WPM / ${seconds.toFixed(1)}s.`);
  const tempWave = join(cacheDirectory, `${recording.id}.wav`);
  const tempOutput = join(cacheDirectory, `${recording.id}.m4a`);
  writeFileSync(tempWave, wav(pcm));
  const encoded = spawnSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", "-i", tempWave,
    "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", tempOutput], { stdio: "inherit" });
  if (encoded.status !== 0) throw new Error(`AAC encode failed: ${recording.id}`);
  const bytes = readFileSync(tempOutput);
  if (bytes.length < 3000 || bytes.toString("ascii", 4, 8) !== "ftyp") throw new Error(`Invalid M4A: ${recording.id}`);
  renameSync(tempOutput, output);
  const metadata = { id: recording.id, kind: recording.kind, model, voices: [...new Set(recording.segments.map((segment) => voices[segment.speaker]))],
    fingerprint, sha256: createHash("sha256").update(bytes).digest("hex"), seconds: Number(seconds.toFixed(2)), words, wpm, bytes: bytes.length };
  writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
  console.log(`Created ${recording.id}: ${seconds.toFixed(1)}s, ${wpm} WPM, ${bytes.length} bytes`);
}
