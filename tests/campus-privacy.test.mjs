import { test } from "node:test";
import assert from "node:assert/strict";
import {
  campusNeedsFreshDocument,
  isPrivateStudyPath,
  isPrivateStudyLocation,
} from "../lib/private-study.ts";
import { trackEvent } from "../lib/analytics.ts";

test("study privacy covers exact routes, nested paths and auth returns without swallowing unrelated routes", () => {
  for (const path of [
    "/campus",
    "/campus?mode=quiet",
    "/dashboard/academy",
    "/dashboard/academy/one",
    "/dashboard/student",
    "/dashboard/user?view=home",
    "/dashboard/internal/projects",
    "/workbooks/aspekte-neu-b2",
  ])
    assert.equal(isPrivateStudyPath(path), true, path);
  for (const path of [
    "/campus-events",
    "/dashboard-news",
    "/courses",
    "/business",
  ])
    assert.equal(isPrivateStudyPath(path), false, path);
  for (const path of [
    "/campus",
    "/login?next=%2Fcampus%3Fmode%3Dquiet",
    "/signup?next=%2Fdashboard%2Facademy%2Fone",
    "/login?next=%2Fdashboard%2Fstudent",
  ])
    assert.equal(
      isPrivateStudyLocation(`https://example.test${path}`),
      true,
      path,
    );
  assert.equal(
    isPrivateStudyLocation("https://example.test/login?next=%2Fbusiness"),
    false,
  );
});

test("campus requires a fresh document after SPA entry or earlier marketing initialization", () => {
  const campus = "https://example.test/campus";
  assert.equal(
    campusNeedsFreshDocument(campus, "https://example.test/", false),
    true,
  );
  assert.equal(campusNeedsFreshDocument(campus, campus, true), true);
  assert.equal(campusNeedsFreshDocument(campus, campus, false), false);
  assert.equal(campusNeedsFreshDocument(campus, undefined, false), false);
  assert.equal(
    campusNeedsFreshDocument(
      "https://example.test/business",
      "https://example.test/",
      true,
    ),
    false,
  );
});

test("manual analytics cannot send study events through a previously initialized gtag", () => {
  const original = globalThis.window,
    calls = [];
  try {
    globalThis.window = {
      location: { href: "https://example.test/campus" },
      gtag: (...args) => calls.push(args),
    };
    trackEvent("course_selected", { course: "private-course-canary" });
    globalThis.window.location.href =
      "https://example.test/dashboard/academy/one";
    trackEvent("answer_saved", { answer: "private-answer-canary" });
    globalThis.window.location.href="https://example.test/dashboard/student";
    trackEvent("dashboard_opened",{detail:"private-dashboard-canary"});
    assert.deepEqual(calls, []);
    globalThis.window.location.href = "https://example.test/business";
    trackEvent("public_example_open", { source: "business" });
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0], [
      "event",
      "public_example_open",
      { source: "business" },
    ]);
  } finally {
    if (original === undefined) delete globalThis.window;
    else globalThis.window = original;
  }
});
