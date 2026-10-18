import "server-only";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireWorkbookAccess, WorkbookAccessError } from "@/lib/workbook-access";
import { readWorkbookLearning } from "@/lib/workbook-learning-server";
import { readWorkbookPage } from "@/lib/aspekte-workbook-server";
import { chapterForPage } from "@/lib/workbook-study";

export async function workbookRecordingTarget(request: Request) {
  const access = await requireWorkbookAccess(request);
  if (access.local) throw new WorkbookAccessError(400, "Cloud recording saves require a signed-in account.");
  const params = new URL(request.url).searchParams;
  if (params.get("account") !== access.id) throw new WorkbookAccessError(401, "Your account changed. Reload before saving a recording.");
  const exercise = params.get("exercise") || "";
  const [number, id] = exercise.split(":"); const page = await readWorkbookPage(Number(number));
  if (!page || exercise !== `${page.bookPage}:${id}` || !page.exercises.some(e => e.id === id && e.mode === "speaking")) throw new WorkbookAccessError(404, "Speaking exercise not found.");
  const state = await readWorkbookLearning(access);
  const run = state.draft.exerciseRuns?.[exercise] || state.draft.runs[String(chapterForPage(page.bookPage))] || "initial";
  return { access, exercise, run, admin: createAdminClient() };
}
