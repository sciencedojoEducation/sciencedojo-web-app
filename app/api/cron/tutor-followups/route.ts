import { NextResponse } from "next/server";
import { runTutorOnboardingFollowUps } from "@/lib/communications";
import { checkCronAuthorization } from "@/lib/cronAuth";

export async function GET(request: Request) {
  const authorizationFailure = checkCronAuthorization(request.headers.get("authorization"));
  if (authorizationFailure) {
    const { status, ...body } = authorizationFailure;
    return NextResponse.json(body, { status });
  }

  const result = await runTutorOnboardingFollowUps();
  return NextResponse.json({ ok: true, ...result });
}
