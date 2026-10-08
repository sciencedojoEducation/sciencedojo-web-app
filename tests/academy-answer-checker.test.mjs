import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { checkPracticeAnswer, normalizePracticeAnswer } from "../lib/academy-answer-checker.ts";
import { getWritingInput, assembleBlankAnswer } from "../lib/academy-writing-input.ts";
import { nicosWegA1AnswerBank, getNicosWritingCheck, getNicosChoiceCheck } from "../lib/nicos-weg-a1-answer-bank.ts";
import { academyFeedbackCapabilities, NICOS_WEG_A1_KEY } from "../lib/academy-feedback-capabilities.ts";

const spec = (unit, exercise) => nicosWegA1AnswerBank[`nico-a1-${String(unit).padStart(2, "0")}-exercise-${exercise}`];
const status = (spec, text) => checkPracticeAnswer(spec, text).status;

test("all 36 exercises have bilingual feedback and all approved answers pass without network access", t => {
  t.mock.method(globalThis, "fetch", () => { throw new Error("No network permitted"); });
  assert.equal(Object.keys(nicosWegA1AnswerBank).length, 36);
  for (const item of Object.values(nicosWegA1AnswerBank)) {
    assert.ok(item.explanation.trim(), item.id);
    assert.match(item.explanationSinhala, /[\u0D80-\u0DFF]/, item.id);
    assert.equal(status(item, ""), "incomplete");
    assert.equal(status(item, "unrecognised answer"), "not-matched");
    for (const answer of item.acceptedAnswers) assert.equal(status(item, answer), "correct", `${item.id}: ${answer}`);
    const input = getWritingInput(item.prompt);
    if (input.kind === "blanks") {
      assert.equal(status(item, assembleBlankAnswer(input.parts, [item.acceptedAnswers[0]])), "correct", item.id);
    }
  }
});

test("alternatives are accepted explicitly, including both time formats and word orders", () => {
  for (const time of ["08:30", "8:30", "20:30", "08:30 Uhr", "8:30 Uhr", "20:30 Uhr"]) assert.equal(status(spec(6, 2), time), "correct");
  for (const time of ["09:30", "21:30", "08:30 / 20:30", "830"]) assert.equal(status(spec(6, 2), time), "not-matched");
  for (const [unit, exercise, answer] of [[6, 3, "Ich arbeite morgen."], [7, 3, "Gern arbeite ich."], [12, 3, "Jeden Tag übe ich."], [9, 3, "drei Euro und zwanzig Cent"]]) {
    assert.equal(status(spec(unit, exercise), answer), "correct");
  }
});

test("blank checks accept saved words, completed sentences and normalized punctuation/spacing", () => {
  for (const answer of ["komme", "Komme.", "Ich komme aus Sri Lanka.", "Complete: Ich komme aus Sri Lanka.", "  Ich   komme aus Sri Lanka  "]) {
    assert.equal(status(spec(2, 1), answer), "correct", answer);
  }
  assert.equal(status(spec(2, 1), "Ich kommen aus Sri Lanka."), "not-matched");
  assert.equal(status(spec(2, 1), "Ich komme aus Spanien."), "not-matched");
  const input = getWritingInput(spec(3, 2).prompt);
  assert.equal(status(spec(3, 2), assembleBlankAnswer(input.parts, ["mir"])), "correct");
  const multiple = { ...spec(2, 1), prompt: "Ich ___ aus ___ Spanien.", acceptedAnswers: ["komme dem"] };
  assert.equal(status(multiple, "Ich komme aus  Spanien."), "incomplete");
});

test("umlauts and sharp s stay meaningful; capitalization is a note except formal forms", () => {
  assert.equal(status(spec(4, 2), "mochte"), "not-matched");
  assert.equal(status(spec(4, 2), "moechte"), "not-matched");
  assert.equal(status(spec(4, 2), "mo\u0308chte"), "correct");
  assert.equal(checkPracticeAnswer(spec(9, 3), "Drei euro zwanzig").capitalizationNote, true);
  assert.equal(status(spec(1, 3), "wie geht es Ihnen"), "correct");
  assert.equal(status(spec(1, 3), "Wie geht es ihnen?"), "not-matched");
  assert.equal(status(spec(11, 1), "Haben sie einen Termin?"), "not-matched");
  const sharpS = { ...spec(2, 1), prompt: "Write Straße.", acceptedAnswers: ["Straße"] };
  assert.equal(status(sharpS, "Strasse"), "not-matched");
  assert.equal(normalizePracticeAnswer("  schön  ist\n die Tasche. "), "schön ist die Tasche");
});

