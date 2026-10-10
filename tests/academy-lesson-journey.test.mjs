import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as lessonRoadmap from "../lib/academy-lesson-roadmap.ts";
import * as tutorAcademy from "../lib/tutor-academy.ts";
import * as germanAcademy from "../lib/german-academy-course.ts";
import * as nicosCourse from "../lib/nicos-weg-course.ts";
import * as memoryAids from "../lib/nicos-weg-a1-memory-aids.ts";
import * as academyVideo from "../lib/academy-video.ts";
import * as tablePresentation from "../lib/academy-table-presentation.ts";
import * as sentencePractice from "../lib/nicos-weg-a1-sentence-practice.ts";
import { germanA1RestructuredCourse } from "../lib/german-a1-restructured-course.ts";
import { germanA2Course } from "../lib/german-a2-course.ts";
import { germanB1Course } from "../lib/german-b1-course.ts";
import { germanB2Course } from "../lib/german-b2-course.ts";

const { academyLessonJourneySteps } = lessonRoadmap;
const rendererSource = await readFile(new URL("../components/tutor-academy/AcademyLessonBlocks.tsx", import.meta.url), "utf8");
const rendererExports = {};
const jsx = (type, props) => ({ type, props });
const dependencies = {
  "react/jsx-runtime": { jsx, jsxs: jsx },
  "next/image": { default: "image" },
  "lucide-react": {},
  "@/lib/academy-lesson-roadmap": lessonRoadmap,
  "@/lib/tutor-academy": tutorAcademy,
  "@/lib/german-academy-course": germanAcademy,
  "@/lib/nicos-weg-course": nicosCourse,
  "@/lib/nicos-weg-a1-memory-aids": memoryAids,
  "@/lib/academy-video": academyVideo,
  "@/lib/academy-table-presentation": tablePresentation,
  "@/lib/nicos-weg-a1-sentence-practice": sentencePractice,
};
// Keep child UI components opaque; execute the actual renderer and navigation helpers.
runInNewContext(ts.transpileModule(rendererSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: rendererExports, require: name => {
  if (name in dependencies) return dependencies[name];
  if (name.startsWith("./Academy")) return {
    default: name.slice(2), AcademyGenderLegend: "AcademyGenderLegend", AcademyPhaseMarker: "AcademyPhaseMarker",
  };
  throw new Error(`Unexpected dependency: ${name}`);
} });
const renderBlocks = rendererExports.default;
const navigationBlocks = [
  { id: "start", type: "divider", label: "Getting started" },
  { id: "intro", type: "text", heading: "Introduction", paragraphs: ["Welcome"] },
  { id: "next", type: "divider", label: "Next task" },
  { id: "task", type: "text", heading: "Task", paragraphs: ["Try this"] },
];
const journeyIn = tree => tree.props.children.find(child => child?.type === "AcademyLessonJourney");

test("topic steps partition every authored block exactly once, preserving course order", () => {
  for (const course of [germanA1RestructuredCourse, germanA2Course, germanB1Course, germanB2Course]) {
    for (const lesson of course.lessons) {
      const before = JSON.stringify(lesson.blocks);
      const steps = academyLessonJourneySteps(lesson.blocks, "Einstieg");
      if (steps.length) {
        assert.equal(steps[0].start, 0);
        assert.equal(steps.at(-1).end, lesson.blocks.length);
        const indices = steps.flatMap((step) => {
          assert.ok(step.end > step.start);
          return Array.from({ length: step.end - step.start }, (_, index) => step.start + index);
        });
        assert.deepEqual(indices, lesson.blocks.map((_, index) => index));
        assert.equal(new Set(steps.map((step) => step.id)).size, steps.length);
      }
      assert.equal(JSON.stringify(lesson.blocks), before);
    }
  }
});

test("A1 chapter one has an introduction followed by its ten original topics", () => {
  const steps = academyLessonJourneySteps(germanA1RestructuredCourse.lessons[0].blocks, "Einstieg");
  assert.equal(steps.length, 11);
  assert.equal(steps[0].label, "Einstieg");
  assert.match(steps[1].label, /^1\.1/);
  assert.match(steps.at(-1).label, /^1\.10/);
});

