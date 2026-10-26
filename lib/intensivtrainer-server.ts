import "server-only";
import { readFile, mkdir, writeFile, rename } from "node:fs/promises";
import { join } from "node:path";
import { TRAINER_KEY, trainerLocalRequest, emptyTrainerState, type TrainerManifest, type TrainerPage, type TrainerState } from "./intensivtrainer";
import { requireWorkbookAccess, workbookFeatureEnabled, WorkbookAccessError, type WorkbookAccess } from "./workbook-access";
import { studyPage } from "./aspekte-workbook";
import { readTrainerMembership } from "./intensivtrainer-membership";
import { createAdminClient } from "@/utils/supabase/admin";
export const trainerRoot = join(process.cwd(), "private-materials", TRAINER_KEY, "derived");
export const trainerEnabled = () => workbookFeatureEnabled() && process.env.INTENSIVTRAINER_ENABLED !== "false";
export const trainerCloud = () => process.env.WORKBOOK_STORAGE === "supabase" || process.env.NODE_ENV === "production";
const cache = new Map<string, { text: string; expires: number }>();
async function sourceJson(path: string) {
  if (!trainerCloud()) return JSON.parse(await readFile(join(trainerRoot, path), "utf8"));
  const cached = cache.get(path);
  if (cached && cached.expires > Date.now()) return JSON.parse(cached.text);
  const { data, error } = await createAdminClient().storage.from("private-workbooks").download(`${TRAINER_KEY}/${path}`);
  if (error || !data) throw new WorkbookAccessError(503, "The private book source is temporarily unavailable.");
  const text = await data.text(); cache.set(path, { text, expires: Date.now() + 60_000 }); return JSON.parse(text);
}
export async function requireTrainerAccess(request: Request): Promise<WorkbookAccess> {
  if (!trainerEnabled()) throw new WorkbookAccessError(404, "Book unavailable.");
  if (process.env.WORKBOOK_ACCOUNT_MODE !== "true" && trainerLocalRequest(request.url, request.headers, process.env.NODE_ENV)) return { id: "local-preview", email: "", local: true, admin: true };
  const access = await requireWorkbookAccess(request, true);
  const admin = createAdminClient();
  const membership = () => readTrainerMembership(admin, access.id, request.signal);
  let row = await membership();
  if (row.error) throw new WorkbookAccessError(503, "Book access could not be checked.");
  if (!row.data) {
    const { error } = await admin.from("workbook_memberships").upsert({ user_id: access.id, book_key: TRAINER_KEY, active: true }, { onConflict: "user_id,book_key", ignoreDuplicates: true });
    if (error) throw new WorkbookAccessError(503, "Intensivtrainer accounts are not configured yet.");
    row = await membership();
  }
  if (row.error || !row.data) throw new WorkbookAccessError(503, "Book access could not be confirmed.");
  if (!row.data.active) throw new WorkbookAccessError(403, "Your access to this book has been revoked.");
  return access;
}
export async function readTrainerManifest(): Promise<TrainerManifest> {
  return { ...await sourceJson("manifest.json"), feedbackAvailable: !!process.env.GEMINI_API_KEY };
}
export async function readTrainerPage(number: number): Promise<TrainerPage | null> {
  if (!Number.isInteger(number) || number < 4 || number > 83) return null;
  const page = await sourceJson(`native/${number}.json`);
  const visible = studyPage({ bookPage: number, section: page.section, kind: "exercises", tracks: [], warnings: [], exercises: page.nativeExercises });
  return { ...page, nativeExercises: visible.exercises };
}
export type TrainerSaved = { revision: number; state: TrainerState };
const localPath = join(trainerRoot, "native-account-preview.json");
let queue = Promise.resolve();
export async function readTrainerState(access: WorkbookAccess): Promise<TrainerSaved> {
  if (access.local) {
    try { return JSON.parse(await readFile(localPath, "utf8")); }
    catch (e) { if ((e as NodeJS.ErrnoException).code === "ENOENT") return { revision: 0, state: emptyTrainerState() }; throw e; }
  }
  const { data, error } = await createAdminClient().from("workbook_learning_states").select("revision,payload").eq("user_id", access.id).eq("book_key", TRAINER_KEY).maybeSingle();
  if (error) throw new WorkbookAccessError(503, "Your account work could not be loaded.");
  return data ? { revision: data.revision, state: data.payload } : { revision: 0, state: emptyTrainerState() };
}
export async function saveTrainerState(access: WorkbookAccess, state: TrainerState, revision: number) {
  if (access.local) {
    let saved = false;
    const operation = queue.then(async () => {
      if ((await readTrainerState(access)).revision !== revision) return;
      await mkdir(trainerRoot, { recursive: true }); const temporary = `${localPath}.${crypto.randomUUID()}.tmp`;
      await writeFile(temporary, JSON.stringify({ state, revision: revision + 1 })); await rename(temporary, localPath); saved = true;
    });
    queue = operation.catch(() => {}); await operation; return saved;
  }
  const { data, error } = await createAdminClient().rpc("intensivtrainer_save_state", { target_user: access.id, expected_revision: revision, next_payload: state });
  if (error) throw new WorkbookAccessError(503, "Your work could not be saved. Your device backup is retained.");
  return data === true;
}
