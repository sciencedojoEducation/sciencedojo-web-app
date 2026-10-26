import { parseTrainerState } from "@/lib/intensivtrainer";
import { requireTrainerAccess, readTrainerState, saveTrainerState } from "@/lib/intensivtrainer-server";
import { workbookError, workbookRequestJson, workbookSameOrigin, WorkbookAccessError } from "@/lib/workbook-access";
export const runtime = "nodejs";
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
export async function GET(request: Request) {
  try {
    const access = await requireTrainerAccess(request), expected = new URL(request.url).searchParams.get("account");
    if (expected && expected !== access.id) throw new WorkbookAccessError(401, "Your signed-in account changed. Reload before continuing.");
    return json({ ...await readTrainerState(access), account: { id: access.id, email: access.email, local: access.local } });
  } catch (e) { return workbookError(e); }
}
export async function POST(request: Request) {
  try {
    const access = await requireTrainerAccess(request);
    if (!workbookSameOrigin(request)) throw new WorkbookAccessError(403, "Invalid request origin.");
    const input = await workbookRequestJson(request);
    if (input.accountId !== access.id) throw new WorkbookAccessError(401, "Your signed-in account changed. Your edits remain on this device.");
    if (!Number.isSafeInteger(input.revision) || input.revision < 0) throw new WorkbookAccessError(400, "Invalid save revision.");
    let state;
    try { state = parseTrainerState(input.state); } catch { throw new WorkbookAccessError(400, "Invalid workbook save. Your current work was preserved."); }
    const current = await readTrainerState(access);
    state.feedback = current.state.feedback;
    if (!await saveTrainerState(access, state, input.revision)) return json(await readTrainerState(access), 409);
    return json({ state, revision: input.revision + 1 });
  } catch (e) { return workbookError(e); }
}
