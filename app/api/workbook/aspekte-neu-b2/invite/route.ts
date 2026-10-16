import { createHash } from "node:crypto";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { workbookFeatureEnabled, workbookError, workbookSameOrigin, workbookRequestJson, WorkbookAccessError } from "@/lib/workbook-access";
export async function POST(request: Request) {
  try {
    if (!workbookFeatureEnabled()) throw new WorkbookAccessError(404, "Workbook unavailable.");
    if (!workbookSameOrigin(request)) throw new WorkbookAccessError(403, "Invalid request origin.");
    const client = await createClient(); const { data: { user } } = await client.auth.getUser();
    if (!user || !user.email_confirmed_at) throw new WorkbookAccessError(401, "Sign in with the verified email address that was invited.");
    if (user.user_metadata?.is_suspended) throw new WorkbookAccessError(403, "This account is inactive.");
    const input = await workbookRequestJson(request, 1000);
    if (typeof input.token !== "string" || !/^[0-9a-f]{64}$/.test(input.token)) throw new WorkbookAccessError(400, "Invalid invitation.");
    const { data, error } = await createAdminClient().rpc("workbook_redeem_invitation", { target_user: user.id, invitation_hash: createHash("sha256").update(input.token).digest("hex") });
    if (error) throw error;
    if (!data) throw new WorkbookAccessError(403, "This invitation expired, was used or revoked, or belongs to a different email address.");
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) { return workbookError(e); }
}
