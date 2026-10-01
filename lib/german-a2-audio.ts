import { germanA2Chapters } from "./german-a2-curriculum.ts";
import { a2ExamRecordings } from "./german-a2-exam-practice.ts";
import { a2MasteryMissions } from "./german-a2-mastery.ts";

export const a2AudioVersion = "natural-v1";
export const a2AudioUrl = (id: string) => `/audio/german-a2/${id}-${a2AudioVersion}.m4a`;
export const a2AudioRecordings = [
  ...germanA2Chapters.map((chapter, index) => ({
    id: `de-a2-${String(index + 1).padStart(2, "0")}`,
    segments: [{ speaker: index % 2 ? "Eddy (German (Germany))" : "Anna", text: chapter.listening }],
  })),
  ...a2MasteryMissions.map((mission) => ({ id: mission.id, segments: [{ speaker: "Anna", text: mission.listening }] })),
  ...a2ExamRecordings,
];
export const a2SpeechInstructions = [
  "Read only the supplied text, exactly as written, in native Standard German (Germany).",
  "Perform as a real adult in an everyday conversation: warm, relaxed, clear and matter-of-fact.",
  "Use natural German sentence melody, connected phrase groups, and appropriate question intonation.",
  "Use an unhurried A2-friendly conversational pace, roughly 140–155 words per minute, without stretching syllables or pausing after every word.",
  "Preserve all dates, times, prices, negatives and corrections. Pronounce telephone digits individually when written individually.",
  "Keep the same voice and speaking manner throughout. No speaker labels, extra words, music or sound effects.",
].join(" ");
