import test from "node:test";
import assert from "node:assert/strict";
import { createAcademyPortfolioLoader } from "../lib/academy-portfolio-client.ts";

test("all exercises in a lesson share one in-flight read, then load fresh answers", async () => {
  let calls = 0;
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const load = createAcademyPortfolioLoader(async (url, options) => {
    calls++;
    assert.equal(options.cache, "no-store");
    assert.equal(new URL(url, "http://localhost").searchParams.get("lessonId"), "lesson/1");
    await gate;
    return Response.json({ submissions: { writing: { type: "writing", text: `answer ${calls}` }, speaking: { type: "speaking", audioUrl: "private-url" } } });
  });
  const writing = load("course", "lesson/1", "writing");
  const speaking = load("course", "lesson/1", "speaking");
  assert.equal(calls, 1);
  release();
  assert.equal((await writing).text, "answer 1");
  assert.equal((await speaking).audioUrl, "private-url");
  assert.equal((await load("course", "lesson/1", "writing")).text, "answer 2");
  assert.equal(calls, 2);
});

test("failed reads can retry and separate lessons do not share requests", async () => {
  let calls = 0;
  const load = createAcademyPortfolioLoader(async () => {
    calls++;
    return calls === 1 ? new Response(null, { status: 503 }) : Response.json({ submissions: {} });
  });
  await assert.rejects(load("course", "lesson-a", "block"), /could not be loaded/);
  assert.equal(await load("course", "lesson-a", "block"), null);
  await Promise.all([load("course", "lesson-a", "block"), load("course", "lesson-b", "block")]);
  assert.equal(calls, 4);
});