test("ordering reports incomplete selection and compares positions to the closest approved arrangement", () => {
  assert.equal(status(spec(1, 2), "Die Tasche ist."), "incomplete");
  assert.deepEqual(checkPracticeAnswer(spec(1, 2), "Die Tasche schön ist.").mismatchPositions, [1, 2]);
  assert.deepEqual(checkPracticeAnswer(spec(12, 3), "Jeden Tag ich übe.").mismatchPositions, [1, 2]);
  assert.deepEqual(checkPracticeAnswer(spec(12, 3), "Jeden Tag übe ich.").mismatchPositions, []);
});

test("published exercises are eligible while edited, unknown or other-course exercises fall back to self-review", () => {
  const original = spec(2, 1);
  assert.equal(getNicosWritingCheck(NICOS_WEG_A1_KEY, original), original);
  assert.equal(getNicosWritingCheck(NICOS_WEG_A1_KEY, { ...original, prompt: "Teacher's new task" }), null);
  assert.equal(getNicosWritingCheck(NICOS_WEG_A1_KEY, { ...original, modelAnswer: "gehe" }), null);
  const ordering = spec(1, 2);
  assert.equal(getNicosWritingCheck(NICOS_WEG_A1_KEY, { ...ordering, prompt: ordering.prompt.replace(/\.$/, "?") }), null);
  assert.equal(getNicosWritingCheck("german-b2-complete", original), null);
  const choice = spec(2, 2);
  const question = { id: "nico-a1-02-question-2", prompt: choice.prompt, options: [{ id: "a", label: "aus" }, { id: "b", label: "in" }], correctOptionId: "b", explanation: "Custom teacher explanation" };
  assert.equal(getNicosChoiceCheck(NICOS_WEG_A1_KEY, choice.id, question), choice);
  assert.equal(getNicosChoiceCheck(NICOS_WEG_A1_KEY, choice.id, { ...question, correctOptionId: "a" }), null);
  assert.equal(getNicosChoiceCheck(NICOS_WEG_A1_KEY, choice.id, { ...question, options: [...question.options].reverse() }), null);
});

test("shared capability pauses Nicos Gemini in UI and API without disabling other German courses", () => {
  assert.deepEqual(academyFeedbackCapabilities(NICOS_WEG_A1_KEY), { instantAnswers: true, guidedSelfReview: true, aiFeedback: false });
  assert.equal(academyFeedbackCapabilities("german-b2-complete").aiFeedback, true);
  assert.equal(academyFeedbackCapabilities("unknown").aiFeedback, false);
  const route = readFileSync(new URL("../app/api/academy/language-feedback/route.ts", import.meta.url), "utf8");
  assert.ok(route.indexOf("!academyFeedbackCapabilities(courseKey).aiFeedback") < route.indexOf("const apiKey = process.env.GEMINI_API_KEY"));
  const ui = readFileSync(new URL("../components/tutor-academy/AcademyLanguagePractice.tsx", import.meta.url), "utf8");
  assert.match(ui, /capabilities\.aiFeedback \? <AcademyPracticeFeedback/);
  assert.match(ui, /academyFeedbackCapabilities\(courseKey\)\.aiFeedback && !recording/);
});

test("actual feedback route rejects signed-in Nicos text and recording requests before any provider call", async () => {
  const source = readFileSync(new URL("../app/api/academy/language-feedback/route.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  let providerCalls = 0;
  let contextCalls = 0;
  const exports = {};
  const modules = {
    "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
    "@/utils/supabase/server": { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: "test-user" } } }) } }) },
    "@/lib/academy-courses": {},
    "@/lib/tutor-academy-progress": { requireTutorAcademyUser: async () => { contextCalls++; throw new Error("Not needed for a paused feature"); } },
    "@/lib/academy-journey": {},
    "@/lib/german-academy-course": { isGermanAcademyCourse: key => key === NICOS_WEG_A1_KEY },
    "@/lib/academy-recording": {},
    "@/lib/academy-feedback-capabilities": { academyFeedbackCapabilities },
    "@/lib/academy-language-feedback": { generateAcademyLanguageFeedback: async () => { providerCalls++; throw new Error("Provider must not be called"); } },
  };
  runInNewContext(compiled, { exports, require: name => { assert.ok(name in modules, name); return modules[name]; }, Buffer, URL, Request, Response, File, console, process: { env: {} } });
  for (const recording of [false, true]) {
    const form = new FormData();
    form.set("courseKey", NICOS_WEG_A1_KEY);
    if (recording) form.set("audio", new Blob(["synthetic test audio"], { type: "audio/webm" }), "test.webm");
    else form.set("text", "Ich komme aus Sri Lanka.");
    const response = await exports.POST(new Request("http://localhost:3000/api/academy/language-feedback", { method: "POST", headers: { origin: "http://localhost:3000" }, body: form }));
    assert.equal(response.status, 503);
    assert.match((await response.json()).message, /AI feedback is paused/);
  }
  assert.equal(contextCalls, 0);
  assert.equal(providerCalls, 0);
});
