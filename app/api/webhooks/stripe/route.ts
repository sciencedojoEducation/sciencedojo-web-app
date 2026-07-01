import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createMeetingUrl } from '@/lib/meetings';
import { createCalendarEvent } from '@/lib/calendar';
import { FOCUSDOJO_PRO_PRODUCT_KEY } from '@/lib/focusdojo/access-levels';
import { findOrCreateClass } from '@/lib/class-queries';
import { createAdminClient } from '@/utils/supabase/admin';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "sk_test_dummy";
const stripe = new Stripe(stripeSecretKey);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_dummy";

type FocusDojoPlan = "monthly" | "yearly";
type StripeSubscriptionWithPeriods = Stripe.Subscription & {
  current_period_start?: number | null;
  current_period_end?: number | null;
  items?: {
    data?: Array<{
      current_period_start?: number | null;
      current_period_end?: number | null;
      price?: {
        id?: string | null;
      };
    }>;
  };
};
type StripeInvoiceWithSubscription = Stripe.Invoice & {
  subscription?: string | Stripe.Subscription | null;
};

function unixToIso(value: number | null | undefined) {
  return value ? new Date(value * 1000).toISOString() : null;
}

function stripeId(value: string | { id: string } | null | undefined) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function inferFocusDojoPlan(
  metadataPlan?: string | null,
  priceId?: string | null,
): FocusDojoPlan | null {
  if (metadataPlan === "monthly" || metadataPlan === "yearly") {
    return metadataPlan;
  }
  if (priceId && priceId === process.env.FOCUSDOJO_PRO_MONTHLY_PRICE_ID) {
    return "monthly";
  }
  if (priceId && priceId === process.env.FOCUSDOJO_PRO_YEARLY_PRICE_ID) {
    return "yearly";
  }
  return null;
}

async function upsertFocusDojoSubscription(
  subscription: Stripe.Subscription,
  sessionMetadata?: Stripe.Metadata | null,
) {
  const supabase = createAdminClient();
  const subscriptionWithPeriods = subscription as StripeSubscriptionWithPeriods;
  const item = subscriptionWithPeriods.items?.data?.[0];
  const metadata = {
    ...(subscription.metadata || {}),
    ...(sessionMetadata || {}),
  };
  let userId = metadata.user_id || null;

  if (!userId) {
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_subscription_id", subscription.id)
      .maybeSingle();
    userId = existing?.user_id ?? null;
  }

  if (!userId) {
    console.error("[Stripe Webhook] FocusDojo subscription missing user_id", subscription.id);
    return;
  }

  const currentPeriodStart =
    subscriptionWithPeriods.current_period_start ?? item?.current_period_start;
  const currentPeriodEnd =
    subscriptionWithPeriods.current_period_end ?? item?.current_period_end;
  const priceId = item?.price?.id ?? null;
  const plan = inferFocusDojoPlan(metadata.plan, priceId);

  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: stripeId(subscription.customer),
      stripe_subscription_id: subscription.id,
      product_key: FOCUSDOJO_PRO_PRODUCT_KEY,
      status: subscription.status,
      plan,
      current_period_start: unixToIso(currentPeriodStart),
      current_period_end: unixToIso(currentPeriodEnd),
      cancel_at_period_end: subscription.cancel_at_period_end,
    },
    { onConflict: "user_id,product_key" },
  );

  if (error) {
    console.error("[Stripe Webhook] FocusDojo subscription upsert failed:", error.message);
  }
}

async function handleFocusDojoInvoice(invoice: Stripe.Invoice) {
  const invoiceWithSubscription = invoice as StripeInvoiceWithSubscription;
  const subscriptionId = stripeId(invoiceWithSubscription.subscription);
  if (!subscriptionId) return;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  if (subscription.metadata?.product_key !== FOCUSDOJO_PRO_PRODUCT_KEY) {
    return;
  }
  await upsertFocusDojoSubscription(subscription);
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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { bookingId, product_key } = session.metadata || {};

    const sessionSubscriptionId = stripeId(
      session.subscription as string | Stripe.Subscription | null,
    );
    if (product_key === FOCUSDOJO_PRO_PRODUCT_KEY && sessionSubscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(
        sessionSubscriptionId,
      );
      await upsertFocusDojoSubscription(subscription, session.metadata);
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
    if (subscription.metadata?.product_key === FOCUSDOJO_PRO_PRODUCT_KEY) {
      await upsertFocusDojoSubscription(subscription);
    }
  } else if (
    event.type === 'invoice.payment_succeeded' ||
    event.type === 'invoice.payment_failed'
  ) {
    const invoice = event.data.object as Stripe.Invoice;
    await handleFocusDojoInvoice(invoice);
  }

  return NextResponse.json({ received: true });
}
