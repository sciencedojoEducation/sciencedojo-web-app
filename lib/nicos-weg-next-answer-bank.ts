import { nicosA2Grammar, nicosB1Grammar } from "./nicos-weg-next-grammar.ts";
import type { AnswerCheckSpec } from "./academy-answer-checker.ts";

export function getNicosNextWritingCheck(courseKey: string | undefined, block: { id?: string; prompt: string; modelAnswer: string }): AnswerCheckSpec | null {
  const level = courseKey === "deutsch-nicos-weg-a2" ? "a2" : courseKey === "deutsch-nicos-weg-b1" ? "b1" : null;
  if (!level) return null;
  const match = new RegExp(`^nico-${level}-grammar-(\\d{2})-repair$`).exec(block.id || "");
  const grammar = match ? (level === "a2" ? nicosA2Grammar : nicosB1Grammar)[Number(match[1])] : null;
  if (!grammar || block.prompt !== `Correct this sentence: ${grammar.incorrect}` || block.modelAnswer !== grammar.example) return null;
  return { id: block.id!, prompt: block.prompt, modelAnswer: grammar.example, acceptedAnswers: [grammar.example], explanation: grammar.rule, explanationSinhala: grammar.sinhala };
}
