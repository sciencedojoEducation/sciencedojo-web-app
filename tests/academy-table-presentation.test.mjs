import assert from "node:assert/strict";
import { test } from "node:test";
import { academyTableColumnPresentation } from "../lib/academy-table-presentation.ts";

test("both alphabet letter columns are labels and reference cells have no checkmarks", () => {
  const columns = ["Buchstabe", "Deutscher Name", "Buchstabe", "Deutscher Name"];
  assert.deepEqual(columns.map((_, index) => academyTableColumnPresentation(columns, index)), [
    { isLabel: true, showCheck: false },
    { isLabel: false, showCheck: false },
    { isLabel: true, showCheck: false },
    { isLabel: false, showCheck: false },
  ]);
});

test("ordinary comparison tables retain their existing label and checkmark treatment", () => {
  const columns = ["Option", "Guidance", "Example"];
  assert.deepEqual(columns.map((_, index) => academyTableColumnPresentation(columns, index)), [
    { isLabel: true, showCheck: false },
    { isLabel: false, showCheck: true },
    { isLabel: false, showCheck: true },
  ]);
});

test("repeated labels tolerate capitalization and surrounding whitespace", () => {
  const columns = ["Buchstabe", "Name", " BUCHSTABE ", "Name"];
  assert.deepEqual(academyTableColumnPresentation(columns, 2), { isLabel: true, showCheck: false });
});
