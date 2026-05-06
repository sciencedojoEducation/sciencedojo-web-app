export type GeneratedQuestion = {
  question: string;
  answer: string;
  working: string;
  skill: string;
  difficulty: string;
};

export type QuestionGeneratorResult = {
  status: "idle" | "success" | "error";
  message?: string;
  questions: GeneratedQuestion[];
  source?: "llm" | "fallback";
};
