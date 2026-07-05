import { NextResponse } from "next/server";
import { runTutorOnboardingFollowUps } from "@/lib/communications";

export async function GET(request: Request) {
  const configuredSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (configuredSecret && authHeader !== `Bearer ${configuredSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runTutorOnboardingFollowUps();
  return NextResponse.json({ ok: true, ...result });
}
