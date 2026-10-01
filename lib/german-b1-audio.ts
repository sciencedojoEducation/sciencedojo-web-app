import { germanB1Chapters } from "./german-b1-curriculum.ts";
import { b1ExamListening } from "./german-b1-exam-practice.ts";
import { b1FreshListening } from "./german-b1-fresh-exam.ts";

export const b1AudioVersion = "natural-v1";
export const b1AudioUrl = (id: string) => `/audio/german-b1/${id}-${b1AudioVersion}.m4a`;
export const b1AudioRecordings = [
  ...germanB1Chapters.map((chapter, index) => ({
    id: `de-b1-${String(index + 1).padStart(2, "0")}`,
    segments: [{ speaker: index % 2 ? "Eddy (German (Germany))" : "Anna", text: chapter.listening }],
  })),
  ...b1ExamListening,
  ...b1FreshListening,
];
export const b1AudioTranscript = (recording: typeof b1AudioRecordings[number]) =>
  recording.segments.map(segment => recording.id.startsWith("b1-fresh-")
    ? `${segment.speaker === "Anna" ? "Sprecherin" : "Sprecher"}: ${segment.text}` : segment.text).join("\n\n");
export const b1SpeechInstructions = [
  "Read only the supplied text, exactly as written, in native Standard German (Germany).",
  "Perform as a real adult in an everyday conversation: warm, relaxed, clear and matter-of-fact.",
  "Use natural German sentence melody, connected phrase groups, and appropriate question intonation.",
  "Use a clear B1 conversational pace, roughly 150–165 words per minute, without stretching syllables or pausing after every word.",
  "Preserve all dates, times, prices, negatives and corrections. Pronounce telephone digits individually when written individually.",
  "Keep the same voice and speaking manner throughout. No speaker labels, extra words, music or sound effects.",
].join(" ");
