import { requireLehrbuchAccess, readLehrbuchNativePage } from '@/lib/lehrbuch-server';
import { workbookError } from '@/lib/workbook-access';
export const runtime = 'nodejs';
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireLehrbuchAccess(request);
    const { id } = await context.params;
    if (!/^[1-9]\d{0,2}$/.test(id) || Number(id) > 202) return new Response(null, { status: 404 });
    return Response.json(await readLehrbuchNativePage(Number(id)), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return workbookError(error); }
}
