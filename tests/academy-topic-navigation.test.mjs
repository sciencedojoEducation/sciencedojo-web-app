import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { shouldCollapseAcademyTopicNavigator, shouldDockAcademyTopicNavigator } from "../lib/academy-topic-navigation.ts";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("topic controls dock after the inline bar, not above or outside the lesson", () => {
  assert.equal(shouldDockAcademyTopicNavigator(200, 2000), false);
  assert.equal(shouldDockAcademyTopicNavigator(-112, 2000), false);
  assert.equal(shouldDockAcademyTopicNavigator(-113, 2000), true);
  assert.equal(shouldDockAcademyTopicNavigator(-500, 160), false);
  assert.equal(shouldDockAcademyTopicNavigator(-500, -200), false);
});

test("opened topic menu collapses on downward reading, not minor jitter or upward scroll", () => {
  assert.equal(shouldCollapseAcademyTopicNavigator(true, 1000, 1000), false);
  assert.equal(shouldCollapseAcademyTopicNavigator(true, 1048, 1000), false);
  assert.equal(shouldCollapseAcademyTopicNavigator(true, 1049, 1000), true);
  assert.equal(shouldCollapseAcademyTopicNavigator(true, 980, 1000), false);
  assert.equal(shouldCollapseAcademyTopicNavigator(false, 1000, 1000), true);
});

test("collapsing preserves controls, removes hidden keyboard targets, and supports dismiss/focus restoration", () => {
  const component = read("components/tutor-academy/AcademyTopicNavigator.tsx");
  assert.match(component, /aria-expanded=\{open\}/);
  assert.match(component, /aria-controls=\{panelId\}/);
  assert.match(component, /inert=\{docked && !open\}/);
  assert.match(component, /event.key === "Escape"/);
  assert.match(component, /focus\(\{ preventScroll: true \}\)/);
  assert.match(component, /const docked = true;/);
  assert.doesNotMatch(component, /shouldDockAcademyTopicNavigator|setDocked/);
  assert.match(component, /removeEventListener\("scroll", update\)/);
  const journey = read("components/tutor-academy/AcademyLessonJourney.tsx");
  assert.match(journey, /<AcademyTopicNavigator startRef=\{topicStart\} navigatorRef=\{navigator\}/);
  assert.doesNotMatch(journey, /sticky top-16/);
});

test("dock remains mobile sized, smoothly expands and respects reduced motion", () => {
  const css = read("app/globals.css");
  assert.match(css, /width: min\(38rem, calc\(100vw - 2rem\)\)/);
  assert.match(css, /transition: width 280ms/);
  assert.match(css, /grid-template-rows 280ms/);
  assert.match(css, /prefers-reduced-motion: reduce\)\s*\{\s*\.academy-topic-nav[\s\S]*?animation: none; transition: none;/);
});
