import { NextResponse } from "next/server";
import Stripe from "stripe";
import { FOCUSDOJO_PRO_PRODUCT_KEY } from "@/lib/focusdojo/access-levels";
import { createClient } from "@/utils/supabase/server";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || "sk_test_dummy_key_do_not_use",
);

type FocusDojoPlan = "monthly" | "yearly";

const PRICE_IDS: Record<FocusDojoPlan, string | undefined> = {
  monthly: process.env.FOCUSDOJO_PRO_MONTHLY_PRICE_ID,
  yearly: process.env.FOCUSDOJO_PRO_YEARLY_PRICE_ID,
};

function isFocusDojoPlan(value: unknown): value is FocusDojoPlan {
  return value === "monthly" || value === "yearly";
}

export async function POST(req: Request) {
  try {
    const { plan } = (await req.json()) as { plan?: unknown };
    if (!isFocusDojoPlan(plan)) {
      return NextResponse.json({ error: "Choose monthly or yearly." }, { status: 400 });
    }

    const priceId = PRICE_IDS[plan];
    if (!priceId) {
      return NextResponse.json(
        { error: "FocusDojo Pro pricing is not configured yet." },
        { status: 500 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "";

    if (!user) {
      const next = encodeURIComponent("/focus-dojo/pricing");
      return NextResponse.json(
        { loginUrl: `/signup?role=user&next=${next}`, error: "Please log in to upgrade." },
        { status: 401 },
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        product_key: FOCUSDOJO_PRO_PRODUCT_KEY,
        plan,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          product_key: FOCUSDOJO_PRO_PRODUCT_KEY,
          plan,
        },
      },
      success_url: `${origin}/focus-dojo?upgraded=focusdojo_pro`,
      cancel_url: `${origin}/focus-dojo/pricing?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("[FocusDojo Checkout] Error:", err);
    const message =
      err instanceof Error ? err.message : "Unable to start FocusDojo checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
