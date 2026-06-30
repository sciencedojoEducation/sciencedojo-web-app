import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const message = searchParams.get("error") || "Internal access is inactive or not linked to this account.";
  const supabase = await createClient();

  await supabase.auth.signOut();

  return NextResponse.redirect(`${origin}/login/internal?error=${encodeURIComponent(message)}`);
}