test("lessons without topics retain the original whole-lesson rendering", () => {
  assert.deepEqual(academyLessonJourneySteps([], "Start"), []);
  assert.deepEqual(academyLessonJourneySteps([{ type: "text", heading: "Introduction", paragraphs: ["Hi"] }], "Start"), []);
});

test("Tutor Foundations keeps whole lessons and its course outline without inferred phase navigation", async () => {
  const courseOutline = { type: "outline" };
  const tree = renderBlocks({ blocks: navigationBlocks, courseKey: tutorAcademy.TUTOR_ACADEMY_COURSE_KEY, lessonId: "lesson-one", courseOutline });
  const { props } = journeyIn(tree);
  assert.equal(props.steps.length, 0);
  assert.equal(props.roadmap.props.sections.length, 0);
  assert.equal(props.roadmap.props.phases.length, 0);
  assert.equal(props.courseOutline, courseOutline);
  assert.equal(props.children.length, navigationBlocks.length);
  assert.equal(props.tracker.type, "AcademyActivityTracker");
  assert.equal(props.tracker.props.courseKey, tutorAcademy.TUTOR_ACADEMY_COURSE_KEY);
  assert.equal(props.canCompleteLesson, true);
  const journey = await readFile(new URL("../components/tutor-academy/AcademyLessonJourney.tsx", import.meta.url), "utf8");
  assert.match(journey, /steps.length < 2 && courseOutline/);
  assert.match(journey, /steps=\{\[\]\}[^\n]+courseOutline=\{courseOutline\}/);
  assert.match(journey, /academy-topic-body academy-block-stack flex flex-col">\{nodes\}/);
});

test("standard German lessons retain topic navigation and account progress controls", () => {
  const tree = renderBlocks({ blocks: navigationBlocks, courseKey: "german-b2-complete", lessonId: "lesson-one" });
  const { props } = journeyIn(tree);
  assert.deepEqual(Array.from(props.steps, step => step.label), ["Getting started", "Next task"]);
  assert.equal(props.roadmap.props.sections.length, 2);
  assert.equal(props.tracker.type, "AcademyActivityTracker");
  assert.equal(props.canCompleteLesson, true);
  assert.ok(tree.props.children.some(child => child?.type === "AcademyDisplayMode"));
});

test("continuous public previews keep all content without topic or account progress controls", () => {
  const tree = renderBlocks({ blocks: navigationBlocks, presentationCourseKey: "deutsch-b2-ankommen", continuous: true });
  const { props } = journeyIn(tree);
  assert.equal(props.children.length, navigationBlocks.length);
  assert.deepEqual(Array.from(props.anchors), navigationBlocks.map(lessonRoadmap.academyBlockAnchor));
  assert.equal(props.steps.length, 0);
  assert.equal(props.roadmap.props.sections.length, 0);
  assert.equal(props.roadmap.props.phases.length, 0);
  assert.equal(props.tracker, null);
  assert.equal(props.canCompleteLesson, false);
  assert.ok(!tree.props.children.some(child => child?.type === "AcademyDisplayMode"));
});

test("draft preview identifies the course for navigation without enabling learner writes", async () => {
  const preview = await readFile(new URL("../app/dashboard/admin/academy/[courseKey]/preview/page.tsx", import.meta.url), "utf8");
  const props = preview.split("<AcademyLessonBlocks")[1].split("/>")[0];
  assert.match(props, /presentationCourseKey=\{course.key\}/);
  assert.doesNotMatch(props, /\s+courseKey=|\s+lessonId=/);
  const renderer = await readFile(new URL("../components/tutor-academy/AcademyLessonBlocks.tsx", import.meta.url), "utf8");
  assert.match(renderer, /canCompleteLesson=\{!!courseKey && !!lessonId\}/);
  assert.doesNotMatch(renderer, /courseKey=\{presentationCourseKey\}/);
});

test("B2 lessons without numbered topics use learning stages as focused sections", () => {
  for (const lesson of germanB2Course.lessons) {
    const steps = academyLessonJourneySteps(lesson.blocks, "Einstieg");
    assert.ok(steps.length > 1, lesson.title);
  }
});

test("every A2 lesson including exam/review lessons has a navigable topic outline", () => {
  assert.equal(germanA2Course.lessons.length, 36);
  for (const lesson of germanA2Course.lessons) {
    const steps = academyLessonJourneySteps(lesson.blocks, "Einstieg");
    assert.ok(steps.length > 1, lesson.title);
    assert.equal(steps[0].start, 0);
    assert.equal(steps.at(-1).end, lesson.blocks.length);
    const required = steps.flatMap((step) => step.requiredIds);
    assert.equal(new Set(required).size, required.length, lesson.title);
  }
});

test("switching topics hides mounted children, protects recordings, and does not save completion", async () => {
  const source = await readFile(new URL("../components/tutor-academy/AcademyLessonJourney.tsx", import.meta.url), "utf8");
  assert.match(source, /steps\.map/);
  assert.match(source, /hidden=\{!whole && active !== index\}/);
  assert.match(source, /nodes\.slice\(step.start, step.end\)/);
  assert.match(source, /data-academy-recording/);
  assert.match(source, /hashchange/);
  assert.match(source, /aria-controls/);
  assert.doesNotMatch(source, /recordAcademyBlockCompletion|router\.refresh/);
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.academy-topic-content\[hidden\] \{ display: none; \}/);
});

