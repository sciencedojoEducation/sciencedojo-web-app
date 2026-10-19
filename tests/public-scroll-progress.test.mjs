import assert from "node:assert/strict";
import { test } from "node:test";
import { showsPublicScrollProgress } from "../lib/public-scroll-progress.ts";

test("public marketing, articles, profiles and both business arms keep scroll progress", () => {
  for (const path of ["/", "/about", "/privacy", "/terms", "/how-it-works", "/contact",
    "/business", "/business/instructional-design", "/business/engineering#contact", "/learning-hub/article?ref=sample",
    "/community/news/update", "/courses/example", "/t/example", "/tutor/example",
    "/online-physics-tutor", "/dashboard-guide"]) {
    assert.equal(showsPublicScrollProgress(path), true, path);
  }
});

test("private study, dashboards, admin and account/application journeys have no indicator", () => {
  for (const path of ["/dashboard", "/dashboard/student", "/dashboard/admin/users?tab=sample",
    "/workbooks", "/workbooks/aspekte-neu-b2#study", "/campus", "/campus/hosting-check",
    "/academy/deutsch-b2-story", "/academy/review/sample", "/admin/leads", "/admin",
    "/login", "/login/internal", "/signup/child-details", "/auth/callback",
    "/forgot-password", "/reset-password", "/tutor/onboarding", "/tutor/contract",
    "/tutor/example/book", "/tutor/example/book/success", "/maintenance"]) {
    assert.equal(showsPublicScrollProgress(path), false, path);
  }
});

test("an unresolved location starts without document-reading effects", () => {
  assert.equal(showsPublicScrollProgress(null), false);
  assert.equal(showsPublicScrollProgress(""), false);
});
