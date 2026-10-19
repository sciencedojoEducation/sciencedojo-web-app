import { campusSession, campusJson } from "@/lib/campus/server";
import { sameOrigin, readCampusJson } from "@/lib/campus/security";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return campusJson({ error: "Origin denied" }, 403);
  const session = await campusSession();
  if (!session) return campusJson({ error: "Campus access required" }, 403);
  const body = await readCampusJson(request);
  if (
    !body ||
    typeof body.target !== "string" ||
    !/^[0-9a-f-]{36}$/i.test(body.target)
  )
    return campusJson({ error: "Invalid participant" }, 400);
  let result;
  if (body.action === "block" || body.action === "unblock")
    result = await session.supabase.rpc("campus_block", {
      target_id: body.target,
      blocked: body.action === "block",
    });
  else if (
    body.action === "report" &&
    typeof body.reason === "string" &&
    ["harassment", "inappropriate-behaviour", "technical", "other"].includes(
      body.reason,
    )
  )
    result = await session.supabase.rpc("campus_report", {
      target_id: body.target,
      report_reason: body.reason,
    });
  else return campusJson({ error: "Invalid action" }, 400);
  if (result.error)
    return campusJson(
      {
        error:
          "Unable to save this action. Please contact the session supervisor.",
      },
      400,
    );
  return campusJson({ saved: true });
}
