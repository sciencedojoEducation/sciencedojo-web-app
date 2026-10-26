import { requireTrainerAccess, readTrainerPage } from "@/lib/intensivtrainer-server";
import { workbookError } from "@/lib/workbook-access";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    await requireTrainerAccess(request);
    const page = await readTrainerPage(Number(new URL(request.url).searchParams.get("page")));
    return page ? Response.json({ page }, { headers: { "Cache-Control": "private, no-store" } }) : new Response(null, { status: 404 });
  } catch (e) { return workbookError(e); }
}
