import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import ts from "typescript";

test("the privileged campus flag writer requires explicit staff, including for a legacy admin profile", async () => {
  const source = await readFile(new URL("../app/dashboard/admin/feature-flags/actions.ts", import.meta.url), "utf8");
  const writes = [], calls = [];
  let staff = false, failed = false;
  const profile = { maybeSingle: async () => ({ data: { role: "admin" } }) };
  const supabase = {
    auth: { getUser: async () => ({ data: { user: { id: "fixture-user", user_metadata: { role: "admin" } } } }) },
    from: () => ({ select: () => ({ eq: () => profile }) }),
    rpc: async (name) => { calls.push(name); return { data: staff, error: failed ? new Error("Unavailable") : null }; },
  };
  const exports = {};
  const modules = {
    "next/cache": { revalidatePath() {}, revalidateTag() {} },
    "@/utils/supabase/server": { createClient: async () => supabase },
    "@/utils/supabase/admin": { createAdminClient: () => ({ from: () => ({ upsert: async (row) => { writes.push(row); return { error: null }; } }) }) },
    "@/lib/feature-flags": {
      FEATURE_FLAG_DEFINITIONS: [{ key: "virtual_campus_enabled" }, { key: "course_pilot_enabled" }],
      PUBLIC_FEATURE_FLAGS_CACHE_TAG: "fixture-flags",
    },
  };
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    exports, require(name) { assert.ok(name in modules, name); return modules[name]; },
    console: { error() {} }, Set, Date,
  });
  const form = new FormData();
  form.set("key", "virtual_campus_enabled");
  form.set("enabled", "true");
  await exports.toggleFeatureFlag(form);
  assert.equal(writes.length, 0);
  assert.deepEqual(calls, ["campus_is_staff"]);
  staff = true;
  failed = true;
  await exports.toggleFeatureFlag(form);
  assert.equal(writes.length, 0, "RPC outages fail closed before the service-role writer");
  failed = false;
  await exports.toggleFeatureFlag(form);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].key, "virtual_campus_enabled");
  assert.equal(writes[0].enabled, true);
  staff = false;
  form.set("key", "course_pilot_enabled");
  await exports.toggleFeatureFlag(form);
  assert.equal(writes.length, 2, "other existing flag behavior is preserved");
});
