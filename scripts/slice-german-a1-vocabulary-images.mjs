import { existsSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sourceDirectory = join(root, "public", "images", "academy", "german-a1", "wortschatz");
const outputDirectory = join(root, "public", "images", "academy", "german-a1", "word-cards");
const sheetSize = 1254;
const gridSize = 5;
const inset = 6;

mkdirSync(outputDirectory, { recursive: true });

for (let chapter = 1; chapter <= 32; chapter += 1) {
  const chapterNumber = String(chapter).padStart(2, "0");
  const source = join(sourceDirectory, `chapter-${chapterNumber}.jpg`);
  if (!existsSync(source)) throw new Error(`Missing vocabulary sheet: ${source}`);

  for (let index = 0; index < 25; index += 1) {
    const row = Math.floor(index / gridSize);
    const column = index % gridSize;
    const left = Math.round((column * sheetSize) / gridSize) + inset;
    const top = Math.round((row * sheetSize) / gridSize) + inset;
    const right = Math.round(((column + 1) * sheetSize) / gridSize) - inset;
    const bottom = Math.round(((row + 1) * sheetSize) / gridSize) - inset;
    const size = Math.min(right - left, bottom - top);
    const output = join(
      outputDirectory,
      `chapter-${chapterNumber}-${String(index + 1).padStart(2, "0")}.jpg`,
    );
    const result = spawnSync(
      "/usr/bin/sips",
      [
        "--cropToHeightWidth",
        String(size),
        String(size),
        "--cropOffset",
        String(top),
        String(left),
        "--setProperty",
        "formatOptions",
        "82",
        source,
        "--out",
        output,
      ],
      { stdio: "ignore" },
    );
    if (result.status !== 0) throw new Error(`Could not crop ${output}`);
  }
}

console.log(`Created 800 centred vocabulary images in ${outputDirectory}`);
