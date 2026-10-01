import { existsSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { germanA1VocabularyImage } from "../lib/german-a1-vocabulary-image.ts";

const root = resolve(import.meta.dirname, "..");
const sourceDirectory = join(root, "public", "images", "academy", "german-a1", "wortschatz");
const outputDirectory = join(root, "public", "images", "academy", "german-a1", "word-cards");

mkdirSync(outputDirectory, { recursive: true });

for (let chapter = 1; chapter <= 32; chapter += 1) {
  const chapterNumber = String(chapter).padStart(2, "0");
  const source = join(sourceDirectory, `chapter-${chapterNumber}.jpg`);
  if (!existsSync(source)) throw new Error(`Missing vocabulary sheet: ${source}`);

  for (let index = 0; index < 25; index += 1) {
    const illustration = germanA1VocabularyImage(
      `/images/academy/german-a1/word-cards/chapter-${chapterNumber}-${String(index + 1).padStart(2, "0")}.jpg`,
    );
    if (!illustration) throw new Error(`Missing measured bounds for chapter ${chapterNumber}, card ${index + 1}`);
    const output = join(
      outputDirectory,
      `chapter-${chapterNumber}-${String(index + 1).padStart(2, "0")}.jpg`,
    );
    const result = spawnSync(
      "/usr/bin/sips",
      [
        "--cropToHeightWidth",
        String(illustration.height),
        String(illustration.width),
        "--cropOffset",
        String(illustration.top),
        String(illustration.left),
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

console.log(`Created 800 proportion-preserving vocabulary images using measured sheet boundaries in ${outputDirectory}`);
