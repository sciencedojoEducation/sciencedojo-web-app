import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy", {
  apiVersion: "2024-12-18.acacia" as any,
});

/**
 * GET /api/stripe/connect/callback
 * Stripe redirects tutors here after completing onboarding.
 * We verify the account is fully submitted and update the DB.
 */
export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const accountId = searchParams.get("account_id");

  if (!accountId) {
    return NextResponse.redirect(`${origin}/dashboard/tutor/earnings?stripe_status=error`);
  }

  try {
    const account = await stripe.accounts.retrieve(accountId);
    const supabase = await createClient();

    if (account.details_submitted) {
      // Mark tutor as fully onboarded
      await supabase
        .from("tutors")
        .update({ stripe_onboarding_complete: true })
        .eq("stripe_account_id", accountId);

      console.log(`[Stripe Callback] Account ${accountId} fully onboarded.`);
      return NextResponse.redirect(`${origin}/dashboard/tutor/earnings?stripe_status=success`);
    } else {
      // Onboarding incomplete — send back to restart
      console.log(`[Stripe Callback] Account ${accountId} onboarding incomplete.`);
      return NextResponse.redirect(`${origin}/dashboard/tutor/earnings?stripe_status=incomplete`);
    }
  } catch (err: any) {
    console.error("[Stripe Callback] Error:", err.message);
    return NextResponse.redirect(`${origin}/dashboard/tutor/earnings?stripe_status=error`);
  }
}
