import test from "node:test";
import assert from "node:assert/strict";
import { getWritingInput, readBlankAnswer, assembleBlankAnswer, readWordAnswer, assembleWordAnswer } from "../lib/academy-writing-input.ts";

test("blank answers retain sentence context and restore both new and legacy answers", () => {
  const input = getWritingInput("Complete: Ich ___ aus Sri Lanka.");
  assert.equal(input.kind, "blanks");
  assert.deepEqual(readBlankAnswer(input.parts, ""), [""]);
  const answer = assembleBlankAnswer(input.parts, ["komme"]);
  assert.equal(answer, "Ich komme aus Sri Lanka.");
  assert.deepEqual(readBlankAnswer(input.parts, answer), ["komme"]);
  assert.deepEqual(readBlankAnswer(input.parts, "Complete: Ich komme aus Sri Lanka."), ["komme"]);
  assert.deepEqual(readBlankAnswer(input.parts, "komme"), ["komme"]);
  assert.equal(readBlankAnswer(input.parts, "Ich komme aus Spanien."), null);
  assert.equal(assembleBlankAnswer(input.parts, [""]), "");
});

test("multiple blanks and letter endings round-trip without treating punctuation as regex", () => {
  const input = getWritingInput("Ich habe ein__ Hund (___).");
  const answer = assembleBlankAnswer(input.parts, ["en", "klein"]);
  assert.equal(answer, "Ich habe einen Hund (klein).");
  assert.deepEqual(readBlankAnswer(input.parts, answer), ["en", "klein"]);
  const hint = getWritingInput("Complete: Können Sie ___ helfen? (to me)");
  assert.equal(hint.hint, "to me");
  assert.equal(assembleBlankAnswer(hint.parts, ["mir"]), "Können Sie mir helfen?");
});

test("word ordering preserves phrases, punctuation and capitalization when restoring", () => {
  const input = getWritingInput("Put in order: schön / die Tasche / ist.");
  assert.equal(input.kind, "order");
  assert.deepEqual(input.tokens, ["schön", "die Tasche", "ist"]);
  const answer = assembleWordAnswer(input.tokens, [1, 2, 0], input.punctuation);
  assert.equal(answer, "Die Tasche ist schön.");
  assert.deepEqual(readWordAnswer(input.tokens, answer), [1, 2, 0]);
  assert.deepEqual(readWordAnswer(input.tokens, "Die Tasche."), [1]);
  assert.equal(readWordAnswer(input.tokens, "Die Tasche ist sehr schön."), null);
  assert.deepEqual(readWordAnswer(["du", "du", "bist"], "Du bist du."), [0, 2, 1]);
});

test("ordinary writing and ambiguous order prompts stay text fields", () => {
  assert.deepEqual(getWritingInput("Write three sentences about your family."), { kind: "text" });
  assert.deepEqual(getWritingInput("Put in order: hello."), { kind: "text" });
});
