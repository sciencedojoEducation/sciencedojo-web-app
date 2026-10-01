import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, rmSync, renameSync } from "node:fs";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { b1AudioRecordings, b1AudioUrl, b1SpeechInstructions } from "../lib/german-b1-audio.ts";

const root = resolve(import.meta.dirname, "..");
for (const line of readFileSync(join(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^[ '"]+|[ '"]+$/g, "");
}
const keyName = process.argv.find(arg => arg.startsWith("--key-env="))?.split("=")[1] || "GEMINI_API_KEY";
if (!/^GEMINI_API_KEY[0-9]*$/.test(keyName)) throw new Error("Invalid Gemini key environment variable.");
const apiKey = process.env[keyName];
if (!apiKey) throw new Error(`${keyName} is required.`);
const start = Number(process.argv.find(arg => arg.startsWith("--start="))?.split("=")[1] || 0);
const count = Number(process.argv.find(arg => arg.startsWith("--count="))?.split("=")[1] || b1AudioRecordings.length - start);
if (!Number.isInteger(start) || start < 0 || !Number.isInteger(count) || count < 1 || start + count > b1AudioRecordings.length)
  throw new Error("Invalid recording range.");
const model = "gemini-3.8-flash-tts";
const voiceFor = speaker => speaker === "Anna" ? "Kore" : "Puck";
async function generate(recording) {
  const speakers = [...new Set(recording.segments.map(segment => segment.speaker))];
  const speechConfig = speakers.length > 1 ? {multiSpeakerVoiceConfig:{speakerVoiceConfigs:speakers.map(speaker => ({speaker,voiceConfig:{prebuiltVoiceConfig:{voiceName:voiceFor(speaker)}}}))}} : {voiceConfig:{voice:voiceFor(speakers[0])}};
  const body = {contents:[{role:"user",parts:recording.segments.map(segment => ({text:segment.text,speech_metadata:{speaker:segment.speaker,style:b1SpeechInstructions}}))}],generationConfig:{responseModalities:["AUDIO"],speechConfig}};
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":apiKey},body:JSON.stringify(body),signal:AbortSignal.timeout(180000)});
    const payload = await response.json();
    if (response.ok) {
      const audio = payload.candidates?.[0]?.content?.parts?.find(part => part.inlineData)?.inlineData;
      if (!audio?.data) throw new Error("Gemini returned no audio.");
      const bytes = Buffer.from(audio.data,"base64");
      if (bytes.toString("ascii",0,4) !== "RIFF" || bytes.toString("ascii",8,12) !== "WAVE") throw new Error("Expected Gemini WAV audio.");
      let pcm;
      for (let offset = 12; offset + 8 <= bytes.length;) {
        const tag = bytes.toString("ascii",offset,offset+4), size = bytes.readUInt32LE(offset+4);
        if (offset + 8 + size > bytes.length) throw new Error("Truncated WAV.");
        if (tag === "fmt " && (bytes.readUInt16LE(offset+8) !== 1 || bytes.readUInt16LE(offset+10) !== 1 || bytes.readUInt32LE(offset+12) !== 24000 || bytes.readUInt16LE(offset+22) !== 16)) throw new Error("Unexpected WAV format.");
        if (tag === "data") pcm = bytes.subarray(offset+8,offset+8+size);
        offset += 8 + size + (size % 2);
      }
      if (!pcm) throw new Error("WAV has no samples.");
      return trimBoundarySilence(pcm);
    }
    const message = payload.error?.message || `HTTP ${response.status}`;
    if (/perday|per_day|daily/i.test(JSON.stringify(payload))) throw new Error("Gemini daily quota exhausted. Run the same command after the quota resets; verified files will be reused.");
    if (![429,503].includes(response.status) || attempt === 4) throw new Error(`Gemini speech failed: ${message}`);
    const seconds = Math.min(55, Number(payload.error?.details?.find(detail => detail.retryDelay)?.retryDelay?.replace("s","")) || 40);
    console.log(`Quota/backoff: retrying in ${seconds}s.`);
    await new Promise(done => setTimeout(done,seconds*1000));
  }
}

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
for (const recording of b1AudioRecordings.slice(start, start + count)) {
  const output = join(root, "public", b1AudioUrl(recording.id).slice(1));
  const metadataPath = output + ".json";
  const fingerprint = createHash("sha256").update(JSON.stringify({recording, model, instructions:b1SpeechInstructions, voices:["Kore","Puck"], wholeDialogue:true})).digest("hex");
  if (existsSync(output) && existsSync(metadataPath) && !process.argv.includes("--force")) {
    const metadata = JSON.parse(readFileSync(metadataPath, "utf8"));
    const digest = createHash("sha256").update(readFileSync(output)).digest("hex");
    if (metadata.fingerprint === fingerprint && metadata.sha256 === digest) { console.log(`Verified existing ${recording.id}`); continue; }
  }
  mkdirSync(resolve(output, ".."), { recursive: true });
  const temporary = mkdtempSync(join(tmpdir(), "b1-natural-"));
  try {
    const cacheDirectory = join(root,"tmp/b1-neural-audio");
    mkdirSync(cacheDirectory,{recursive:true});
    const cachePath = join(cacheDirectory,`${recording.id}-${fingerprint}.pcm`);
    const pcm = existsSync(cachePath) ? readFileSync(cachePath) : await generate(recording);
    if (!existsSync(cachePath)) writeFileSync(cachePath,pcm);
    const speakers = recording.segments.map(segment => voiceFor(segment.speaker));
    const source = join(temporary, "source.wav"), encoded = join(temporary, "encoded.m4a");
    writeFileSync(source, wave(pcm));
    const result = spawnSync("/usr/bin/afconvert", [source, "-o", encoded, "-f", "m4af", "-d", "LEI16"], {stdio:"inherit"});
    if (result.status !== 0) throw new Error("M4A encoding failed; the generated PCM is cached for retry.");
    const bytes = readFileSync(encoded);
    if (bytes.length < 10000 || bytes.toString("ascii",4,8) !== "ftyp") throw new Error("Invalid M4A output.");
    renameSync(encoded, output);
    const seconds = pcm.length / 48000;
    const words = recording.segments.map(s => s.text).join(" ").trim().split(/\s+/).length;
    const metadata = {id:recording.id,model,speakers,fingerprint,sha256:createHash("sha256").update(bytes).digest("hex"),
      seconds,words,wordsPerMinute:Math.round(words / seconds * 60),bytes:bytes.length,generatedAt:new Date().toISOString()};
    writeFileSync(metadataPath, JSON.stringify(metadata,null,2) + "\n");
    console.log(`Created ${recording.id}: ${seconds.toFixed(1)}s, ${metadata.wordsPerMinute} words/min, ${new Set(speakers).size} voices`);
  } finally { rmSync(temporary, {recursive:true,force:true}); }
}
