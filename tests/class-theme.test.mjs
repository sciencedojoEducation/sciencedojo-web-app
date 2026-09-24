import assert from "node:assert/strict";
import test from "node:test";
import { getClassSubjectTheme } from "../lib/class-theme.ts";

test("core subjects have distinct, stable class banner identities", () => {
  const subjects = ["Mathematics", "Physics", "Chemistry", "Biology", "Economics", "Computer Science", "Science"];
  const themes = subjects.map((subject) => getClassSubjectTheme(subject));

  assert.equal(new Set(themes.map((theme) => theme.bannerColor)).size, subjects.length);
  assert.equal(new Set(themes.map((theme) => theme.artwork)).size, subjects.length);
  assert.equal(getClassSubjectTheme("Algebra").bannerColor, getClassSubjectTheme("Mathematics").bannerColor);
});

test("custom tutor cover colors do not change the subject banner identity", () => {
  const defaultTheme = getClassSubjectTheme("Mathematics");
  const customizedTheme = getClassSubjectTheme("Mathematics", "#ec4899");

  assert.notEqual(customizedTheme.color, defaultTheme.color);
  assert.equal(customizedTheme.bannerColor, defaultTheme.bannerColor);
  assert.equal(customizedTheme.artwork, defaultTheme.artwork);
});
