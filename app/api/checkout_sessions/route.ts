import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getBookingById } from "@/lib/supabase-queries";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "sk_test_dummy_key_do_not_use";
const stripe = new Stripe(stripeSecretKey);

export async function POST(req: Request) {
  try {
    const { bookingId } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: "Missing booking ID." }, { status: 400 });
    }

    const booking = await getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    // Check if it's part of a recurrence group
    let bookingsToPayFor = [booking];
    
    if (booking.recurrence_group_id) {
       // Fetch all accepted bookings in this group
       const { createClient } = await import("@/utils/supabase/server");
       const supabase = await createClient();
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

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: ` Tutoring Session: ${booking.subject}` + (totalQuantity > 1 ? ` (${totalQuantity}-week block)` : ''),
              description: `With Expert Tutor: ${booking.tutor_name}`,
            },
            unit_amount: Math.round(Number(booking.price_at_booking) * 100), // Securely use DB price
          },
          quantity: totalQuantity,
        },
      ],
      mode: "payment",
      metadata: {
        bookingId: bookingIdsToConfirm,
      },
      success_url: `${req.headers.get("origin")}/dashboard/parent?success=true&bookingId=${booking.id}`,
      cancel_url: `${req.headers.get("origin")}/dashboard/parent?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("[Stripe] Error creating checkout session:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
