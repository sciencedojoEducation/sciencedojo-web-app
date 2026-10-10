import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { germanB2StoryEpisodes } from "../lib/german-b2-story.ts";

const root = resolve(import.meta.dirname, "..");
const dryRun = process.argv.includes("--dry-run");
const envFile = process.env.B2_STORY_ENV_FILE || join(root, ".env.local");
if (!dryRun && existsSync(envFile)) process.loadEnvFile(envFile);
const model = process.env.B2_STORY_GEMINI_MODEL || "gemini-3.8-flash-tts";
const voices = { Mira: "Kore", Jonas: "Charon", Leyla: "Aoede" };
const characters = {
  Mira: "Warm, curious young adult woman. Thoughtful, friendly questions; quietly confident suggestions.",
  Jonas: "Adult man with a warm lower register. Engaged and slightly impatient, never aggressive. Let concerns sound sincere.",
  Leyla: "Adult woman with a light, clear voice, distinct from Mira. Calm, practical mediator; warm rather than formal.",
};
const direction = "A natural, intimate conversation between neighbours, recorded in a quiet studio. Native Standard German pronunciation, fluid connected speech, meaningful emphasis and relaxed sentence endings. Clear B2 listening pace around 150 words per minute, with short natural pauses. Sound like a person responding to another person, not a narrator reading a textbook. No exaggerated acting, robotic syllable spacing, music or background sounds. Speak only the supplied words, never speaker names or instructions.";
const output = join(root, "public/audio/german-b2-story/gemini-v1");
const cache = join(tmpdir(), "sciencedojo-b2-story-gemini");
const force = process.argv.includes("--force");
const selectedEpisode = process.argv.find(arg => arg.startsWith("--episode="))?.slice(10);
if (selectedEpisode && !["1", "2", "3"].includes(selectedEpisode)) throw new Error("Use --episode=1, --episode=2 or --episode=3.");
if (!/^gemini-(?:3\.8-flash(?:-lite)?-tts|3\.1-flash-tts-preview|2\.5-(?:flash|pro)-preview-tts)$/.test(model)) throw new Error("Choose a supported Gemini speech model.");
const legacy = !model.startsWith("gemini-3.8-");
const digest = value => createHash("sha256").update(value).digest("hex");
const pause = ms => new Promise(done => setTimeout(done, ms));

// Gemini supports at most two voices in a request. Preserve consecutive turns
// and carry the same character voices across every group and episode.
function groupsFor(dialogue) {
  const groups = [];
  let current = [];
  for (const turn of dialogue) {
    if (new Set([...current.map(item => item.speaker), turn.speaker]).size > 2) {
      groups.push(current);
      current = [];
    }
    current.push(turn);
  }
  if (current.length) groups.push(current);
  return groups;
}

function requestFor(group) {
  const speakers = [...new Set(group.map(turn => turn.speaker))];
  const prebuiltVoice = speaker => ({ prebuiltVoiceConfig: { voiceName: voices[speaker] } });
  const speechConfig = speakers.length === 1 ? { voiceConfig: legacy ? prebuiltVoice(speakers[0]) : { voice: voices[speakers[0]] } } : {
    multiSpeakerVoiceConfig: { speakerVoiceConfigs: speakers.map(speaker => ({ speaker, voiceConfig: prebuiltVoice(speaker) })) },
  };
  return {
    contents: [{ role: "user", parts: legacy ? [{ text: `${direction}\n${speakers.map(speaker => `${speaker}: ${characters[speaker]}`).join("\n")}\n\n${group.map(turn => `${turn.speaker}: ${turn.text}`).join("\n")}` }] : group.map(turn => ({ text: turn.text, speech_metadata: { speaker: turn.speaker, style: `${direction} ${characters[turn.speaker]}` } })) }],
    generationConfig: { responseModalities: ["AUDIO"], ...(!legacy ? { responseFormat: { audio: { mimeType: "AUDIO_L16", sampleRate: 24000 } } } : {}), speechConfig },
  };
}

const episodes = germanB2StoryEpisodes.map((episode, index) => ({ ...episode, number: index + 1 })).filter(episode => !selectedEpisode || episode.number === Number(selectedEpisode));
if (dryRun) {
  for (const episode of episodes) console.log(JSON.stringify({ episode: episode.number, provider: "Google Gemini", model, voices, requests: groupsFor(episode.dialogue).length, turns: episode.dialogue.length }));
  process.exit(0);
}

const keyName = process.env.B2_STORY_GEMINI_KEY_ENV || "GEMINI_API_KEY";
if (!/^GEMINI_API_KEY\d*$/.test(keyName) || !process.env[keyName]) throw new Error("Configure GEMINI_API_KEY or select a configured GEMINI_API_KEY variable with B2_STORY_GEMINI_KEY_ENV.");
const ffmpeg = process.env.B2_STORY_FFMPEG || "ffmpeg";
if (spawnSync(ffmpeg, ["-version"], { stdio: "ignore" }).status !== 0) throw new Error("FFmpeg is required; set B2_STORY_FFMPEG if it is not on PATH.");
mkdirSync(output, { recursive: true });
mkdirSync(cache, { recursive: true });
let lastRequest = 0;

