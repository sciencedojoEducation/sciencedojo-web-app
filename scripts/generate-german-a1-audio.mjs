import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import OpenAI from "openai";
import { germanA1AudioManifest } from "../lib/german-a1-course.ts";
import { germanA1SpeakerProfiles } from "../lib/german-a1-audio.ts";

const root = resolve(import.meta.dirname, "..");
const outputDirectory = join(root, "public", "audio", "german-a1");
const force = process.argv.includes("--force");
const engineArgument = process.argv.find((argument) => argument.startsWith("--engine="));
const engine = engineArgument?.split("=")[1] || "gemini";
const startArgument = process.argv.find((argument) => argument.startsWith("--start="));
const start = startArgument ? Number(startArgument.split("=")[1]) : 0;
const limitArgument = process.argv.find((argument) => argument.startsWith("--limit="));
const limit = limitArgument ? Number(limitArgument.split("=")[1]) : germanA1AudioManifest.length - start;
if (!new Set(["gemini", "openai", "system"]).has(engine))
  throw new Error(`Unsupported audio engine: ${engine}`);
const openai = engine === "openai" ? new OpenAI() : null;
const geminiApiKey = process.env.GEMINI_API_KEY;
if (engine === "gemini" && !geminiApiKey) throw new Error("GEMINI_API_KEY is required.");
mkdirSync(outputDirectory, { recursive: true });

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) throw new Error(`${command} failed with exit code ${result.status}`);
}

function parseWave(buffer) {
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE")
    throw new Error("Unexpected WAV file structure.");
  let offset = 12;
  let format;
  let data;
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (id === "fmt ") format = buffer.subarray(start, start + size);
    if (id === "data") data = buffer.subarray(start, start + size);
    offset = start + size + (size % 2);
  }
  if (!format || !data) throw new Error("WAV file is missing format or audio data.");
  return { format, data };
}

function silenceFor(format, milliseconds) {
  const channels = format.readUInt16LE(2);
  const sampleRate = format.readUInt32LE(4);
  const bitsPerSample = format.readUInt16LE(14);
  const bytes = Math.round((sampleRate * channels * (bitsPerSample / 8) * milliseconds) / 1000);
  return Buffer.alloc(bytes - (bytes % Math.max(1, channels * (bitsPerSample / 8))));
}

function combineWaveFiles(paths, destination, pauseMilliseconds = 420) {
  const waves = paths.map((path) => parseWave(readFileSync(path)));
  const format = waves[0].format;
  if (waves.some((wave) => !wave.format.equals(format)))
    throw new Error("Generated speaker segments use incompatible audio formats.");
  const pause = silenceFor(format, pauseMilliseconds);
  const data = Buffer.concat(waves.flatMap((wave, index) =>
    index === waves.length - 1 ? [wave.data] : [wave.data, pause]
  ));
  const formatPadding = format.length % 2;
  const dataPadding = data.length % 2;
  const fileSize = 12 + 8 + format.length + formatPadding + 8 + data.length + dataPadding;
  const output = Buffer.alloc(fileSize);
  output.write("RIFF", 0, "ascii");
  output.writeUInt32LE(fileSize - 8, 4);
  output.write("WAVE", 8, "ascii");
  output.write("fmt ", 12, "ascii");
  output.writeUInt32LE(format.length, 16);
  format.copy(output, 20);
  const dataHeader = 20 + format.length + formatPadding;
  output.write("data", dataHeader, "ascii");
  output.writeUInt32LE(data.length, dataHeader + 4);
  data.copy(output, dataHeader + 8);
  writeFileSync(destination, output);
}

function performanceInstructions(profile, isReview) {
  return [
    "Speak only the supplied German text. Do not add a speaker name, explanation, sound effect, or extra words.",
    "Use native, neutral Standard German pronunciation.",
    profile.performance,
    "Give an expressive, polished character performance suitable for a friendly gamified language-learning app.",
    isReview
      ? "Use natural conversational speed, with clear phrasing and lively but realistic intonation."
      : "Use a deliberate A1 learner pace, with exceptionally clear words, short natural phrase groups, and encouraging intonation.",
    "Sound human and emotionally present, but avoid parody, melodrama, or exaggerated cartoon speech.",
  ].join(" ");
}

async function generateOpenAISegment(line, destination, isReview) {
  const response = await openai.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: line.profile.openAIVoice,
    input: line.text,
    instructions: performanceInstructions(line.profile, isReview),
    response_format: "wav",
    speed: isReview ? 1 : 0.92,
  });
  writeFileSync(destination, Buffer.from(await response.arrayBuffer()));
}

