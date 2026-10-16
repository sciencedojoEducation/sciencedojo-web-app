import "server-only";
import { readFile, mkdir, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createAdminClient } from "@/utils/supabase/admin";
import { workbookRoot } from "./aspekte-workbook-server";
import { WORKBOOK_KEY, WorkbookAccessError, type WorkbookAccess } from "./workbook-access";
import { emptyWorkbookLearningState, type WorkbookLearningState } from "./workbook-study";

const localPath = join(workbookRoot, "learner-preview.json");
let localQueue = Promise.resolve();
export async function readWorkbookLearning(access: WorkbookAccess): Promise<WorkbookLearningState> {
  if (access.local) {
    try { return JSON.parse(await readFile(localPath, "utf8")); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return emptyWorkbookLearningState(); throw error; }
  }
  const { data, error } = await createAdminClient().from("workbook_learning_states").select("revision,payload").eq("user_id", access.id).eq("book_key", WORKBOOK_KEY).maybeSingle();
  if (error) throw new WorkbookAccessError(503, "Study saving is not configured yet.");
  return data ? { ...data.payload, revision: data.revision } : emptyWorkbookLearningState();
}
export async function saveWorkbookLearning(access: WorkbookAccess, next: WorkbookLearningState, expected: number) {
  if (access.local) {
    let saved = false;
    const operation = localQueue.then(async () => {
      const current = await readWorkbookLearning(access); if (current.revision !== expected) return;
      await mkdir(workbookRoot, { recursive: true }); const tmp = `${localPath}.${crypto.randomUUID()}.tmp`;
      await writeFile(tmp, JSON.stringify({ ...next, revision: expected + 1 })); await rename(tmp, localPath); saved = true;
    });
    localQueue = operation.catch(() => {}); await operation; return saved;
  }
  const { data, error } = await createAdminClient().rpc("workbook_save_state", { target_user: access.id, target_book: WORKBOOK_KEY, expected_revision: expected, next_payload: { ...next, revision: expected + 1 } });
  if (error) throw new WorkbookAccessError(503, "Your work could not be saved. Retry when connected.");
  return data === true;
}
export async function changeWorkbookLearning<T>(access: WorkbookAccess, operation: (state: WorkbookLearningState) => T, expected?: number) {
  for (let i = 0; i < 5; i++) {
    const state = await readWorkbookLearning(access);
    if (expected !== undefined && state.revision !== expected) return { conflict: state };
    const value = operation(state);
    if (await saveWorkbookLearning(access, state, state.revision)) return { state: { ...state, revision: state.revision + 1 }, value };
  }
  throw new WorkbookAccessError(409, "Another device is saving. Reload your progress and retry.");
}
