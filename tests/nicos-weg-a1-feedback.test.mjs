import test from "node:test";
import assert from "node:assert/strict";
import { nicosWegA1Units } from "../lib/nicos-weg-a1-source.ts";
import { nicosWegA1QuestionExplanation, resolveNicosWegA1Feedback } from "../lib/nicos-weg-a1-feedback.ts";

test("every coursebook choice activity has its own grammar explanation", () => {
  for (const unit of nicosWegA1Units) unit.exercises.forEach((prompt, index) => {
    if (!prompt.match(/\(([^()]+ \/ [^()]+)\)/)) return;
    const id = `nico-a1-${String(unit.number).padStart(2, "0")}-question-${index + 1}`;
    const explanation = nicosWegA1QuestionExplanation(id, "missing");
    assert.notEqual(explanation, "missing", id);
    assert.doesNotMatch(explanation, /above|Coursebook answer/);
  });
});

test("published generic feedback is replaced while teacher edits and other courses are preserved", () => {
  const legacy = "Coursebook answer: in. Read the grammar explanation above and try the sentence aloud.";
  assert.match(resolveNicosWegA1Feedback("nico-a1-02-question-2", legacy), /Ich wohne in Berlin/);
  assert.equal(resolveNicosWegA1Feedback("nico-a1-02-question-2", "Teacher explanation"), "Teacher explanation");
  assert.equal(resolveNicosWegA1Feedback("another-question", legacy), legacy);
});
