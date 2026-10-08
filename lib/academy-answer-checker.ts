import { getWritingInput, readBlankAnswer, readWordAnswer } from "./academy-writing-input.ts";

export type AnswerCheckSpec = {
  id: string;
  prompt: string;
  modelAnswer: string;
  acceptedAnswers: string[];
  explanation: string;
  explanationSinhala: string;
};
export type AnswerCheckResult = {
  status: "correct" | "not-matched" | "incomplete";
  capitalizationNote: boolean;
  mismatchPositions: number[];
};

export function normalizePracticeAnswer(value: string): string {
  return value.normalize("NFC").trim().replace(/\s+/gu, " ").replace(/[.!?]+$/u, "").trim();
}

function matchesAnswer(actual: string, expected: string): boolean {
  if (actual.toLocaleLowerCase("de") !== expected.toLocaleLowerCase("de")) return false;
  // Formal forms carry meaning; they are not ordinary capitalization differences.
  for (const form of ["Sie", "Ihnen"]) {
    const expectedForms = expected.match(new RegExp(`\\b${form}\\b`, "g"))?.length || 0;
    const actualForms = actual.match(new RegExp(`\\b${form}\\b`, "g"))?.length || 0;
    if (expectedForms !== actualForms) return false;
  }
  return true;
}

export function checkPracticeAnswer(spec: AnswerCheckSpec, answer: string): AnswerCheckResult {
  const empty: AnswerCheckResult = { status: "incomplete", capitalizationNote: false, mismatchPositions: [] };
  if (!answer.trim()) return empty;
  const input = getWritingInput(spec.prompt);
  let candidates = [normalizePracticeAnswer(answer)];
  if (input.kind === "blanks") {
    const normalizedParts = input.parts.map(part => part.normalize("NFC").replace(/\s+/gu, " "));
    normalizedParts[normalizedParts.length - 1] = normalizedParts[normalizedParts.length - 1].replace(/[.!?]+\s*$/u, "");
    const values = readBlankAnswer(input.parts, answer.normalize("NFC"))
      || readBlankAnswer(normalizedParts, normalizePracticeAnswer(answer.replace(/^Complete:\s*/i, "")));
    if (values) {
      if (values.some(value => !value.trim())) return empty;
      candidates = [normalizePracticeAnswer(values.join(" "))];
    }
  }
  const accepted = spec.acceptedAnswers.map(normalizePracticeAnswer);
  const matched = accepted.find(expected => candidates.some(actual => matchesAnswer(actual, expected)));
  if (matched !== undefined) return { status: "correct", capitalizationNote: !candidates.includes(matched), mismatchPositions: [] };
  if (input.kind === "order") {
    const selected = readWordAnswer(input.tokens, answer);
    if (selected && selected.length < input.tokens.length) return empty;
    if (selected) {
      const orders = spec.acceptedAnswers.map(expected => readWordAnswer(input.tokens, expected)).filter((order): order is number[] => !!order);
      const mismatches = orders.map(order => selected.flatMap((token, position) => token === order[position] ? [] : [position]));
      mismatches.sort((a, b) => a.length - b.length);
      return { status: "not-matched", capitalizationNote: false, mismatchPositions: mismatches[0] || [] };
    }
  }
  return { status: "not-matched", capitalizationNote: false, mismatchPositions: [] };
}