async function requestGeminiSpeech(parts, speakerProfiles) {
  const multiSpeaker = speakerProfiles.length > 1;
  const speechConfig = multiSpeaker
    ? {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: speakerProfiles.map(([speaker, profile]) => ({
            speaker,
            voiceConfig: { voice: profile.voice },
          })),
        },
      }
    : { voiceConfig: { voice: speakerProfiles[0][1].voice } };
  const request = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      responseFormat: { audio: { mimeType: "AUDIO_WAV", sampleRate: 24000 } },
      speechConfig,
    },
  };
  let response;
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash-tts:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiApiKey,
        },
        body: JSON.stringify(request),
      },
    );
    if (response.ok) break;
    const details = await response.text();
    if (details.includes("GenerateRequestsPerDay"))
      throw new Error(`Gemini daily speech quota is exhausted. Resume this command after the quota resets.\n${details}`);
    if (response.status !== 429 || attempt === 8)
      throw new Error(`Gemini speech generation failed (${response.status}): ${details}`);
    const retrySeconds = Number(details.match(/retry(?:Delay| in)[^0-9]*(\d+)/i)?.[1] || 40);
    const retryMilliseconds = Math.min(55, Math.max(5, retrySeconds + 2)) * 1000;
    console.log(`  Rate limit reached; retrying in ${retryMilliseconds / 1000} seconds (attempt ${attempt + 1}/8).`);
    await new Promise((resolvePromise) => setTimeout(resolvePromise, retryMilliseconds));
  }
  if (!response?.ok) throw new Error("Gemini speech generation failed without a response.");
  const payload = await response.json();
  const encoded = payload.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!encoded) throw new Error("Gemini response did not contain audio data.");
  return Buffer.from(encoded, "base64");
}

async function generateGeminiTrack(lines, temporaryDirectory, isReview) {
  const speakers = [...new Map(lines.map((line) => [line.speaker, line.profile])).entries()];
  if (speakers.length <= 2) {
    const parts = lines.map((line) => ({
      text: line.text,
      speech_metadata: {
        speaker: line.speaker,
        style: `${line.profile.performance} ${isReview ? "Natural conversational speed." : "Slow, exceptionally clear A1 learner pace."}`,
      },
    }));
    const destination = join(temporaryDirectory, "gemini-dialogue.wav");
    writeFileSync(destination, await requestGeminiSpeech(parts, speakers));
    return [destination];
  }
  const segments = [];
  for (const [lineIndex, line] of lines.entries()) {
    const destination = join(temporaryDirectory, `${lineIndex}.wav`);
    const parts = [{
      text: line.text,
      speech_metadata: {
        style: `${line.profile.performance} ${isReview ? "Natural conversational speed." : "Slow, exceptionally clear A1 learner pace."}`,
      },
    }];
    writeFileSync(destination, await requestGeminiSpeech(parts, [[line.speaker, line.profile]]));
    segments.push(destination);
  }
  return segments;
}

function generateSystemSegment(line, destination, rate) {
  run("/usr/bin/say", [
    "-v",
    line.profile.systemVoice,
    "-r",
    rate,
    "-o",
    destination,
    "--file-format=WAVE",
    "--data-format=LEI16@22050",
    "--channels=1",
    line.text,
  ]);
}

for (const [relativeIndex, item] of germanA1AudioManifest.slice(start, start + limit).entries()) {
  const index = start + relativeIndex;
  if (!item.outputPath || !item.transcript) throw new Error(`Missing audio data for ${item.slug}`);
  const output = join(root, "public", item.outputPath.replace(/^\//, ""));
  if (!force && existsSync(output) && statSync(output).size > 0) continue;
  const rate = index < 32 ? "145" : "165";
  const lines = item.transcript.split("\n").filter(Boolean).map((line) => {
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (!match) throw new Error(`Transcript line needs a speaker label: ${line}`);
    const profile = germanA1SpeakerProfiles[match[1]];
    if (!profile) throw new Error(`No voice profile for ${match[1]}`);
    return { speaker: match[1], text: match[2], profile };
  });
  const temporaryDirectory = mkdtempSync(join(tmpdir(), "german-a1-audio-"));
  try {
    let segments = [];
    for (const line of lines) {
      console.log(
        `  ${line.speaker}: ${engine === "gemini" ? line.profile.voice : engine === "openai" ? line.profile.openAIVoice : line.profile.systemVoice} (${line.profile.gender}, ${line.profile.ageGroup})`,
      );
    }
    if (engine === "gemini") segments = await generateGeminiTrack(lines, temporaryDirectory, index >= 32);
    else for (const [lineIndex, line] of lines.entries()) {
      const segment = join(temporaryDirectory, `${lineIndex}.wav`);
      if (engine === "openai") await generateOpenAISegment(line, segment, index >= 32);
      else generateSystemSegment(line, segment, rate);
      segments.push(segment);
    }
    const combinedWave = join(temporaryDirectory, "combined.wav");
    combineWaveFiles(segments, combinedWave);
    run("/usr/bin/afconvert", [
      combinedWave,
      "-o",
      output,
      "-f",
      "m4af",
      "-d",
      "BEI16",
    ]);
    console.log(`Generated ${item.slug}.m4a with ${new Set(lines.map((line) => line.profile.voice)).size} expressive voices`);
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

console.log(`German A1 ${engine} audio ready: ${germanA1AudioManifest.length} tracks in ${outputDirectory}`);