function validatePcm(pcm) {
  if (pcm.length < 48000 || pcm.length % 2) throw new Error("Gemini returned empty or malformed 24 kHz PCM.");
  let first = 0, last = pcm.length - 2;
  while (first < last && Math.abs(pcm.readInt16LE(first)) < 100) first += 2;
  while (last > first && Math.abs(pcm.readInt16LE(last)) < 100) last -= 2;
  if (last - first < 4800) throw new Error("Gemini returned silent audio.");
  return pcm.subarray(Math.max(0, first - 5760), Math.min(pcm.length, last + 5762));
}

async function synthesize(group) {
  const body = JSON.stringify(requestFor(group));
  const path = join(cache, `${digest(`${model}:${body}`)}.pcm`);
  if (!force && existsSync(path)) return validatePcm(readFileSync(path));
  for (let attempt = 0; attempt < 5; attempt++) {
    await pause(Math.max(0, 12000 - (Date.now() - lastRequest)));
    lastRequest = Date.now();
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": process.env[keyName] },
      body, signal: AbortSignal.timeout(180000),
    });
    const result = await response.json();
    if (!response.ok) {
      const dailyLimit = (result.error?.details || []).some(detail => (detail.violations || []).some(item => /PerDay|Daily/i.test(item.quotaId || "")));
      if ([429, 500, 503].includes(response.status) && attempt < 4 && !dailyLimit) {
        console.warn(`Gemini HTTP ${response.status}; retrying request ${attempt + 1}/4.`);
        await pause(Math.min(60000, 15000 * (attempt + 1)));
        continue;
      }
      // Avoid printing provider messages that could reflect credential values.
      throw new Error(`Gemini HTTP ${response.status}: ${result.error?.status || "request failed"}${dailyLimit ? " (daily quota exhausted)" : ""}.`);
    }
    const candidate = result.candidates?.[0];
    if (candidate?.finishReason && candidate.finishReason !== "STOP") throw new Error(`Incomplete Gemini speech: ${candidate.finishReason}`);
    const audio = candidate?.content?.parts?.filter(part => part.inlineData?.data).map(part => part.inlineData) || [];
    if (!audio.length || audio.some(part => !/^audio\/l16(?:;|$)/i.test(part.mimeType || ""))) throw new Error("Expected raw 24 kHz PCM from Gemini.");
    const pcm = validatePcm(Buffer.concat(audio.map(part => Buffer.from(part.data, "base64"))));
    const seconds = pcm.length / 48000;
    const words = group.map(turn => turn.text).join(" ").split(/\s+/u).length;
    const wpm = words / seconds * 60;
    if (wpm < 85 || wpm > 210) throw new Error(`Unexpected speech pace: ${Math.round(wpm)} words/min. Refusing a possibly incomplete recording.`);
    writeFileSync(path, pcm);
    return pcm;
  }
  throw new Error("Gemini speech retries exhausted.");
}

const temporary = mkdtempSync(join(output, ".generation-"));
try {
  for (const episode of episodes) {
    const destination = join(output, `episode-${episode.number}.m4a`);
    const metadataPath = `${destination}.json`;
    const transcript = episode.dialogue.map(turn => `${turn.speaker}: ${turn.text}`).join("\n\n");
    const fingerprint = digest(JSON.stringify({ model, voices, direction, characters, dialogue: episode.dialogue }));
    if (!force && existsSync(destination) && existsSync(metadataPath)) {
      const previous = JSON.parse(readFileSync(metadataPath, "utf8"));
      if (previous.fingerprint === fingerprint && previous.sha256 === digest(readFileSync(destination))) {
        console.log(`Verified Gemini episode ${episode.number}; no new API request.`);
        continue;
      }
    }
    const chunks = [];
    const groups = groupsFor(episode.dialogue);
    for (const [index, group] of groups.entries()) {
      console.log(`Episode ${episode.number}: generating dialogue group ${index + 1}/${groups.length} (${[...new Set(group.map(turn => turn.speaker))].join(" + ")}).`);
      if (index) chunks.push(Buffer.alloc(14400)); // 300 ms, 24 kHz mono int16.
      chunks.push(await synthesize(group));
    }
    const pcm = Buffer.concat(chunks);
    const seconds = pcm.length / 48000;
    const words = episode.dialogue.map(turn => turn.text).join(" ").split(/\s+/u).length;
    const raw = join(temporary, "episode.pcm");
    const encoded = join(temporary, "episode.m4a");
    writeFileSync(raw, pcm);
    const encoding = spawnSync(ffmpeg, ["-y", "-hide_banner", "-loglevel", "error", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", raw, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "24000", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", encoded], { encoding: "utf8" });
    if (encoding.status !== 0) throw new Error(`FFmpeg encoding failed: ${encoding.stderr}`);
    const bytes = readFileSync(encoded);
    if (bytes.length < 10000 || bytes.toString("ascii", 4, 8) !== "ftyp") throw new Error("Invalid encoded Gemini M4A.");
    renameSync(encoded, destination);
    writeFileSync(metadataPath, `${JSON.stringify({ provider: "Google Gemini", model, voices, episode: episode.number, generatedAt: new Date().toISOString(), fingerprint, transcriptSha256: digest(transcript), sha256: digest(bytes), seconds: Number(seconds.toFixed(2)), words, wpm: Math.round(words / seconds * 60), bytes: bytes.length, groups: groups.length }, null, 2)}\n`);
    console.log(`Created Gemini episode ${episode.number}: ${seconds.toFixed(1)} seconds, ${Math.round(words / seconds * 60)} words/min.`);
  }
} finally { rmSync(temporary, { recursive: true, force: true }); }
