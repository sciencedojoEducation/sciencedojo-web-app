import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const compiled = ts.transpileModule(readFileSync(new URL("../app/api/academy/portfolio/route.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function fixture({ signedIn = true, allowed = true } = {}) {
  const filters = {};
  let reads = 0;
  let signedPaths = [];
  const rows = [
    { block_id: "writing", submission_type: "writing", text_response: "Hallo", updated_at: "now" },
    { block_id: "speaking", submission_type: "speaking", audio_path: "learner/recording.webm", updated_at: "now" },
  ];
  const query = {
    select() { reads++; return this; },
    eq(column, value) { filters[column] = value; return this; },
    async in(column, values) { filters[column] = [...values]; return { data: rows }; },
  };
  const supabase = {
    from(table) { assert.equal(table, "academy_learner_submissions"); return query; },
    storage: { from(bucket) {
      assert.equal(bucket, "academy-learner-audio");
      return { async createSignedUrls(paths) { signedPaths = [...paths]; return { data: paths.map(path => ({ path, signedUrl: "private-url" })) }; } };
    } },
  };
  const modules = {
    "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
    "@/utils/supabase/server": { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: signedIn ? { id: "learner" } : null } }) } }) },
    "@/lib/tutor-academy-progress": { requireTutorAcademyUser: async () => {
      if (!allowed) throw new Error("Access denied");
      return { supabase, user: { id: "learner" } };
    } },
    "@/lib/academy-courses": { getPublishedAcademyCourse: async () => ({ lessons: [{ id: "lesson", blocks: [
      { id: "writing", type: "writing-practice" }, { id: "speaking", type: "speaking-practice" }, { id: "text", type: "text" },
    ] }] }) },
  };
  const exports = {};
  runInNewContext(compiled, { exports, require: name => { assert.ok(name in modules, name); return modules[name]; }, URL, console });
  return { GET: exports.GET, filters, reads: () => reads, signedPaths: () => signedPaths };
}

test("portfolio batches lesson reads, scopes to the current user, and never caches private answers", async () => {
  const f = fixture();
  const response = await f.GET(new Request("http://localhost/api/academy/portfolio?courseKey=course&lessonId=lesson"));
  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control"), /private, no-store/);
  assert.deepEqual(f.filters, { user_id: "learner", course_key: "course", lesson_id: "lesson", block_id: ["writing", "speaking"] });
  assert.equal(f.reads(), 1);
  assert.deepEqual(f.signedPaths(), ["learner/recording.webm"]);
  const body = await response.json();
  assert.equal(body.submissions.writing.text, "Hallo");
  assert.equal(body.submissions.speaking.audioUrl, "private-url");
});

test("invalid, anonymous and inaccessible lesson requests cannot read submissions", async () => {
  const f = fixture();
  assert.equal((await f.GET(new Request("http://localhost/api/academy/portfolio"))).status, 400);
  assert.equal((await f.GET(new Request("http://localhost/api/academy/portfolio?courseKey=course&lessonId=missing"))).status, 404);
  assert.equal(f.reads(), 0);
  const anonymous = fixture({ signedIn: false });
  assert.equal((await anonymous.GET(new Request("http://localhost/api/academy/portfolio?courseKey=course&lessonId=lesson"))).status, 401);
  assert.equal(anonymous.reads(), 0);
  const denied = fixture({ allowed: false });
  await assert.rejects(denied.GET(new Request("http://localhost/api/academy/portfolio?courseKey=course&lessonId=lesson")), /Access denied/);
  assert.equal(denied.reads(), 0);
});
