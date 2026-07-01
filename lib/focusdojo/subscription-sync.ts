import "server-only";

import Stripe from "stripe";
import { FOCUSDOJO_PRO_PRODUCT_KEY } from "@/lib/focusdojo/access-levels";
import { createAdminClient } from "@/utils/supabase/admin";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || "sk_test_dummy_key_do_not_use",
);

export type FocusDojoPlan = "monthly" | "yearly";

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

type FocusDojoSubscriptionPayload = {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string;
  product_key: typeof FOCUSDOJO_PRO_PRODUCT_KEY;
  status: Stripe.Subscription.Status;
  plan: FocusDojoPlan | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
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

function getSupabaseErrorDetails(error: unknown) {
  if (!error || typeof error !== "object") {
    return { message: String(error) };
  }

  const record = error as Record<string, unknown>;
  return {
    message: record.message,
    code: record.code,
    details: record.details,
    hint: record.hint,
  };
}

function formatSupabaseError(error: unknown) {
  return JSON.stringify(getSupabaseErrorDetails(error));
}

function isMissingSubscriptionsTableError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const record = error as Record<string, unknown>;
  return (
    record.code === "PGRST205" &&
    typeof record.message === "string" &&
    record.message.includes("public.subscriptions")
  );
}

async function getStripeCustomerEmail(customerId: string | null) {
  if (!customerId) return null;

  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return null;
    return customer.email?.toLowerCase() || null;
  } catch (error) {
    console.error("[focusdojo-sync] customer email lookup failed", {
      customerId,
      error: error instanceof Error ? error.message : error,
    });
    return null;
  }
}

async function ensureProfileForSubscription(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  email: string | null,
) {
  const { data: profile, error: selectError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (selectError) {
    console.error(
      `[focusdojo-sync] profile lookup failed for ${userId}: ${formatSupabaseError(
        selectError,
      )}`,
    );
    throw new Error(`Profile lookup failed: ${formatSupabaseError(selectError)}`);
  }

  if (profile) return;

  const profilePayload = {
    id: userId,
    email,
    role: "user",
  };
  const { error: insertError } = await supabase
    .from("profiles")
    .insert(profilePayload);

  if (!insertError) {
    console.log("[focusdojo-sync] missing profile created for subscription", {
      userId,
      emailPresent: Boolean(email),
    });
    return;
  }

  console.error(
    `[focusdojo-sync] missing profile creation failed for ${userId}: ${formatSupabaseError(
      insertError,
    )}`,
  );
  throw new Error(
    `Profile creation failed before subscription sync: ${formatSupabaseError(
      insertError,
    )}`,
  );
}

async function saveFocusDojoSubscription(
  supabase: ReturnType<typeof createAdminClient>,
  payload: FocusDojoSubscriptionPayload,
) {
  const upsertByStripeId = await supabase.from("subscriptions").upsert(payload, {
    onConflict: "stripe_subscription_id",
  });

  if (!upsertByStripeId.error) {
    return;
  }

  if (isMissingSubscriptionsTableError(upsertByStripeId.error)) {
    console.warn(
      `[focusdojo-sync] subscriptions table missing; apply sql/044_focusdojo_subscriptions.sql: ${formatSupabaseError(
        upsertByStripeId.error,
      )}`,
    );
    return "subscriptions_table_missing" as const;
  }

  console.error(
    `[focusdojo-sync] subscription upsert by Stripe id failed: ${formatSupabaseError(
      upsertByStripeId.error,
    )}`,
  );

  const duplicateProductRow =
    upsertByStripeId.error.code === "23505" ||
    upsertByStripeId.error.message.includes("subscriptions_user_product_key");

  if (!duplicateProductRow) {
    throw new Error(
      `FocusDojo subscription upsert failed: ${formatSupabaseError(
        upsertByStripeId.error,
      )}`,
    );
  }

  const updateByProduct = await supabase
    .from("subscriptions")
    .update(payload)
    .eq("user_id", payload.user_id)
    .eq("product_key", payload.product_key)
    .select("id");

  if (updateByProduct.error) {
    console.error(
      `[focusdojo-sync] subscription update by product failed: ${formatSupabaseError(
        updateByProduct.error,
      )}`,
    );
    throw new Error(
      `FocusDojo subscription update failed: ${formatSupabaseError(
        updateByProduct.error,
      )}`,
    );
  }

  if (updateByProduct.data && updateByProduct.data.length > 0) {
    return;
  }

  throw new Error(
    "FocusDojo subscription update found a duplicate product row but could not update it.",
  );
}

export function getStripeSubscriptionIdFromInvoice(invoice: Stripe.Invoice) {
  const invoiceWithSubscription = invoice as StripeInvoiceWithSubscription;
  return stripeId(invoiceWithSubscription.subscription);
}

export async function retrieveStripeSubscription(subscriptionId: string) {
  return stripe.subscriptions.retrieve(subscriptionId);
}

export async function upsertFocusDojoSubscriptionFromStripeSubscription(
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
  const productKey = metadata.product_key || null;

  if (productKey !== FOCUSDOJO_PRO_PRODUCT_KEY) {
    console.log("[focusdojo-sync] skipped non-FocusDojo subscription", {
      subscriptionId: subscription.id,
      customerId: stripeId(subscription.customer),
      productKey,
    });
    return { synced: false as const, reason: "not_focusdojo_pro" };
  }

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
    console.error("[focusdojo-sync] subscription missing user_id", {
      subscriptionId: subscription.id,
      customerId: stripeId(subscription.customer),
      productKey,
    });
    return { synced: false as const, reason: "missing_user_id" };
  }

  const currentPeriodStart =
    subscriptionWithPeriods.current_period_start ?? item?.current_period_start;
  const currentPeriodEnd =
    subscriptionWithPeriods.current_period_end ?? item?.current_period_end;
  const priceId = item?.price?.id ?? null;
  const plan = inferFocusDojoPlan(metadata.plan, priceId);
  const customerId = stripeId(subscription.customer);
  const customerEmail = await getStripeCustomerEmail(customerId);

  console.log("[focusdojo-sync] subscription detected", {
    subscriptionId: subscription.id,
    customerId,
    userId,
    productKey,
    status: subscription.status,
    plan,
  });

  await ensureProfileForSubscription(supabase, userId, customerEmail);

  const saveResult = await saveFocusDojoSubscription(supabase, {
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    product_key: FOCUSDOJO_PRO_PRODUCT_KEY,
    status: subscription.status,
    plan,
    current_period_start: unixToIso(currentPeriodStart),
    current_period_end: unixToIso(currentPeriodEnd),
    cancel_at_period_end: subscription.cancel_at_period_end,
  });

  if (saveResult === "subscriptions_table_missing") {
    return {
      synced: false as const,
      reason: "subscriptions_table_missing",
    };
  }

  console.log("[focusdojo-sync] subscription upsert succeeded", {
    subscriptionId: subscription.id,
    userId,
    status: subscription.status,
    plan,
  });

  return {
    synced: true as const,
    subscriptionId: subscription.id,
    userId,
    status: subscription.status,
    plan,
  };
}

