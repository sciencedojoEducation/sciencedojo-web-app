import { NextResponse } from "next/server";
import Stripe from "stripe";
import { FOCUSDOJO_PRO_PRODUCT_KEY } from "@/lib/focusdojo/access-levels";
import { createClient } from "@/utils/supabase/server";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || "sk_test_dummy_key_do_not_use",
);

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please log in to manage your subscription." },
        { status: 401 },
      );
    }

    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id, stripe_subscription_id, status")
      .eq("user_id", user.id)
      .eq("product_key", FOCUSDOJO_PRO_PRODUCT_KEY)
      .in("status", ["active", "trialing", "past_due", "unpaid"])
      .maybeSingle();

    if (error) {
      console.error("[focusdojo-billing-portal] subscription lookup failed", {
        userId: user.id,
        error,
      });
      return NextResponse.json(
        { error: "We could not open billing management right now. Please try again." },
        { status: 500 },
      );
    }

    if (!subscription) {
      return NextResponse.json(
        { error: "No active FocusDojo Pro subscription was found." },
        { status: 404 },
      );
    }

    if (!subscription.stripe_customer_id) {
      console.error("[focusdojo-billing-portal] missing Stripe customer ID", {
        userId: user.id,
        subscriptionId: subscription.stripe_subscription_id,
        status: subscription.status,
      });
      return NextResponse.json(
        { error: "We could not find your Stripe billing profile." },
        { status: 409 },
      );
    }

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "";
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${origin}/dashboard/user?billing=returned`,
    });

    console.log("[focusdojo-billing-portal] session created", {
      userId: user.id,
      customerId: subscription.stripe_customer_id,
      subscriptionId: subscription.stripe_subscription_id,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[focusdojo-billing-portal] session creation failed", {
      error: error instanceof Error ? error.message : error,
    });
    return NextResponse.json(
      { error: "We could not open billing management right now. Please try again." },
      { status: 500 },
    );
  }
}
