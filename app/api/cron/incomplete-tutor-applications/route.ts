import { NextResponse } from "next/server";
import { runIncompleteTutorApplicationReminders } from "@/lib/communications";

export async function GET(request: Request) {
  const configuredSecret = process.env.CRON_SECRET;
  if (!configuredSecret) {
    console.error("[cron] incomplete-tutor-applications: CRON_SECRET is not configured");
    return NextResponse.json({ ok: false, error: "Cron is not configured" }, { status: 500 });
  }

  if (request.headers.get("authorization") !== `Bearer ${configuredSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runIncompleteTutorApplicationReminders();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[cron] incomplete-tutor-applications:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
