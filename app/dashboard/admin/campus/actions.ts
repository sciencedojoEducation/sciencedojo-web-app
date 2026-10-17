"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { campusStaffSession } from "@/lib/campus/staff";
export async function manageCampus(form: FormData) {
  const session = await campusStaffSession();
  if (!session) throw new Error("Campus staff authorization required.");
  const { supabase } = session;
  const id = String(form.get("id") || ""),
    action = String(form.get("action") || "");
  if (!/^[0-9a-f-]{36}$/i.test(id))
    throw new Error("A valid account or report identifier is required.");
  let result;
  if (action === "resolve")
    result = await supabase.rpc("campus_resolve_report", { target_report: id });
  else if (action === "admit" || action === "revoke") {
    if (action === "admit" && form.get("reviewed") !== "on")
      throw new Error(
        "Record eligibility evidence privately before approving a member.",
      );
    result = await supabase.rpc("campus_manage_member", {
      target_user: id,
      active: action === "admit",
      adult: action === "admit",
      eea: action === "admit",
    });
    if (!result.error && action === "revoke") {
      const { data: member } = await supabase
        .from("campus_members")
        .select("campus_id")
        .eq("user_id", id)
        .single();
      const url = process.env.CAMPUS_INTERNAL_URL;
      // The Vercel runtime removes revoked membership on its next shared DB step;
      // do not send the old service key to an obsolete room host after cutover.
      if (process.env.CAMPUS_TRANSPORT !== "vercel" && member && url && process.env.CAMPUS_SERVICE_KEY) {
        try {
          const endpoint = new URL(`/remove/${member.campus_id}`, url);
          if (
            endpoint.protocol !== "https:" &&
            !["localhost", "127.0.0.1"].includes(endpoint.hostname)
          )
            throw new Error("HTTPS required");
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              authorization: `Bearer ${process.env.CAMPUS_SERVICE_KEY}`,
            },
            signal: AbortSignal.timeout(5000),
          });
          if (!response.ok) throw new Error("Removal notification failed");
        } catch {
          redirect("/dashboard/admin/campus?message=revoked-polling");
        }
      }
    }
  } else throw new Error("Unknown action");
  if (result.error) redirect("/dashboard/admin/campus?message=failed");
  revalidatePath("/dashboard/admin/campus");
  redirect("/dashboard/admin/campus?message=saved");
}
