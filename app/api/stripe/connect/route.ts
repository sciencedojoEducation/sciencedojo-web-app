import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy", {
  apiVersion: "2024-12-18.acacia" as any,
});

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { searchParams } = new URL(req.url);
    if (searchParams.get("reset") === "true") {
      if (user) {
        console.log(`[Stripe DEBUG] GET Reset: Clearing ID for logged in user ${user.id}`);
        await supabase.from("tutors").update({ stripe_account_id: null, stripe_onboarding_complete: false }).eq("id", user.id);
      } else {
        return NextResponse.json({ error: "Please log in as tutor first in this browser." }, { status: 401 });
      }
      return NextResponse.redirect(`${new URL(req.url).origin}/dashboard/tutor/earnings`);
    }
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const forceReset = searchParams.get("reset") === "true";

    // Fetch tutor record
    const { data: tutor, error: fetchError } = await supabase
      .from("tutors")
      .select("stripe_account_id")
      .eq("id", user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    let accountId = forceReset ? null : tutor?.stripe_account_id;

    if (forceReset) {
      console.log("[Stripe DEBUG] Force reset requested. Clearing ID from database.");
      await supabase.from("tutors").update({ stripe_account_id: null, stripe_onboarding_complete: false }).eq("id", user.id);
    }

    console.log(`[Stripe DEBUG] Current ID: ${accountId || "NONE"}`);

    // Verify account still exists on Stripe if we have an ID
    if (accountId) {
      try {
        const existingAccount = await stripe.accounts.retrieve(accountId);
        console.log(`[Stripe DEBUG] Retrieved account ${accountId}. Details submitted: ${existingAccount.details_submitted}`);

        // If they've already completed onboarding, mark them as done in DB
        if (existingAccount.details_submitted && !tutor?.stripe_account_id) {
          await supabase.from("tutors").update({ stripe_onboarding_complete: true }).eq("id", user.id);
        }
      } catch (err: any) {
        if (err.code === 'resource_missing' || err.status === 404) {
          console.warn(`[Stripe DEBUG] ID ${accountId} not found (404). Resetting...`);
          accountId = null;
          await supabase.from("tutors").update({ stripe_account_id: null, stripe_onboarding_complete: false }).eq("id", user.id);
        } else {
          throw err;
        }
      }
    }

    // Create a new Express account using the tutor's real email
    if (!accountId) {
      const tutorEmail = user.email!;
      console.log(`[Stripe DEBUG] Creating Express account for real user: ${tutorEmail}`);
      const account = await stripe.accounts.create({
        type: "express",
        email: tutorEmail,
        capabilities: {
          transfers: { requested: true },
        },
        business_type: "individual",
        business_profile: {
          url: "https://sciencedojo.com",
          product_description: "1-to-1 online tutoring sessions delivered via the ScienceDojo platform.",
          mcc: "8299", // MCC code for "Schools and Educational Services"
        },
        settings: {
          payouts: {
            schedule: {
              interval: "monthly",
              monthly_anchor: 1, // 1st of each month
            },
          },
        },
        metadata: {
          supabase_user_id: user.id,
        },
      });
      accountId = account.id;

      await supabase.from("tutors").update({
        stripe_account_id: accountId,
        stripe_onboarding_complete: false,
      }).eq("id", user.id);

      console.log(`[Stripe DEBUG] New Express Account Created: ${accountId}`);
    }

    // Generate onboarding link
    console.log(`[Stripe DEBUG] Generating onboarding link for ${accountId}...`);
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${req.headers.get("origin")}/dashboard/tutor/earnings`,
      return_url: `${req.headers.get("origin")}/api/stripe/connect/callback?account_id=${accountId}`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    console.error("[Stripe Connect] Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to initialize Stripe' }, { status: 500 });
  }
}
