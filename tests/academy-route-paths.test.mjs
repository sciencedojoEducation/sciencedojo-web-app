import assert from "node:assert/strict";
import { test } from "node:test";

import { resolveAcademyCourseBasePath } from "../lib/academy-route-paths.ts";

test("student course actions remain on the student route", () => {
  assert.equal(
    resolveAcademyCourseBasePath("deutsch-a1-komplett", "/dashboard/academy/deutsch-a1-komplett"),
    "/dashboard/academy/deutsch-a1-komplett",
  );
});

test("course actions reject arbitrary return paths", () => {
  assert.equal(
    resolveAcademyCourseBasePath("deutsch-a1-komplett", "https://example.com"),
    "/dashboard/tutor/academy/courses/deutsch-a1-komplett",
  );
  assert.equal(
    resolveAcademyCourseBasePath("deutsch-a1-komplett", "/dashboard/academy/another-course"),
    "/dashboard/tutor/academy/courses/deutsch-a1-komplett",
  );
});

test("the legacy tutor course keeps its original route", () => {
  assert.equal(
    resolveAcademyCourseBasePath("science-dojo-tutor-foundations"),
    "/dashboard/tutor/academy",
  );
});
