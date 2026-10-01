import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { existingCourseSignupReturn } from "../lib/course-pilot-auth.ts";

test("existing accounts keep their role when returning from course Google signup", () => {
  for (const role of [
    "user",
    "student",
    "parent",
    "tutor",
    "admin",
    "internal",
  ]) {
    assert.equal(
      existingCourseSignupReturn("/courses/german-a1", role, false),
      "/courses/german-a1",
    );
  }
  assert.equal(
    existingCourseSignupReturn("/courses/german-a1", null, false),
    null,
  );
  assert.equal(
    existingCourseSignupReturn("/courses/german-a1", "user", true),
    null,
  );
});
test("course signup return rejects external, malformed, and unrelated paths", () => {
  for (const next of [
    "//evil.test",
    "https://evil.test",
    "/courses/../admin",
    "/courses/foo/bar",
    "/courses/foo?next=//evil.test",
    "/dashboard/admin",
    "/courses/%2fadmin",
  ]) {
    assert.equal(existingCourseSignupReturn(next, "user", false), null);
  }
});
test("email signup and login retain the selected course without enrolling on registration", async () => {
  const source = await readFile(
    new URL("../app/login/actions.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /emailRedirectTo:.*encodeURIComponent\(nextPath/);
  assert.match(
    source,
    /nextPath \? `&next=\$\{encodeURIComponent\(nextPath\)\}`/,
  );
  assert.doesNotMatch(source, /course_pilot_join/);
  const signup = await readFile(
    new URL("../app/signup/page.tsx", import.meta.url),
    "utf8",
  );
  assert.match(signup, /formData.append\('next', nextParam\)/);
  assert.match(signup, /signInWithGoogle\(role, role, nextParam\)/);
});
