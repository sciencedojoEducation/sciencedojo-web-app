import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { germanB2AdvancedListening } from "../lib/german-b2-advanced-listening.ts";

const root = resolve(import.meta.dirname, "..");
const destination = resolve(root, "public/audio/german-b2");
mkdirSync(destination, { recursive: true });

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) throw new Error(`${command} failed with exit code ${result.status}`);
}

function parseWave(path) {
  const buffer = readFileSync(path);
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE")
    throw new Error(`Invalid WAV file: ${path}`);
  let offset = 12;
  let format;
  let data;
  while (offset + 8 <= buffer.length) {
    const name = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (name === "fmt ") format = buffer.subarray(start, start + size);
    if (name === "data") data = buffer.subarray(start, start + size);
    offset = start + size + size % 2;
  }
  if (!format || !data || data.length < 10_000) throw new Error(`Empty or malformed speech: ${path}`);
  return { format, data };
}

function combineWaves(paths, output) {
  const waves = paths.map(parseWave);
  const format = waves[0].format;
  if (waves.some((wave) => !wave.format.equals(format))) throw new Error("Speaker recordings use different WAV formats.");
  const channels = format.readUInt16LE(2);
  const sampleRate = format.readUInt32LE(4);
  const bitsPerSample = format.readUInt16LE(14);
  const frameBytes = channels * bitsPerSample / 8;
  const pauseBytes = Math.round(sampleRate * frameBytes * 0.35);
  const pause = Buffer.alloc(pauseBytes - pauseBytes % frameBytes);
  const audio = Buffer.concat(waves.flatMap((wave, index) => index < waves.length - 1 ? [wave.data, pause] : [wave.data]));
  const formatPadding = format.length % 2;
  const audioPadding = audio.length % 2;
  const total = 12 + 8 + format.length + formatPadding + 8 + audio.length + audioPadding;
  const file = Buffer.alloc(total);
  file.write("RIFF", 0, "ascii");
  file.writeUInt32LE(total - 8, 4);
  file.write("WAVE", 8, "ascii");
  file.write("fmt ", 12, "ascii");
  file.writeUInt32LE(format.length, 16);
  format.copy(file, 20);
  const header = 20 + format.length + formatPadding;
  file.write("data", header, "ascii");
  file.writeUInt32LE(audio.length, header + 4);
  audio.copy(file, header + 8);
  writeFileSync(output, file);
}

for (const item of germanB2AdvancedListening) {
  const number = String(item.chapterIndex + 1).padStart(2, "0");
  const output = join(destination, `de-b2-${number}-advanced.m4a`);
  if (existsSync(output) && statSync(output).size > 10_000 && !process.argv.includes("--force")) continue;
  const temporary = mkdtempSync(join(tmpdir(), "german-b2-multispeaker-"));
  try {
    const segments = item.segments.map((segment, index) => {
      const wave = join(temporary, `${index}.wav`);
      run("/usr/bin/say", ["-v", segment.speaker, "-r", "180", "-o", wave,
        "--file-format=WAVE", "--data-format=LEI16@22050", "--channels=1", segment.text]);
      return wave;
    });
    const combined = join(temporary, "combined.wav");
    combineWaves(segments, combined);
    run("/usr/bin/afconvert", [combined, "-o", output, "-f", "m4af", "-d", "BEI16"]);
    if (statSync(output).size < 10_000) throw new Error(`Empty advanced audio for chapter ${number}`);
    console.log(`${item.title}: ${output}`);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}
