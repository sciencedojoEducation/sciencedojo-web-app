import { NextResponse } from "next/server";
import { generateAndQueueDailyPost } from "@/lib/communityContent";
import { checkCronAuthorization } from "@/lib/cronAuth";

export async function GET(request: Request) {
  const authorizationFailure = checkCronAuthorization(request.headers.get("authorization"));
  if (authorizationFailure) {
    const { status, ...body } = authorizationFailure;
    return NextResponse.json(body, { status });
  }

  try {
    const result = await generateAndQueueDailyPost();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[cron] daily-community-post:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
