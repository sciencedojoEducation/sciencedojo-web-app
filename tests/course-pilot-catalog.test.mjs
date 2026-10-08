import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const source = await readFile(new URL("../lib/course-pilot.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;

function catalogue({ enabled = true, flagError = null, rpcError = null } = {}) {
  const courses = [{ key: "nicos-a2", title: "Nicos A2" }];
  const requests = [];
  const publicClient = {
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { enabled }, error: flagError }) }) }) }),
    rpc: async (name, args) => {
      requests.push({ name, args });
      return { data: courses, error: rpcError };
    },
  };
  const unavailableSession = () => { throw new Error("Expired visitor session must not be accessed"); };
  const dependencies = {
    "server-only": {},
    "@/utils/supabase/public": { createPublicClient: () => publicClient },
    "@/utils/supabase/server": { createClient: unavailableSession },
    "@/lib/feature-flags": { isFeatureEnabled: unavailableSession },
    "next/navigation": { notFound: () => { throw new Error("NOT_FOUND"); } },
  };
  const exports = {};
  runInNewContext(compiled, { exports, require: (name) => {
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
    return dependencies[name];
  } });
  return { load: exports.getPilotCatalog, courses, requests };
}

test("catalogue loads without touching an expired authenticated session", async () => {
  const { load, courses, requests } = catalogue();
  assert.equal(await load(), courses);
  assert.equal(requests[0].name, "course_pilot_catalog");
  assert.equal(requests[0].args.target_key, null);
  await load("nicos-a2");
  assert.equal(requests[1].args.target_key, "nicos-a2");
});

test("disabled pilot stays unavailable and does not request catalogue data", async () => {
  const { load, requests } = catalogue({ enabled: false });
  await assert.rejects(load(), /NOT_FOUND/);
  assert.equal(requests.length, 0);
});

test("database failures remain retryable errors rather than pretending the pilot is disabled", async () => {
  for (const options of [{ flagError: { message: "Database unavailable" } }, { rpcError: { message: "Database unavailable" } }]) {
    await assert.rejects(catalogue(options).load(), /Unable to load courses/);
  }
});
