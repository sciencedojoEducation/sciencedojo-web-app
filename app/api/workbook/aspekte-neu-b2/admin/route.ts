import { createHash, randomBytes } from "node:crypto";
import { requireWorkbookAccess, workbookError, workbookSameOrigin, workbookRequestJson, WorkbookAccessError, WORKBOOK_KEY } from "@/lib/workbook-access";
import { createAdminClient } from "@/utils/supabase/admin";
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
export async function GET(request: Request) {
  try {
    await requireWorkbookAccess(request, true); const admin = createAdminClient();
    const [members, invitations] = await Promise.all([admin.from("workbook_memberships").select("user_id,active,created_at").eq("book_key", WORKBOOK_KEY).order("created_at", { ascending: false }).limit(100), admin.from("workbook_invitations").select("id,email,expires_at,redeemed_at,revoked_at").eq("book_key", WORKBOOK_KEY).order("created_at", { ascending: false }).limit(100)]);
    if (members.error || invitations.error) throw new WorkbookAccessError(503, "Apply the private workbook migration first.");
    return json({ members: members.data, invitations: invitations.data });
  } catch (e) { return workbookError(e); }
}
export async function POST(request: Request) {
  try {
    if (!workbookSameOrigin(request)) throw new WorkbookAccessError(403, "Invalid request origin.");
    const access = await requireWorkbookAccess(request, true); const input = await workbookRequestJson(request, 10000); const admin = createAdminClient();
    if (input.action === "invite") {
      const email = String(input.email || "").trim().toLowerCase();
      if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new WorkbookAccessError(400, "Enter the learner’s email address.");
      const token = randomBytes(32).toString("hex"); const expires = new Date(Date.now() + 7 * 86400000).toISOString();
      const { error } = await admin.from("workbook_invitations").insert({ email, book_key: WORKBOOK_KEY, token_hash: createHash("sha256").update(token).digest("hex"), expires_at: expires, created_by: access.id });
      if (error) throw new Error("Unable to create invitation");
      return json({ link: `${new URL(request.url).origin}/workbooks/aspekte-neu-b2/invite?token=${token}`, expires });
    }
    if (input.action === "revoke-invite" && /^[0-9a-f-]{36}$/.test(input.id)) {
      const { error } = await admin.from("workbook_invitations").update({ revoked_at: new Date().toISOString() }).eq("id", input.id).eq("book_key", WORKBOOK_KEY);
      if (error) throw error; return json({ ok: true });
    }
    if (["grant", "revoke"].includes(input.action)) {
      let userId = input.userId;
      if (input.action === "grant" && input.email) {
        const email = String(input.email).trim().toLowerCase(); let page = 1; userId = null;
        while (true) {
          const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 }); if (error) throw error;
          const user = data.users.find(u => u.email?.toLowerCase() === email && u.email_confirmed_at);
          if (user) { userId = user.id; break; } if (data.users.length < 1000) break; page++;
        }
      }
      if (typeof userId !== "string" || !/^[0-9a-f-]{36}$/.test(userId)) throw new WorkbookAccessError(400, "No verified account found. Create an invitation instead.");
      if (input.action === "grant") {
        const [auth, profile] = await Promise.all([admin.auth.admin.getUserById(userId), admin.from("profiles").select("is_suspended").eq("id", userId).maybeSingle()]);
        if (auth.error || profile.error || !auth.data.user?.email_confirmed_at || auth.data.user.user_metadata?.is_suspended || !profile.data || profile.data.is_suspended) throw new WorkbookAccessError(400, "Grant access to a verified, active account.");
      }
      const { error } = await admin.from("workbook_memberships").upsert({ user_id: userId, book_key: WORKBOOK_KEY, active: input.action === "grant" });
      if (error) throw error; return json({ ok: true });
    }
    throw new WorkbookAccessError(400, "Choose a valid access action.");
  } catch (e) { return workbookError(e); }
}
