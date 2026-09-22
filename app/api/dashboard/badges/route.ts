import {
  getAuthenticatedDashboardBadgeContext,
  getAuthenticatedDashboardBadgeIdentity,
  isDashboardBadgeKey,
  isMissingDashboardBadgeViewsTableError,
  roleCanViewDashboardBadge,
} from "@/lib/dashboard-badges";
import { createClient } from "@/utils/supabase/server";

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

export async function POST(request: Request) {
  const identity = await getAuthenticatedDashboardBadgeIdentity();
  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { badgeKey?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isDashboardBadgeKey(body.badgeKey)) {
    return Response.json({ error: "Invalid badge key" }, { status: 400 });
  }
  if (!roleCanViewDashboardBadge(identity.role, body.badgeKey)) {
    return Response.json({ error: "Badge is not available for this role" }, { status: 403 });
  }

  const viewedAt = new Date().toISOString();
  const supabase = await createClient();
  const { error } = await supabase
    .from("dashboard_badge_views")
    .upsert(
      { user_id: identity.userId, badge_key: body.badgeKey, viewed_at: viewedAt },
      { onConflict: "user_id,badge_key" },
    );

  if (error) {
    if (isMissingDashboardBadgeViewsTableError(error)) {
      return Response.json(
        { error: "Badge view storage is not available" },
        { status: 503, headers: { "Cache-Control": "private, no-store" } },
      );
    }
    console.error("[dashboard-badges] Unable to save viewed state:", error.message);
    return Response.json({ error: "Unable to save viewed state" }, { status: 500 });
  }

  return Response.json({ badgeKey: body.badgeKey, viewedAt });
}
