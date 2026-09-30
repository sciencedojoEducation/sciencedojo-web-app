import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { germanB2Chapters } from "../lib/german-b2-curriculum.ts";

const root = resolve(import.meta.dirname, "..");
const outputDirectory = resolve(root, "public/audio/german-b2");
const start = Number(process.argv.find((arg) => arg.startsWith("--start="))?.split("=")[1] || 0);
const count = Number(process.argv.find((arg) => arg.startsWith("--count="))?.split("=")[1] || germanB2Chapters.length - start);
if (!Number.isInteger(start) || start < 0 || !Number.isInteger(count) || count < 1 || start + count > germanB2Chapters.length)
  throw new Error("Use a valid --start and --count within the 18 chapters.");
mkdirSync(outputDirectory, { recursive: true });

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) throw new Error(`${command} failed with exit code ${result.status}`);
}

for (let index = start; index < start + count; index++) {
  const output = join(outputDirectory, `de-b2-${String(index + 1).padStart(2, "0")}.m4a`);
  if (existsSync(output) && statSync(output).size > 10_000 && !process.argv.includes("--force")) continue;
  const temporary = mkdtempSync(join(tmpdir(), "german-b2-audio-"));
  try {
    const wave = join(temporary, "speech.wav");
    const voice = index % 2 ? "Eddy" : "Anna";
    run("/usr/bin/say", ["-v", voice, "-r", "176", "-o", wave, "--file-format=WAVE", "--data-format=LEI16@22050", "--channels=1", germanB2Chapters[index].listening]);
    if (statSync(wave).size < 10_000) throw new Error(`Empty synthesized speech for chapter ${index + 1}`);
    run("/usr/bin/afconvert", [wave, "-o", output, "-f", "m4af", "-d", "BEI16"]);
    if (readFileSync(output).length < 10_000) throw new Error(`Empty encoded audio for chapter ${index + 1}`);
    console.log(`Chapter ${index + 1}: ${output}`);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}
