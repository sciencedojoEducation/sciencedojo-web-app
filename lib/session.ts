export type SessionMode = "focus" | "exam";

export type SessionPhase =
  | "name"
  | "session-welcome"
  | "mode-select"
  | "focus-setup"
  | "exam-setup"
  | "transition"
  | "immersive"
  | "break"
  | "ready-prompt"
  | "long-break"
  | "cycle-complete"
  | "summary";

export type SessionConfig = {
  mode: SessionMode;
  /** Exam: total session length. Focus: focus-block length. */
  durationMinutes: number;
  /** Focus mode only. */
  breakMinutes?: number;
  /** Focus mode only. */
  rounds?: number;
  /** Chosen sound environment id, or null for silence. */
  soundEnvironmentId: string | null;
};

export type SessionSummary = {
  mode: SessionMode;
  plannedSeconds: number;
  completedSeconds: number;
  finishedNaturally: boolean;
  pausesUsed: number;
  roundsCompleted: number;
  totalRounds: number;
};

export const FOCUS_DEFAULT = 25;
export const EXAM_DEFAULT = 90;
export const BREAK_MINUTES = 5;
export const FOCUS_ROUNDS = 4;
export const LONG_BREAK_MINUTES = 15;

export const TRANSITION_MS = 900;

export type PracticeType =
  | "past-paper"
  | "topic-test"
  | "mock-exam"
  | "question-set";

export const PRACTICE_TYPES: { id: PracticeType; label: string }[] = [
  { id: "past-paper", label: "Past paper" },
  { id: "topic-test", label: "Topic test" },
  { id: "mock-exam", label: "Mock exam" },
  { id: "question-set", label: "Question set" },
];
