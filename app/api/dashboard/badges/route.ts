import { getAuthenticatedDashboardBadgeContext } from "@/lib/dashboard-badges";

export const dynamic = "force-dynamic";

export async function GET() {
  const context = await getAuthenticatedDashboardBadgeContext();
  if (!context) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.json(
    { counts: context.counts },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
