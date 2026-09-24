import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { normalizeMalformedLatexCommands } from "../lib/math-notation.ts";

describe("normalizeMalformedLatexCommands", () => {
  test("repairs a fraction command missing its leading f", () => {
    assert.equal(
      normalizeMalformedLatexCommands("Calculate \\(\\frac{3}{4} + \\rac{1}{6}\\)."),
      "Calculate \\(\\frac{3}{4} + \\frac{1}{6}\\).",
    );
  });

  test("does not change prose containing the same letters", () => {
    assert.equal(
      normalizeMalformedLatexCommands("Use \\racetrack as the label."),
      "Use \\racetrack as the label.",
    );
  });
});
