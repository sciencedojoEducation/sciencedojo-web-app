import { existsSync, mkdirSync, mkdtempSync, statSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { germanA2Chapters } from "../lib/german-a2-curriculum.ts";
import { a2ExamRecordings } from "../lib/german-a2-exam-practice.ts";
import { a2MasteryMissions } from "../lib/german-a2-mastery.ts";

const root = resolve(import.meta.dirname, "..");
const outputDirectory = resolve(root, "public/audio/german-a2");
const recordings = [
  ...germanA2Chapters.map((chapter, index) => ({
    id: `de-a2-${String(index + 1).padStart(2, "0")}`,
    segments: [{ speaker: index % 2 ? "Eddy (German (Germany))" : "Anna", text: chapter.listening }],
  })),
  ...a2MasteryMissions.map((mission) => ({ id: mission.id, segments: [{ speaker: "Anna", text: mission.listening }] })),
  ...a2ExamRecordings,
];
const start = Number(process.argv.find((arg) => arg.startsWith("--start="))?.split("=")[1] || 0);
const count = Number(process.argv.find((arg) => arg.startsWith("--count="))?.split("=")[1] || recordings.length - start);
if (!Number.isInteger(start) || start < 0 || !Number.isInteger(count) || count < 1 || start + count > recordings.length)
  throw new Error(`Use a valid --start and --count within ${recordings.length} recordings.`);
mkdirSync(outputDirectory, { recursive: true });
function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) throw new Error(`${command} failed (${result.error?.message || result.status}).`);
}
for (const recording of recordings.slice(start, start + count)) {
  const output = join(outputDirectory, `${recording.id}.m4a`);
  if (existsSync(output) && statSync(output).size > 10_000 && !process.argv.includes("--force")) continue;
  const temporary = mkdtempSync(join(tmpdir(), "german-a2-audio-"));
  try {
    const segments = recording.segments.map((segment, index) => {
      const path = join(temporary, `segment-${index}.wav`);
      run("/usr/bin/say", ["-v", segment.speaker, "-r", "145", "-o", path, "--file-format=WAVE", "--data-format=LEI16@22050", "--channels=1", segment.text]);
      if (statSync(path).size < 10_000) throw new Error(`Empty speech for ${recording.id}.`);
      return path;
    });
    const wave = join(temporary, "joined.wav");
    // Standard-library wave joins PCM segments and inserts pauses between speakers.
    run("/usr/bin/python3", ["-c", `import sys,wave
with wave.open(sys.argv[1], 'wb') as out:
    for index,path in enumerate(sys.argv[2:]):
        with wave.open(path, 'rb') as part:
            if index == 0: out.setparams(part.getparams())
            if (part.getnchannels(),part.getsampwidth(),part.getframerate()) != (out.getnchannels(),out.getsampwidth(),out.getframerate()):
                raise ValueError('Audio segment formats differ')
            out.writeframes(part.readframes(part.getnframes()))
            out.writeframes(bytes(int(part.getframerate()*0.8)*part.getnchannels()*part.getsampwidth()))`, wave, ...segments]);
    run("/usr/bin/afconvert", [wave, "-o", output, "-f", "m4af", "-d", "aac", "-b", "64000"]);
    if (statSync(output).size < 10_000) throw new Error(`Empty encoded audio for ${recording.id}.`);
    console.log(`Created ${recording.id}.m4a`);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}
