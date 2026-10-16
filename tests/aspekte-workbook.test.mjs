import assert from "node:assert/strict";
import { test } from "node:test";
import { checkWorkbookPages, normaliseWorkbookAnswer, studyPage, workbookByteRange, isLocalWorkbookRequest, workbookAnswerParts, setWorkbookAnswerPart } from "../lib/aspekte-workbook.ts";

const page = {
  bookPage: 6, section: "Wortschatz", kind: "exercises", tracks: [2], warnings: [],
  exercises: [{ id: "2", instruction: "Ergänzen Sie.", mode: "fill", wordBank: [], checklist: [], modelAnswer: "Private model", solutionEvidence: "Private key", solutionPage: 146, notes: "", fields: [
    { id: "1", label: "Lücke 1", options: [], answers: ["vertraut"], evaluation: "exact" },
    { id: "2", label: "Lücke 2", options: [], answers: ["nirgends", "nirgendwo"], evaluation: "exact" },
    { id: "3", label: "Begründen Sie", options: [], answers: ["Beispiel"], evaluation: "review" },
    { id: "4", label: "Ich kann", options: ["+", "0", "-"], answers: [], evaluation: "self" },
  ] }],
};

test("fixed answers use explicit alternatives; open responses and self-review never inflate the score", () => {
  const result = checkWorkbookPages([page], { "6:2:1": " VERTRAUT. ", "6:2:2": "nirgendwo", "6:2:3": "Meine eigene Antwort", "6:2:4": "+" });
  assert.equal(result.correct, 2);
  assert.equal(result.scored, 2);
  assert.equal(result.review, 1);
  assert.equal(result.fields["6:2:3"].status, "review");
  assert.equal(result.fields["6:2:4"].status, "self");
  assert.equal(checkWorkbookPages([page], {}).fields["6:2:1"].status, "unanswered");
  assert.equal(checkWorkbookPages([page], {}).unanswered, 2);
  assert.equal(checkWorkbookPages([page], { "6:2:1": "nicht vertraut" }).fields["6:2:1"].status, "incorrect");
});

test("normalisation accepts harmless typography but retains German spelling and word order", () => {
  assert.equal(normaliseWorkbookAnswer("  Gute   Nacht! "), "gute nacht");
  assert.notEqual(normaliseWorkbookAnswer("wurde"), normaliseWorkbookAnswer("würde"));
  assert.notEqual(normaliseWorkbookAnswer("schon"), normaliseWorkbookAnswer("schön"));
  assert.notEqual(normaliseWorkbookAnswer("Ich komme nicht"), normaliseWorkbookAnswer("Ich nicht komme"));
});

test("intonation answers distinguish a full stop from a question mark", () => {
  const punctuationPage = structuredClone(page);
  punctuationPage.exercises[0].fields = [{ id: "1", label: "Frage oder Aussage?", options: [".", "?"], answers: ["?"], evaluation: "exact" }];
  assert.equal(checkWorkbookPages([punctuationPage], { "6:2:1": "." }).correct, 0);
  assert.equal(checkWorkbookPages([punctuationPage], { "6:2:1": "?" }).correct, 1);
});

test("word-search and multi-answer sets require every answer regardless of order", () => {
  const setPage = structuredClone(page);
  setPage.exercises[0].fields = [{ id: "1", label: "Alle Wörter", options: [], answers: ["Vertrag", "Karriere", "Beruf"], evaluation: "set" }];
  assert.equal(checkWorkbookPages([setPage], { "6:2:1": "Beruf; Vertrag; Karriere" }).correct, 1);
  assert.equal(checkWorkbookPages([setPage], { "6:2:1": "Beruf, Beruf, Beruf" }).correct, 0);
  assert.equal(checkWorkbookPages([setPage], { "6:2:1": "Beruf, Vertrag, Karriere, Freizeit" }).correct, 0);
});

test("separable verb blanks preserve both positions, older saved phrases, and deterministic grading", () => {
  assert.deepEqual(workbookAnswerParts("stimmte zu", 2), ["stimmte", "zu"]);
  let value = setWorkbookAnswerPart("", 2, 2, "zu");
  assert.deepEqual(workbookAnswerParts(value, 2), ["", "zu"]);
  value = setWorkbookAnswerPart(value, 2, 1, "stimmte");
  const splitPage = structuredClone(page);
  splitPage.exercises[0].fields = [{ id: "1", label: "Verb", options: [], answers: ["stimmte zu"], evaluation: "exact", segments: 2 }];
  assert.equal(checkWorkbookPages([splitPage], { "6:2:1": value }).correct, 1);
  value = setWorkbookAnswerPart(value, 2, 1, "");
  assert.equal(checkWorkbookPages([splitPage], { "6:2:1": value }).correct, 0);
  assert.equal(setWorkbookAnswerPart(value, 2, 2, ""), "");
});

test("study payload never contains correct answers, private models or answer-key excerpts before checking", () => {
  const visible = studyPage(page);
  assert.equal(visible.ready, true);
  assert.equal(visible.exercises[0].fields[0].label, "Lücke 1");
  assert.equal("answers" in visible.exercises[0].fields[0], false);
  const raw = JSON.stringify(visible);
  for (const hidden of ["Private model", "Private key", "vertraut", "nirgendwo"]) assert.ok(!raw.includes(hidden));
  assert.equal(page.exercises[0].fields[0].answers[0], "vertraut");
});

test("audio seeking supports normal, open and suffix ranges, and refuses invalid ranges", () => {
  assert.equal(workbookByteRange(null, 1000), null);
  assert.deepEqual(workbookByteRange("bytes=0-99", 1000), { start: 0, end: 99 });
  assert.deepEqual(workbookByteRange("bytes=500-", 1000), { start: 500, end: 999 });
  assert.deepEqual(workbookByteRange("bytes=-100", 1000), { start: 900, end: 999 });
  assert.deepEqual(workbookByteRange("bytes=900-1500", 1000), { start: 900, end: 999 });
  assert.deepEqual(workbookByteRange("bytes=-1500", 1000), { start: 0, end: 999 });
  for (const range of ["bytes=1000-", "bytes=50-10", "bytes=-0", "bytes=-", "bytes=0-2,5-8", "bytes=foo-2", "bytes=0.5-2"]) assert.equal(workbookByteRange(range, 1000), "invalid");
});

test("private workbook requests accept only loopback origins and reject cross-site requests", () => {
  assert.equal(isLocalWorkbookRequest("http://localhost:3000/a", "http://localhost:3000", "same-origin"), true);
  assert.equal(isLocalWorkbookRequest("http://127.0.0.1:3000/a"), true);
  assert.equal(isLocalWorkbookRequest("http://[::1]:3000/a"), true);
  assert.equal(isLocalWorkbookRequest("http://localhost.evil.test/a"), false);
  assert.equal(isLocalWorkbookRequest("https://sciencedojo.com/a"), false);
  assert.equal(isLocalWorkbookRequest("http://localhost:3000/a", "https://evil.test"), false);
  assert.equal(isLocalWorkbookRequest("http://localhost:3000/a", null, "cross-site"), false);
});
