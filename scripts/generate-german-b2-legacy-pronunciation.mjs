import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { germanB2WorkbookUnits } from "../lib/german-b2-workbook.ts";

const root = resolve(import.meta.dirname, "..");
for (const line of readFileSync(process.env.B2_ENV_FILE || join(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^[ '\"]+|[ '\"]+$/g, "");
}
const keyEnv = process.env.B2_GEMINI_KEY_ENV || "GEMINI_API_KEY";
if (!process.env[keyEnv]) throw new Error(`${keyEnv} is required.`);
const ffmpeg = process.env.B2_FFMPEG || "ffmpeg";
if (spawnSync(ffmpeg, ["-version"], { stdio: "ignore" }).status !== 0) throw new Error("FFmpeg is required.");
const model = "gemini-3.1-flash-tts-preview";
const outputDirectory = join(root, "public/audio/german-b2/natural-v1");
const cacheDirectory = join(tmpdir(), "b2-gemini-legacy-pcm-cache");
mkdirSync(outputDirectory, { recursive: true });
mkdirSync(cacheDirectory, { recursive: true });
const start = Number(process.argv.find((arg) => arg.startsWith("--start="))?.slice(8) || 0);
const count = Number(process.argv.find((arg) => arg.startsWith("--count="))?.slice(8) || germanB2WorkbookUnits.length - start);
if (!Number.isInteger(start) || !Number.isInteger(count) || start < 0 || count < 1 || start + count > germanB2WorkbookUnits.length) throw new Error("Invalid pronunciation range.");
const pause = (ms) => new Promise((done) => setTimeout(done, ms));
function wav(pcm) {
  const header = Buffer.alloc(44);
  header.write("RIFF"); header.writeUInt32LE(pcm.length + 36, 4); header.write("WAVE", 8);
  header.write("fmt ", 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22); header.writeUInt32LE(24000, 24); header.writeUInt32LE(48000, 28);
  header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34);
  header.write("data", 36); header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}
for (let index = start; index < start + count; index++) {
  const id = `de-b2-${String(index + 1).padStart(2, "0")}-pronunciation`;
  const output = join(outputDirectory, `${id}.m4a`);
  const metadataPath = `${output}.json`;
  const text = germanB2WorkbookUnits[index].pronunciationLine;
  const voice = index % 2 ? "Charon" : "Kore";
  const fingerprint = createHash("sha256").update(JSON.stringify({ id, text, model, voice })).digest("hex");
  if (existsSync(output) && existsSync(metadataPath) && !process.argv.includes("--force")) {
    const meta = JSON.parse(readFileSync(metadataPath, "utf8"));
    if (meta.sha256 === createHash("sha256").update(readFileSync(output)).digest("hex")) { console.log(`Verified existing ${id}`); continue; }
  }
  const body = JSON.stringify({ contents: [{ role: "user", parts: [{ text: `Speak in natural Standard German at a clear model pace. Read only the sentence after the colon, without introduction or commentary: ${text}` }] }],
    generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } } });
  let pcm;
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": process.env[keyEnv] },
      body, signal: AbortSignal.timeout(120000),
    });
    const result = await response.json();
    if (!response.ok) {
      const daily = (result.error?.details || []).some((detail) => (detail.violations || []).some((item) => /PerDay/.test(item.quotaId || "")));
      if (response.status === 429 && !daily && attempt < 2) { await pause(30000); continue; }
      throw new Error(`Gemini ${response.status}: ${result.error?.message}`);
    }
    const audio = result.candidates?.[0]?.content?.parts?.find((part) => part.inlineData)?.inlineData;
    if (!audio?.data || !/^audio\/l16/i.test(audio.mimeType || "")) throw new Error(`Missing PCM for ${id}`);
    pcm = Buffer.from(audio.data, "base64");
    break;
  }
  if (!pcm || pcm.length < 48000 || pcm.length % 2) throw new Error(`Invalid PCM for ${id}`);
  const seconds = pcm.length / 48000;
  const words = text.trim().split(/\s+/).length;
  const wpm = Math.round(words / seconds * 60);
  if (wpm > 210 || wpm < 50) throw new Error(`Implausible speech pace for ${id}: ${wpm} WPM.`);
  const tempWave = join(cacheDirectory, `${id}.wav`);
  const tempOutput = join(cacheDirectory, `${id}.m4a`);
  writeFileSync(tempWave, wav(pcm));
  const encoded = spawnSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", "-i", tempWave,
    "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", tempOutput], { stdio: "inherit" });
  if (encoded.status !== 0) throw new Error(`AAC encoding failed for ${id}`);
  const bytes = readFileSync(tempOutput);
  if (bytes.length < 3000 || bytes.toString("ascii", 4, 8) !== "ftyp") throw new Error(`Invalid M4A for ${id}`);
  renameSync(tempOutput, output);
  writeFileSync(metadataPath, JSON.stringify({ id, kind: "pronunciation", model, voices: [voice], fingerprint,
    sha256: createHash("sha256").update(bytes).digest("hex"), seconds: Number(seconds.toFixed(2)), words, wpm, bytes: bytes.length }, null, 2) + "\n");
  console.log(`Created ${id}: ${seconds.toFixed(1)}s, ${wpm} WPM`);
  await pause(12000);
}
