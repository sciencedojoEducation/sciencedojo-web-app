import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createMeetingUrl } from '@/lib/meetings';
import { createCalendarEvent } from '@/lib/calendar';
import { FOCUSDOJO_PRO_PRODUCT_KEY } from '@/lib/focusdojo/access-levels';
import {
  getStripeSubscriptionIdFromInvoice,
  syncFocusDojoSubscriptionFromStripeSubscriptionId,
  upsertFocusDojoSubscriptionFromStripeSubscription,
} from '@/lib/focusdojo/subscription-sync';
import { findOrCreateClass } from '@/lib/class-queries';
import { createAdminClient } from '@/utils/supabase/admin';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "sk_test_dummy";
const stripe = new Stripe(stripeSecretKey);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_dummy";

function stripeId(value: string | { id: string } | null | undefined) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

async function handleFocusDojoInvoice(invoice: Stripe.Invoice) {
  const subscriptionId = getStripeSubscriptionIdFromInvoice(invoice);
  if (!subscriptionId) return;
  await syncFocusDojoSubscriptionFromStripeSubscriptionId(subscriptionId);
}

export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get('Stripe-Signature');

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature || '', webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid Stripe signature.";
    console.error(`[Stripe Webhook Error] ${message}`);
    // Support dummy testing
    if (webhookSecret === "whsec_dummy") {
       // Manual simulation block for development
       const mockSession = JSON.parse(payload) as Stripe.Event;
       if (mockSession.type === 'checkout.session.completed') {
          event = mockSession;
       } else {
          return NextResponse.json({ warning: "Invalid signature due to dummy keys." });
       }
    } else {
       return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  console.log("[stripe-webhook] received", { type: event.type });

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { bookingId, product_key } = session.metadata || {};

    const sessionSubscriptionId = stripeId(
      session.subscription as string | Stripe.Subscription | null,
    );
    console.log("[stripe-webhook] checkout session completed", {
      productKey: product_key,
      focusDojoProductDetected: product_key === FOCUSDOJO_PRO_PRODUCT_KEY,
      subscriptionId: sessionSubscriptionId,
      userId: session.metadata?.user_id,
      bookingId,
    });

    if (
      session.mode === "subscription" &&
      product_key === FOCUSDOJO_PRO_PRODUCT_KEY &&
      sessionSubscriptionId
    ) {
      await syncFocusDojoSubscriptionFromStripeSubscriptionId(
        sessionSubscriptionId,
        session.metadata,
      );
      return NextResponse.json({ received: true });
    }
    
    if (bookingId) {
      const supabase = createAdminClient();
      
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
            meeting_url: meetingUrl.joinUrl,
            payment_intent_id: session.payment_intent as string
          })
          .eq("id", id);

        if (error) console.error(`[Stripe Webhook] Supabase update failed for ${id}:`, error.message);
        else {
          console.log(`[Stripe Webhook] Booking ${id} confirmed.`);
          
          // 3. Create Google Calendar invite (Automated invite if configured)
          await createCalendarEvent(id);

          // 4. Auto-create class for this booking
          try {
            const { data: bookingData } = await supabase
              .from("bookings")
              .select("student_id, tutor_id, subject")
              .eq("id", id)
              .single();

            if (bookingData) {
              const classId = await findOrCreateClass(
                bookingData.student_id,
                bookingData.tutor_id,
                bookingData.subject
              );

              // Link booking to class
              await supabase
                .from("bookings")
                .update({ class_id: classId })
                .eq("id", id);

              console.log(`[Stripe Webhook] Booking ${id} linked to class ${classId}`);
            }
          } catch (classErr) {
            console.error(`[Stripe Webhook] Class creation failed for ${id}:`, classErr);
            // Non-blocking — booking is still confirmed
          }
        }
      }
    }
  } else if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    console.log("[stripe-webhook] subscription event", {
      type: event.type,
      productKey: subscription.metadata?.product_key,
      focusDojoProductDetected:
        subscription.metadata?.product_key === FOCUSDOJO_PRO_PRODUCT_KEY,
      subscriptionId: subscription.id,
      customerId: stripeId(subscription.customer),
      userId: subscription.metadata?.user_id,
      status: subscription.status,
    });
    if (subscription.metadata?.product_key === FOCUSDOJO_PRO_PRODUCT_KEY) {
      await upsertFocusDojoSubscriptionFromStripeSubscription(subscription);
    }
  } else if (
    event.type === 'invoice.paid' ||
    event.type === 'invoice.payment_succeeded' ||
    event.type === 'invoice.payment_failed'
  ) {
    const invoice = event.data.object as Stripe.Invoice;
    console.log("[stripe-webhook] invoice event", {
      type: event.type,
      subscriptionId: getStripeSubscriptionIdFromInvoice(invoice),
    });
    await handleFocusDojoInvoice(invoice);
  }

  return NextResponse.json({ received: true });
}