test("the roadmap slot has a stable key and both rendering modes normalize block children", async () => {
  const blocks = await readFile(new URL("../components/tutor-academy/AcademyLessonBlocks.tsx", import.meta.url), "utf8");
  assert.match(blocks, /roadmap=\{<AcademyLessonRoadmap key="lesson-roadmap"/);
  assert.match(blocks, /key=\{block.id \|\| blockIndex\}/);
  const journey = await readFile(new URL("../components/tutor-academy/AcademyLessonJourney.tsx", import.meta.url), "utf8");
  assert.match(journey, /Children.toArray\(children\)/);
  assert.match(journey, /steps.length < 2.*\{roadmap\}\{nodes\}/);
});

test("focused navigation scrolls to a non-sticky start marker and shares the exact active topic", async () => {
  const journey = await readFile(new URL("../components/tutor-academy/AcademyLessonJourney.tsx", import.meta.url), "utf8");
  assert.match(journey, /ref=\{topicStart\} aria-hidden="true" className="h-0 scroll-mt-16"/);
  assert.match(journey, /target\?\.scrollIntoView\(\{ block: "start", behavior: "instant" \}\)/);
  assert.doesNotMatch(journey, /navigator.current\?\.scrollIntoView/);
  assert.match(journey, /AcademyJourneyContext.Provider value=\{current.id\}/);
  const roadmap = await readFile(new URL("../components/tutor-academy/AcademyLessonRoadmap.tsx", import.meta.url), "utf8");
  assert.match(roadmap, /journeyCurrent \?\? scrollCurrent/);
  assert.doesNotMatch(roadmap, /visible.at\(-1\) \|\| targets\[0\]/);
});

test("topic controls scroll after the destination is committed and keep mobile buttons inline", async () => {
  const journey = await readFile(new URL("../components/tutor-academy/AcademyLessonJourney.tsx", import.meta.url), "utf8");
  assert.match(journey, /useLayoutEffect\(\(\) => \{\s*if \(!scrollRequest\) return/);
  assert.match(journey, /setScrollRequest\(\{ focus: true \}\)/);
  assert.match(journey, /requestAnimationFrame\(scrollToDestination\)/);
  assert.match(journey, /cancelAnimationFrame\(frame\)/);
  assert.match(journey, /tabIndex=\{-1\}/);
  assert.match(journey, /\.academy-topic-content:not\(\[hidden\]\)/);
  assert.match(journey, /focus\(\{ preventScroll: true \}\)/);
  assert.doesNotMatch(journey, /navigator.current\?\.focus/);
  assert.match(journey, /grid grid-cols-2 gap-3 sm:flex sm:justify-between/);
  assert.match(journey, /className="sm:hidden">\{german \? "Nächstes" : "Next"\}/);
  assert.match(journey, /aria-label=\{german \? "Nächstes Unterthema" : "Next topic"\}/);
});
