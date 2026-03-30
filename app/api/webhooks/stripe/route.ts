import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createMeetingUrl } from '@/lib/meetings';
import { createCalendarEvent } from '@/lib/calendar';
import { createClient } from '@/utils/supabase/server';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "sk_test_dummy";
const stripe = new Stripe(stripeSecretKey);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_dummy";

export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get('Stripe-Signature');

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature || '', webhookSecret);
  } catch (err: any) {
    console.error(`[Stripe Webhook Error] ${err.message}`);
    // Support dummy testing
    if (webhookSecret === "whsec_dummy") {
       // Manual simulation block for development
       const mockSession = JSON.parse(payload);
       if (mockSession.type === 'checkout.session.completed') {
          event = mockSession;
       } else {
          return NextResponse.json({ warning: "Invalid signature due to dummy keys." });
       }
    } else {
       return NextResponse.json({ error: err.message }, { status: 400 });
    }
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { bookingId } = session.metadata || {};
    
    if (bookingId) {
      const supabase = await createClient();
      
      const ids = bookingId.split(',');

      // For multiple bookings, we can loop over them or update them in bulk
      for (const id of ids) {
        // 1. Generate meeting link
        const meetingUrl = await createMeetingUrl(id);
        
        // 2. Update Booking record
        const { error } = await supabase
          .from("bookings")
          .update({ 
            status: "confirmed",
            meeting_url: meetingUrl,
            payment_intent_id: session.payment_intent as string
          })
          .eq("id", id);

        if (error) console.error(`[Stripe Webhook] Supabase update failed for ${id}:`, error.message);
        else {
          console.log(`[Stripe Webhook] Booking ${id} confirmed.`);
          
          // 3. Create Google Calendar invite (Automated invite if configured)
          await createCalendarEvent(id);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
