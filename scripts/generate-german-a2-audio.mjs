import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, rmSync, renameSync } from "node:fs";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import OpenAI from "openai";
import { a2AudioRecordings, a2AudioUrl, a2SpeechInstructions } from "../lib/german-a2-audio.ts";

const root = resolve(import.meta.dirname, "..");
for (const line of readFileSync(join(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^[ '"]+|[ '"]+$/g, "");
}
const engine = process.argv.find(arg => arg.startsWith("--engine="))?.split("=")[1] || "gemini";
if (!["openai", "gemini"].includes(engine)) throw new Error("Use --engine=openai or --engine=gemini.");
if (engine === "gemini" && !process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is required.");
if (engine === "openai" && !process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required. Basic system voices are deliberately not used as a fallback.");
const client = engine === "openai" ? new OpenAI({ maxRetries: 3, timeout: 120000 }) : null;
const start = Number(process.argv.find(arg => arg.startsWith("--start="))?.split("=")[1] || 0);
const count = Number(process.argv.find(arg => arg.startsWith("--count="))?.split("=")[1] || a2AudioRecordings.length - start);
if (!Number.isInteger(start) || start < 0 || !Number.isInteger(count) || count < 1 || start + count > a2AudioRecordings.length)
  throw new Error("Invalid recording range.");
const ffmpeg = process.argv.find(arg => arg.startsWith("--ffmpeg="))?.slice("--ffmpeg=".length) || process.env.A2_FFMPEG_PATH || "ffmpeg";
if (spawnSync(ffmpeg,["-version"],{stdio:"ignore"}).status !== 0)
  throw new Error("FFmpeg is required for browser-compatible AAC. Install it or supply --ffmpeg=/absolute/path before generating speech.");
const geminiModel = process.argv.find(arg=>arg.startsWith("--gemini-model="))?.split("=")[1] || "gemini-3.8-flash-tts";
if (!["gemini-3.8-flash-tts","gemini-3.8-flash-lite-tts","gemini-3.1-flash-tts-preview","gemini-2.5-pro-preview-tts","gemini-2.5-flash-preview-tts"].includes(geminiModel)) throw new Error("Unsupported Gemini speech model.");
const model = engine === "gemini" ? geminiModel : "gpt-4o-mini-tts";
const legacyGemini = ["gemini-3.1-flash-tts-preview","gemini-2.5-pro-preview-tts","gemini-2.5-flash-preview-tts"].includes(model);
const geminiVoices = legacyGemini
  ? { Anna: "Kore", "Eddy (German (Germany))": "Charon" }
  : { Anna: "de-de-assistant-11", "Eddy (German (Germany))": "de-de-assistant-8" };
// PCM is mono, 24 kHz, signed 16-bit little endian per the speech API contract.
function trimBoundarySilence(pcm) {
  if (pcm.length % 2 || pcm.length < 4800) throw new Error("Invalid or empty speech PCM.");
  let first = 0, last = pcm.length - 2;
  while (first < last && Math.abs(pcm.readInt16LE(first)) < 100) first += 2;
  while (last > first && Math.abs(pcm.readInt16LE(last)) < 100) last -= 2;
  if (last - first < 2400) throw new Error("Generated speech is silent.");
  const padding = 24000 * 2 * 0.12;
  return pcm.subarray(Math.max(0, first - padding), Math.min(pcm.length, last + 2 + padding));
}
function wave(pcm) {
  const header = Buffer.alloc(44);
  header.write("RIFF"); header.writeUInt32LE(36 + pcm.length, 4); header.write("WAVE", 8);
  header.write("fmt ", 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22); header.writeUInt32LE(24000, 24); header.writeUInt32LE(48000, 28);
  header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34);
  header.write("data", 36); header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}
let lastGeminiRequest = 0;
async function generateGemini(recording) {
  const speakers = [...new Set(recording.segments.map(segment => segment.speaker))];
  const speakerLabel = speaker => legacyGemini ? (speaker === "Anna" ? "Anna" : "Ben") : speaker;
  const voiceConfig = speaker => legacyGemini ? {prebuiltVoiceConfig:{voiceName:geminiVoices[speaker]}} : {voice:geminiVoices[speaker]};
  const speechConfig = speakers.length > 1
    ? { multiSpeakerVoiceConfig: { speakerVoiceConfigs: speakers.map(speaker => ({speaker:speakerLabel(speaker),voiceConfig:voiceConfig(speaker)})) } }
    : { voiceConfig: voiceConfig(speakers[0]) };
  const parts = recording.segments.map(segment => ({text:segment.text,speech_metadata:{speaker:segment.speaker,
    style:a2SpeechInstructions + " Respond naturally to your conversation partner, with realistic pauses."}}));
  const generationParts = legacyGemini
    ? [{text:`${a2SpeechInstructions} Read the following transcript only, without the speaker names.\n\n${recording.segments.map(segment=>speakers.length>1?`${speakerLabel(segment.speaker)}: ${segment.text}`:segment.text).join("\n")}`} ] : parts;
  const body = JSON.stringify({contents:[{role:"user",parts:generationParts}],generationConfig:{responseModalities:["AUDIO"],
    ...(!legacyGemini?{responseFormat:{audio:{mimeType:"AUDIO_L16",sampleRate:24000}}}:{}),speechConfig}});
  for (let attempt = 0; attempt < 6; attempt++) {
    const wait = Math.max(0,21000 - (Date.now() - lastGeminiRequest));
    if (wait) await new Promise(resolvePromise => setTimeout(resolvePromise,wait));
    lastGeminiRequest = Date.now();
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":process.env.GEMINI_API_KEY},body,
      signal:AbortSignal.timeout(180000),
    });
    const payload = await response.json();
    if (!response.ok) {
      const quotaIds = (payload.error?.details || []).flatMap(detail => detail.violations || []).map(violation => violation.quotaId).join(", ");
      const message = (payload.error?.message || "Unknown API error") + (quotaIds ? ` Quota identifiers: ${quotaIds}` : "");
      if (response.status === 429 && !/perday|per.day|daily|limit: 0/i.test(message) && attempt < 5) {
        const retrySeconds = Number(message.match(/retry in ([0-9.]+)s/i)?.[1] || 30);
        console.log(`Gemini request limit; retrying in ${Math.ceil(retrySeconds + 2)} seconds.`);
        await new Promise(resolvePromise => setTimeout(resolvePromise,Math.min(55000,(retrySeconds+2)*1000))); continue;
      }
      throw new Error(`Gemini speech generation failed (${response.status}): ${message}`);
    }
    const audio = payload.candidates?.[0]?.content?.parts?.find(part => part.inlineData)?.inlineData;
    if (!audio?.data || !/audio\/(l16|pcm)/i.test(audio.mimeType || "")) throw new Error(`Expected PCM speech; received ${audio?.mimeType || "no audio"}.`);
    return trimBoundarySilence(Buffer.from(audio.data,"base64"));
  }
  throw new Error("Gemini speech retries exhausted.");
}
for (const recording of a2AudioRecordings.slice(start, start + count)) {
  const output = join(root, "public", a2AudioUrl(recording.id).slice(1));
  const metadataPath = output + ".json";
  const fingerprint = createHash("sha256").update(JSON.stringify({recording, model, instructions:a2SpeechInstructions})).digest("hex");
  if (existsSync(output) && existsSync(metadataPath) && !process.argv.includes("--force")) {
    const metadata = JSON.parse(readFileSync(metadataPath, "utf8"));
    const digest = createHash("sha256").update(readFileSync(output)).digest("hex");
    const acceptedFingerprint = process.argv.includes("--keep-existing")
      ? createHash("sha256").update(JSON.stringify({recording,model:metadata.model,instructions:a2SpeechInstructions})).digest("hex") : fingerprint;
    if (metadata.fingerprint === acceptedFingerprint && metadata.sha256 === digest) { console.log(`Verified existing ${recording.id}`); continue; }
  }
  mkdirSync(resolve(output, ".."), { recursive: true });
  const temporary = mkdtempSync(join(tmpdir(), "a2-natural-"));
  try {
    const parts = [];
    const speakers = [];
    if (engine === "gemini") {
      const cacheDirectory = join(tmpdir(), "a2-natural-pcm");
      mkdirSync(cacheDirectory, {recursive:true});
      const cachePath = join(cacheDirectory, fingerprint + ".pcm");
      const speech = existsSync(cachePath) ? trimBoundarySilence(readFileSync(cachePath)) : await generateGemini(recording);
      writeFileSync(cachePath, speech);
      parts.push(speech);
      speakers.push(...recording.segments.map(segment => geminiVoices[segment.speaker]));
    } else for (const [index, segment] of recording.segments.entries()) {
      const voice = segment.speaker === "Anna" ? "marin" : "cedar";
      const context = recording.segments.length > 1
        ? `This is turn ${index + 1} of an everyday German dialogue. Respond naturally to the previous speaker. Previous turn for context only: ${recording.segments[index - 1]?.text || "Opening the conversation."}. Do not read that context aloud.`
        : "This is a short everyday message, announcement or account, spoken to an adult listener.";
      const response = await client.audio.speech.create({ model, voice, input: segment.text,
        instructions: `${a2SpeechInstructions} ${context}`, response_format: "pcm", speed: 1 });
      const pcm = trimBoundarySilence(Buffer.from(await response.arrayBuffer()));
      if (index) parts.push(Buffer.alloc(24000 * 2 * (segment.text.endsWith("?") ? 0.28 : 0.36)));
      parts.push(pcm);
      speakers.push(voice);
    }
    const pcm = Buffer.concat(parts);
    const sourceSeconds = pcm.length / 48000;
    const words = recording.segments.map(s => s.text).join(" ").trim().split(/\s+/).length;
    const sourceRate = words / sourceSeconds * 60;
    const tempo = sourceRate > 165 ? 155 / sourceRate : 1;
    if (tempo < 0.75) throw new Error(`Speech for ${recording.id} is too fast; regenerate rather than excessively slowing it.`);
    const source = join(temporary, "source.wav"), encoded = join(temporary, "encoded.m4a");
    writeFileSync(source, wave(pcm));
    const result = spawnSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", "-i", source, "-af", `atempo=${tempo}`, "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", encoded], {stdio:"inherit"});
    if (result.status !== 0) throw new Error("AAC encoding failed.");
    const bytes = readFileSync(encoded);
    if (bytes.length < 10000 || bytes.toString("ascii",4,8) !== "ftyp") throw new Error("Invalid M4A output.");
    renameSync(encoded, output);
    const seconds = sourceSeconds / tempo;
    const metadata = {id:recording.id,model,speakers,fingerprint,sha256:createHash("sha256").update(bytes).digest("hex"),
      sourceSeconds,tempo,seconds,words,wordsPerMinute:Math.round(words / seconds * 60),bytes:bytes.length,generatedAt:new Date().toISOString()};
    writeFileSync(metadataPath, JSON.stringify(metadata,null,2) + "\n");
    console.log(`Created ${recording.id}: ${seconds.toFixed(1)}s, ${metadata.wordsPerMinute} words/min, ${new Set(speakers).size} voices`);
  } finally { rmSync(temporary, {recursive:true,force:true}); }
}
