import { NextResponse } from "next/server";
import { generateAndQueueDailyPost } from "@/lib/communityContent";

export async function GET(request: Request) {
  const configuredSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (configuredSecret && authHeader !== `Bearer ${configuredSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
