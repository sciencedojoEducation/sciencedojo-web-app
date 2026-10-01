import type { AcademyCourse, LessonBlock } from "./tutor-academy.ts";
import { germanA1Pronunciation } from "./german-a1-pronunciation.ts";
import { germanA1FullMockBlocks } from "./german-a1-full-mock.ts";

/** Prepared candidate only. Do not seed until every referenced recording exists. */
export function buildGermanA1ListeningUpgrade(course: AcademyCourse): AcademyCourse {
  const candidate = structuredClone(course);
  const core = candidate.lessons.filter(lesson => !lesson.examTrack);
  if (core.length !== 15) throw new Error("The listening upgrade expects the current fifteen-chapter A1 route.");
  for (const lesson of core) {
    const number = Number(lesson.id?.match(/^lesson-de-a1-(?:route-)?(\d{2})$/)?.[1]);
    const track = germanA1Pronunciation[number - 1];
    if (!track) throw new Error(`Unknown A1 core lesson ID: ${lesson.id}`);
    const prefix = `a1-sounds-${String(track.chapter).padStart(2, "0")}`;
    const expectedIds = ["strategy", "audio", "record"].map(suffix => `${prefix}-${suffix}`);
    const existingCount = lesson.blocks.filter(block => expectedIds.includes(block.id || "")).length;
    if (existingCount === 3) continue;
    if (existingCount) throw new Error(`Partial sound upgrade in ${lesson.id}; review before merging.`);
    const additions: LessonBlock[] = [
      { id: `${prefix}-strategy`, type: "text", heading: `Aussprache · ${track.focus}`,
        paragraphs: [track.tip, "Hören Sie erst ohne Transcript. Hören Sie dann noch einmal, pausieren Sie nach einer Wortgruppe und sprechen Sie nach. Zuletzt sprechen Sie ohne die Aufnahme. Verständlichkeit ist wichtiger als ein perfekter Akzent."] },
      { id: `${prefix}-audio`, type: "audio", heading: "Hören und nachsprechen · kurze Klangübung",
        url: track.outputPath, transcript: track.transcript, caption: "Originalübung mit unterschiedlichen KI-generierten deutschen Stimmen. Sie können jederzeit pausieren und wiederholen." },
      { id: `${prefix}-record`, type: "speaking-practice", heading: "Aussprache · hören, nachsprechen, aufnehmen",
        prompt: `${track.tip} Nehmen Sie beide kurzen Wortgruppen oder Sätze auf. Vergleichen Sie Ihre Aufnahme mit dem Hörbeispiel. Wiederholen Sie danach einen Satz mit anderen Angaben. Die Aufnahme ist selbst überprüfte Übung, keine automatische Aussprachebewertung.`,
        preparationSeconds: 20, targetSeconds: 30,
        modelAnswer: track.lines.join(" "), checklist: ["Ich spreche verständlich in kurzen Wortgruppen.", "Ich vergleiche Klang oder Satzmelodie mit dem Beispiel.", "Ich versuche eine eigene Variante ohne abzulesen."], completion: "view" },
    ];
    const audioIndex = lesson.blocks.findIndex(block => block.type === "audio");
    if (audioIndex < 0) throw new Error(`Main listening track missing in ${lesson.id}`);
    lesson.blocks.splice(audioIndex + 1, 0, ...additions);
    lesson.durationMinutes += 5;
    candidate.estimatedMinutes += 5;
  }
  const mock = candidate.lessons.find(lesson => lesson.slug === "a1-goethe-06");
  if (!mock) throw new Error("Goethe simulation lesson missing.");
  const mockBlocks = germanA1FullMockBlocks();
  const existingMockCount = mockBlocks.filter(block => mock.blocks.some(item => item.id === block.id)).length;
  if (existingMockCount && existingMockCount !== mockBlocks.length)
    throw new Error("Partial full mock in draft; review before merging.");
  if (!existingMockCount) mock.blocks.push(...mockBlocks);
  return candidate;
}
