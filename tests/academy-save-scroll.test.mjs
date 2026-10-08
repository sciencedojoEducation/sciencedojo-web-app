import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { test } from "node:test";
import ts from "typescript";

test("progress refreshes preserve the current position; initial bookmarks and activity links still restore it", () => {
  const source = readFileSync(new URL("../components/tutor-academy/AcademyLessonJourney.tsx", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  const hooks = [];
  const listeners = new Map();
  const requests = [];
  let cursor = 0;
  let effects = [];
  let cleanups = [];
  const react = {
    Children: { toArray: children => children },
    useState: initial => {
      const index = cursor++;
      if (!(index in hooks)) hooks[index] = initial;
      return [hooks[index], value => {
        hooks[index] = value;
        if (value && typeof value === "object" && "anchor" in value) requests.push(value.anchor);
      }];
    },
    useRef: initial => {
      const index = cursor++;
      hooks[index] ||= { current: initial };
      return hooks[index];
    },
    useId: () => `id-${cursor++}`,
    useEffect: callback => { effects.push(callback); },
    useLayoutEffect: () => {},
  };
  const exports = {};
  const window = {
    location: { hash: "#first" },
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: (name, callback) => { if (listeners.get(name) === callback) listeners.delete(name); },
  };
  runInNewContext(compiled, {
    exports, window,
    require: name => {
      if (name === "react") return react;
      if (name === "react/jsx-runtime") return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
      if (name === "./AcademyJourneyContext") return { AcademyJourneyContext: { Provider: "context" } };
      if (name === "./AcademyTopicNavigator") return { default: "navigator" };
      if (name === "@/lib/academy-scroll-container" || name === "lucide-react") return {};
      if (name === "@/lib/academy-topic-celebration") return { celebrateAcademyTopic: () => {} };
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  const render = (completedIds, resumeAnchor) => {
    cleanups.forEach(cleanup => cleanup?.());
    cursor = 0;
    effects = [];
    exports.default({
      children: ["one", "two"], roadmap: null, completedIds, resumeAnchor,
      anchors: ["first", "second"],
      steps: [{ id: "first", start: 0, end: 1, requiredIds: ["one"] }, { id: "second", start: 1, end: 2, requiredIds: ["two"] }],
      german: true, canCompleteLesson: true,
    });
    cleanups = effects.map(callback => callback());
  };
  render([], "first");
  assert.deepEqual(requests, ["first"]);
  // A save supplies fresh arrays and may update the saved resume anchor.
  render(["one"], "second");
  render(["one", "two"], "second");
  assert.deepEqual(requests, ["first"], "saving must not issue another scroll request");
  window.location.hash = "#second";
  listeners.get("hashchange")();
  assert.deepEqual(requests, ["first", "second"], "explicit activity navigation must still scroll");
  cleanups.forEach(cleanup => cleanup?.());
});
