import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getBookingById } from "@/lib/supabase-queries";
import { createClient } from "@/utils/supabase/server";
import { isFeatureEnabled } from "@/lib/feature-flags";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "sk_test_dummy_key_do_not_use";
const stripe = new Stripe(stripeSecretKey);

export async function POST(req: Request) {
  try {
    const paymentsEnabled = await isFeatureEnabled("stripe_payments_enabled");
    if (!paymentsEnabled) {
      return NextResponse.json(
        { error: "Online payments are being prepared. Please contact ScienceDojo support for help." },
        { status: 503 },
      );
    }

    const { bookingId, returnUrl } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: "Missing booking ID." }, { status: 400 });
    }

    const defaultReturnUrl = `${req.headers.get("origin")}/dashboard/student`;
    const finalReturnUrl = returnUrl || defaultReturnUrl;

    const booking = await getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    const supabase = await createClient();

    // Fetch platform fee (default 25% if not set)
    const { data: settings } = await supabase
      .from("platform_settings")
      .select("platform_fee_percent")
      .limit(1)
      .single();
    const platformFeePercent = settings?.platform_fee_percent ?? 25;

    // Fetch the tutor's Stripe account ID
    const { data: tutor } = await supabase
      .from("tutors")
      .select("stripe_account_id, stripe_onboarding_complete")
      .eq("id", booking.tutor_id)
      .maybeSingle();

    const tutorStripeAccountId = tutor?.stripe_account_id;

    // Check if it's part of a recurrence group
    let bookingsToPayFor = [booking];

    if (booking.recurrence_group_id) {
      const { data: groupBookings } = await supabase
        .from("bookings")
        .select("*")
        .eq("recurrence_group_id", booking.recurrence_group_id)
        .eq("status", "accepted");

      if (groupBookings && groupBookings.length > 0) {
        bookingsToPayFor = groupBookings;
      }
    }

    const bookingIdsToConfirm = bookingsToPayFor.map(b => b.id).join(',');
    const totalQuantity = bookingsToPayFor.length;
    const unitPriceInPence = Math.round(Number(booking.price_at_booking) * 100);
    const totalAmountInPence = unitPriceInPence * totalQuantity;
    const platformFeeInPence = Math.round(totalAmountInPence * (platformFeePercent / 100));

    console.log(`[Stripe Checkout] Booking(s): ${bookingIdsToConfirm}`);
    console.log(`[Stripe Checkout] Total: £${(totalAmountInPence / 100).toFixed(2)}, Platform fee (${platformFeePercent}%): £${(platformFeeInPence / 100).toFixed(2)}`);
    console.log(`[Stripe Checkout] Tutor Stripe account: ${tutorStripeAccountId || 'NONE (no connect)'}`);

    // Monthly payout model: all money collects to the platform Stripe account.
    // Admin triggers manual transfers to tutors at end of each month via the Payouts page.
    // No automatic transfer_data split at checkout.
    console.log(`[Stripe Checkout] Collecting £${(totalAmountInPence / 100).toFixed(2)} to platform account. Tutor payout scheduled monthly.`);


    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `Tutoring Session: ${booking.subject}` + (totalQuantity > 1 ? ` (${totalQuantity}-week block)` : ''),
              description: `With Expert Tutor: ${booking.tutor_name}`,
            },
            unit_amount: unitPriceInPence,
          },
          quantity: totalQuantity,
        },
      ],
      mode: "payment",

      metadata: {
        bookingId: bookingIdsToConfirm,
      },
      success_url: `${finalReturnUrl}${finalReturnUrl.includes('?') ? '&' : '?'}success=true&bookingId=${booking.id}`,
      cancel_url: `${finalReturnUrl}${finalReturnUrl.includes('?') ? '&' : '?'}canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("[Stripe] Error creating checkout session:", err);
    const message = err instanceof Error ? err.message : "Unable to create checkout session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