export async function syncFocusDojoSubscriptionFromStripeSubscriptionId(
  subscriptionId: string,
  sessionMetadata?: Stripe.Metadata | null,
) {
  const subscription = await retrieveStripeSubscription(subscriptionId);
  return upsertFocusDojoSubscriptionFromStripeSubscription(
    subscription,
    sessionMetadata,
  );
}

export async function syncFocusDojoCheckoutSessionForUser(
  sessionId: string,
  userId: string,
) {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const metadata = session.metadata || {};
  const sessionSubscriptionId = stripeId(
    session.subscription as string | Stripe.Subscription | null,
  );

  console.log("[focusdojo-sync] return session received", {
    sessionId: session.id,
    mode: session.mode,
    userId,
    metadataUserId: metadata.user_id,
    productKey: metadata.product_key,
    subscriptionId: sessionSubscriptionId,
  });

  if (session.mode !== "subscription") {
    console.error("[focusdojo-sync] return session rejected: not subscription", {
      sessionId: session.id,
      mode: session.mode,
    });
    return { synced: false as const, reason: "not_subscription_session" };
  }

  if (metadata.product_key !== FOCUSDOJO_PRO_PRODUCT_KEY) {
    console.error("[focusdojo-sync] return session rejected: wrong product", {
      sessionId: session.id,
      productKey: metadata.product_key,
    });
    return { synced: false as const, reason: "wrong_product" };
  }

  if (metadata.user_id !== userId) {
    console.error("[focusdojo-sync] return session rejected: user mismatch", {
      sessionId: session.id,
      metadataUserId: metadata.user_id,
      currentUserId: userId,
    });
    return { synced: false as const, reason: "user_mismatch" };
  }

  if (!sessionSubscriptionId) {
    console.error("[focusdojo-sync] return session rejected: missing subscription", {
      sessionId: session.id,
    });
    return { synced: false as const, reason: "missing_subscription" };
  }

  return syncFocusDojoSubscriptionFromStripeSubscriptionId(
    sessionSubscriptionId,
    session.metadata,
  );
}
