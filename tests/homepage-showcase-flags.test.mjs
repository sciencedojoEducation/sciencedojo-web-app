import assert from "node:assert/strict";
import { test } from "node:test";

import { getShowcaseCta, getVisibleShowcaseItems } from "../lib/product-showcase.ts";

const flags = {
  parent_dashboard_enabled: false,
  student_dashboard_enabled: false,
  tutor_dashboard_enabled: false,
  booking_enabled: false,
  free_assessment_enabled: false,
  tutor_marketplace_enabled: false,
  practice_dojo_enabled: false,
  focus_dojo_enabled: false,
  tutor_applications_enabled: false,
};

test("showcase hides all roles when their features are unavailable", () => {
  assert.deepEqual(getVisibleShowcaseItems(flags), []);
});

test("showcase selects the first available role when the parent route is unavailable", () => {
  const available = getVisibleShowcaseItems({ ...flags, student_dashboard_enabled: true });
  assert.deepEqual(available.map((item) => item.role), ["student"]);
});

test("showcase retains parent, student, tutor order when each route is available", () => {
  const available = getVisibleShowcaseItems({
    ...flags,
    parent_dashboard_enabled: true,
    student_dashboard_enabled: true,
    tutor_dashboard_enabled: true,
    booking_enabled: true,
  });
  assert.deepEqual(available.map((item) => item.role), ["parent", "student", "tutor"]);
});

test("showcase calls to action follow enabled destinations", () => {
  assert.equal(getShowcaseCta("parent", flags), null);
  assert.equal(getShowcaseCta("student", flags), null);
  assert.deepEqual(getShowcaseCta("tutor", flags), {
    href: "/support/tutors", label: "Explore tutor support",
  });
  assert.deepEqual(getShowcaseCta("parent", { ...flags, free_assessment_enabled: true }), {
    href: "/free-assessment", label: "Request a free assessment",
  });
  assert.deepEqual(getShowcaseCta("parent", { ...flags, tutor_marketplace_enabled: true }), {
    href: "/find-tutors", label: "Find a tutor",
  });
  assert.deepEqual(getShowcaseCta("student", { ...flags, practice_dojo_enabled: true }), {
    href: "/ai-practice-studio", label: "Try free practice",
  });
  assert.deepEqual(getShowcaseCta("tutor", { ...flags, tutor_applications_enabled: true }), {
    href: "/tutor/onboarding", label: "Apply to tutor",
  });
});
