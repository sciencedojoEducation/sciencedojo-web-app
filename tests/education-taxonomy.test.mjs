import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  buildEducationSelectionSnapshot,
  getAwardingBodiesForSelection,
  getDerivedAwardingBody,
  getStagesForCurriculum,
  resolveSpecificationVersion,
  validateEducationSelection,
} from "../lib/educationTaxonomy.ts";

describe("curriculum-aware education taxonomy", () => {
  test("does not ask KS1-KS3 learners for an exam board", () => {
    assert.deepEqual(getAwardingBodiesForSelection("england", "ks3"), []);
    assert.equal(validateEducationSelection({
      curriculumKey: "england",
      stage: "ks3",
      subject: "Physics",
      topic: "Energy",
    }, { topicRequired: true }).valid, true);
  });

  test("requires a compatible awarding body for examined English qualifications", () => {
    const missing = validateEducationSelection({ curriculumKey: "england", stage: "gcse", subject: "Physics", topic: "Energy" });
    assert.equal(missing.valid, false);

    const incompatible = validateEducationSelection({ curriculumKey: "england", stage: "gcse", awardingBodyKey: "ccea", subject: "Physics", topic: "Energy" });
    assert.equal(incompatible.valid, false);

    const valid = validateEducationSelection({ curriculumKey: "england", stage: "gcse", awardingBodyKey: "aqa", subject: "Physics", topic: "Energy" });
    assert.equal(valid.valid, true);

    const unavailableSubject = validateEducationSelection({ curriculumKey: "england", stage: "gcse", awardingBodyKey: "aqa", subject: "Accounting" });
    assert.equal(unavailableSubject.valid, false);
  });

  test("keeps Cambridge International distinct from OCR", () => {
    assert.equal(getDerivedAwardingBody("cambridge_international", "igcse"), "cambridge_international");
    assert.equal(validateEducationSelection({ curriculumKey: "cambridge_international", stage: "igcse", awardingBodyKey: "ocr", subject: "Physics", level: "core" }).valid, false);
  });

  test("flags an uncertain route instead of inventing curriculum data", () => {
    const result = buildEducationSelectionSnapshot({ curriculumKey: "not_sure", stage: "not_sure", subject: "Physics" });
    assert.equal(result.error, null);
    assert.equal(result.snapshot?.intakeStatus, "needs_clarification");
    assert.deepEqual(result.snapshot?.missingFields, ["curriculum", "stage"]);
    assert.equal(result.snapshot?.curriculumKey, null);
    assert.equal(result.snapshot?.specificationVersionId, null);
  });

  test("uses the assessment year when resolving a specification version", () => {
    const id = resolveSpecificationVersion({
      curriculumKey: "england",
      stage: "gcse",
      awardingBodyKey: "ocr",
      subject: "Mathematics",
      subjectVariant: "mathematics",
      level: "higher",
      assessmentDate: "2027-06-10",
    });
    assert.match(id || "", /2027$/);
  });

  test("includes every requested international programme family", () => {
    assert.ok(getStagesForCurriculum("cambridge_international").some((item) => item.key === "international_a_level"));
    assert.ok(getStagesForCurriculum("pearson_international").some((item) => item.key === "international_gcse"));
    assert.ok(getStagesForCurriculum("ib").some((item) => item.key === "dp"));
  });
});
