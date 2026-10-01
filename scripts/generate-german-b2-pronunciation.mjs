import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { germanB2WorkbookUnits } from "../lib/german-b2-workbook.ts";

const root = resolve(import.meta.dirname, "..");
const outputDirectory = resolve(root, "public/audio/german-b2");
mkdirSync(outputDirectory, { recursive: true });

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) throw new Error(`${command} failed with exit code ${result.status}`);
}

for (const [index, unit] of germanB2WorkbookUnits.entries()) {
  const number = String(index + 1).padStart(2, "0");
  const output = join(outputDirectory, `de-b2-${number}-pronunciation.m4a`);
  if (existsSync(output) && statSync(output).size > 10_000 && !process.argv.includes("--force")) continue;
  const temporary = mkdtempSync(join(tmpdir(), "german-b2-pronunciation-"));
  try {
    const wave = join(temporary, "speech.wav");
    run("/usr/bin/say", ["-v", index % 2 ? "Eddy" : "Anna", "-r", "154", "-o", wave,
      "--file-format=WAVE", "--data-format=LEI16@22050", "--channels=1", unit.pronunciationLine]);
    if (statSync(wave).size < 10_000) throw new Error(`Empty pronunciation speech for chapter ${number}`);
    run("/usr/bin/afconvert", [wave, "-o", output, "-f", "m4af", "-d", "BEI16"]);
    if (readFileSync(output).length < 10_000) throw new Error(`Empty pronunciation recording for chapter ${number}`);
    console.log(`Chapter ${number}: ${output}`);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}
