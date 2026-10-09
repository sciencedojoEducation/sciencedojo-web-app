import { NextResponse } from "next/server";
import { checkCronAuthorization } from "@/lib/cronAuth";
import { runBusinessEnquiryNotifications } from "@/lib/business-enquiries";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const authorizationFailure = checkCronAuthorization(request.headers.get("authorization"));
  if (authorizationFailure) {
    const { status, ...body } = authorizationFailure;
    return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const summary = await runBusinessEnquiryNotifications();
    return NextResponse.json({ ok: summary.unresolved === 0, ...summary }, {
      status: summary.unresolved ? 503 : 200, headers: { "Cache-Control": "no-store" },
    });
  } catch {
    console.error("[business-enquiries] Notification queue processing failed.");
    return NextResponse.json({ ok: false, error: "Notification queue unavailable" }, {
      status: 503, headers: { "Cache-Control": "no-store" },
    });
  }
}
