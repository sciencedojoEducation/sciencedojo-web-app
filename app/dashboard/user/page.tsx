import Link from "next/link";
import { redirect } from "next/navigation";
import { getFocusDojoAccessLevel } from "@/lib/focusdojo/access";
import { FOCUSDOJO_PRO_PRODUCT_KEY } from "@/lib/focusdojo/access-levels";
import { syncFocusDojoSubscriptionFromStripeSubscriptionId } from "@/lib/focusdojo/subscription-sync";
import { createClient } from "@/utils/supabase/server";
import ManageFocusDojoSubscriptionButton from "./ManageFocusDojoSubscriptionButton";

export const metadata = {
  title: "My Dojo | ScienceDojo",
  description: "A lightweight dashboard for ScienceDojo tools and account access.",
};

function firstName(name?: string | null) {
  return name?.trim().split(/\s+/)[0] || "there";
}

function formatDate(value?: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

type UserDashboardPageProps = {
  searchParams?: Promise<{ billing?: string | string[] }>;
};

type FocusDojoSubscription = {
  id?: string;
  plan: string | null;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  updated_at?: string | null;
};

function singleParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function getSubscriptionStatusCopy(
  accessLevel: "free" | "basic" | "pro",
  subscription?: FocusDojoSubscription | null,
) {
  if (!subscription) {
    return accessLevel === "basic"
      ? {
          label: "FocusDojo Basic",
          status: "Basic included",
          dateLabel: null,
          description:
            "Included with your ScienceDojo learning. You have 3 themes and all background music.",
        }
      : {
          label: "FocusDojo Free",
          status: "Free",
          dateLabel: null,
          description: "Selected themes and music are available.",
        };
  }

  if (
    (subscription.status === "active" || subscription.status === "trialing") &&
    subscription.cancel_at_period_end
  ) {
    return {
      label: "FocusDojo Pro",
      status: "Cancels soon",
      dateLabel: "Access until",
      description:
        "Your FocusDojo Pro plan is set to cancel. You can keep using Pro until the end of this billing period.",
    };
  }

  if (subscription.status === "active") {
    return {
      label: "FocusDojo Pro",
      status: "Active",
      dateLabel: "Renews",
      description: "Your full FocusDojo environment is unlocked.",
    };
  }

  if (subscription.status === "trialing") {
    return {
      label: "FocusDojo Pro",
      status: "Trialing",
      dateLabel: "Trial ends",
      description: "Your full FocusDojo environment is unlocked during your trial.",
    };
  }

  if (subscription.status === "past_due") {
    return {
      label: accessLevel === "pro" ? "FocusDojo Pro" : "FocusDojo Free",
      status: "Payment issue",
      dateLabel: "Access review",
      description:
        "Please manage your billing details to keep FocusDojo Pro active.",
    };
  }

  return {
    label: accessLevel === "basic" ? "FocusDojo Basic" : "FocusDojo Free",
    status: "Ended",
    dateLabel: "Ended",
    description: "Your FocusDojo Pro plan has ended.",
  };
}

async function getFocusDojoSubscription(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const result = await supabase
    .from("subscriptions")
    .select(
      "id, plan, status, current_period_end, cancel_at_period_end, stripe_customer_id, stripe_subscription_id, updated_at",
    )
    .eq("user_id", userId)
    .eq("product_key", FOCUSDOJO_PRO_PRODUCT_KEY)
    .order("updated_at", { ascending: false })
    .limit(10);

  if (result.error) {
    return { data: null, error: result.error };
  }

  const rows = (result.data || []) as FocusDojoSubscription[];
  if (rows.length > 1) {
    console.warn("[dashboard-user] duplicate FocusDojo subscriptions found", {
      userId,
      count: rows.length,
      rows: rows.map((row) => ({
        id: row.id,
        status: row.status,
        cancelAtPeriodEnd: row.cancel_at_period_end,
        subscriptionId: row.stripe_subscription_id,
        updatedAt: row.updated_at,
      })),
    });
  }

  const preferred =
    rows.find(
      (row) =>
        Boolean(row.stripe_subscription_id) &&
        ["active", "trialing"].includes(row.status),
    ) ||
    rows.find(
      (row) =>
        Boolean(row.stripe_subscription_id) &&
        ["past_due", "unpaid"].includes(row.status),
    ) ||
    rows[0] ||
    null;

  return { data: preferred, error: null };
}

export default async function UserDashboardPage({
  searchParams,
}: UserDashboardPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const params = searchParams ? await searchParams : {};
  const billingReturned = singleParam(params.billing) === "returned";
  const initialSubscription = await getFocusDojoSubscription(supabase, user.id);
  const shouldRefreshSubscription = Boolean(
    initialSubscription.data?.stripe_subscription_id &&
      ["active", "trialing", "past_due", "unpaid"].includes(
        initialSubscription.data.status,
      ),
  );

  if (shouldRefreshSubscription && initialSubscription.data?.stripe_subscription_id) {
    try {
      const syncResult = await syncFocusDojoSubscriptionFromStripeSubscriptionId(
        initialSubscription.data.stripe_subscription_id,
      );
      console.log("[dashboard-user] FocusDojo subscription refresh result", {
        userId: user.id,
        subscriptionId: initialSubscription.data.stripe_subscription_id,
        ...syncResult,
      });
    } catch (error) {
      console.error("[dashboard-user] billing return sync failed", {
        userId: user.id,
        subscriptionId: initialSubscription.data.stripe_subscription_id,
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  const subscriptionPromise = shouldRefreshSubscription
    ? getFocusDojoSubscription(supabase, user.id)
    : Promise.resolve(initialSubscription);

  const [{ data: profile }, { data: subscription }, accessLevelResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .maybeSingle(),
      subscriptionPromise,
      getFocusDojoAccessLevel(user.id),
    ]);

  const name = profile?.full_name || user.user_metadata?.full_name;
  const subscriptionCopy = getSubscriptionStatusCopy(
    accessLevelResult,
    subscription,
  );
  const accessLabel = subscriptionCopy.label;
  const periodEnd = formatDate(subscription?.current_period_end);
  const billingReturnedMessage =
    billingReturned && subscription?.cancel_at_period_end && periodEnd
      ? `Your FocusDojo Pro plan is set to cancel. You can keep using Pro until ${periodEnd}.`
      : billingReturned
        ? "Your billing details were refreshed."
        : null;
  const canManageSubscription = Boolean(
    subscription?.stripe_customer_id &&
      ["active", "trialing", "past_due", "unpaid"].includes(
        subscription.status,
      ),
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 md:p-8">
      <section className="rounded-3xl border border-primary/10 bg-white p-6 shadow-sm md:p-8">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary/65">
          My Dojo
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-secondary md:text-4xl">
          Welcome, {firstName(name)}.
        </h1>
        <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-secondary/55 md:text-base">
          Use your ScienceDojo account for FocusDojo, subscriptions, and future
          study tools. If you later become a ScienceDojo student, this same
          account keeps your subscription and access history.
        </p>
      </section>

      {billingReturnedMessage ? (
        <div className="rounded-2xl border border-primary/15 bg-primary/5 px-5 py-4 text-sm font-bold leading-6 text-secondary">
          {billingReturnedMessage}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-secondary/10 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/65">
            FocusDojo
          </p>
          <h2 className="mt-2 text-xl font-black text-secondary">
            {accessLabel}
          </h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-secondary/55">
            Open your calm timer and study atmosphere.
          </p>
          <Link
            href="/focus-dojo"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-secondary px-5 text-sm font-black text-white transition hover:bg-secondary/90"
          >
            Open FocusDojo
          </Link>
        </div>

        <div className="rounded-2xl border border-secondary/10 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/65">
            Subscription
          </p>
          <h2 className="mt-2 text-xl font-black text-secondary">
            {accessLabel}
          </h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-secondary/55">
            {subscriptionCopy.description}
          </p>
          {subscription ? (
            <dl className="mt-4 grid gap-2 text-sm font-bold text-secondary/60">
              {subscription.plan ? (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-secondary/[0.03] px-3 py-2">
                  <dt>Plan</dt>
                  <dd className="capitalize text-secondary">{subscription.plan}</dd>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-3 rounded-xl bg-secondary/[0.03] px-3 py-2">
                <dt>Status</dt>
                <dd className="capitalize text-secondary">
                  {subscriptionCopy.status}
                </dd>
              </div>
              {periodEnd ? (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-secondary/[0.03] px-3 py-2">
                  <dt>{subscriptionCopy.dateLabel}</dt>
                  <dd className="text-secondary">{periodEnd}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}
          {canManageSubscription ? (
            <>
              <p className="mt-4 text-sm font-semibold leading-6 text-secondary/55">
                You can update payment details, view invoices, or cancel your
                subscription securely through Stripe.
              </p>
              <ManageFocusDojoSubscriptionButton />
            </>
          ) : (
            <Link
              href="/focus-dojo/pricing"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl border border-secondary/10 bg-white px-5 text-sm font-black text-secondary transition hover:border-primary/30 hover:text-primary"
            >
              View pricing
            </Link>
          )}
        </div>

        <div className="rounded-2xl border border-secondary/10 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/65">
            PracticeDojo
          </p>
          <h2 className="mt-2 text-xl font-black text-secondary">
            Practice tools
          </h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-secondary/55">
            Generate structured practice when you want a study companion.
          </p>
          <Link
            href="/ai-practice-studio"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl border border-secondary/10 bg-white px-5 text-sm font-black text-secondary transition hover:border-primary/30 hover:text-primary"
          >
            Open PracticeDojo
          </Link>
        </div>

        <div
          id="account"
          className="rounded-2xl border border-secondary/10 bg-white p-5 shadow-sm"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/65">
            Account
          </p>
          <h2 className="mt-2 text-xl font-black text-secondary">
            {profile?.email || user.email}
          </h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-secondary/55">
            Your account can later be linked to ScienceDojo student, parent, or
            tutor access without creating a second login.
          </p>
        </div>
      </section>
    </div>
  );
}
