import Link from "next/link";
import { redirect } from "next/navigation";
import { getFocusDojoAccessLevel } from "@/lib/focusdojo/access";
import { FOCUSDOJO_PRO_PRODUCT_KEY } from "@/lib/focusdojo/access-levels";
import { syncFocusDojoSubscriptionFromStripeSubscriptionId } from "@/lib/focusdojo/subscription-sync";
import { createClient } from "@/utils/supabase/server";
import ManageFocusDojoSubscriptionButton from "./ManageFocusDojoSubscriptionButton";
import { HomePrimaryAction, HomeSectionHeading } from "@/components/DashboardHomeUI";
import { Timer } from "lucide-react";

export const metadata = {
  title: "My Dojo | ScienceDojo",
  description: "A lightweight dashboard for ScienceDojo tools and account access.",
};

function formatDate(value?: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
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
        .select("email")
        .eq("id", user.id)
        .maybeSingle(),
      subscriptionPromise,
      getFocusDojoAccessLevel(user.id),
    ]);

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
    <div data-role="user" className="dashboard-home mx-auto max-w-5xl space-y-6 px-3 py-5 sm:px-6 md:px-8 md:pb-12 md:pt-7">
      {billingReturnedMessage ? (
        <div role="status" className="rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-accent-soft)] px-5 py-4 text-sm leading-6 text-[var(--theme-ink)]">
          {billingReturnedMessage}
        </div>
      ) : null}
      {["past_due", "unpaid"].includes(subscription?.status || "") && (
        <div role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950">
          <span className="font-semibold">Your FocusDojo payment needs attention.</span>{" "}
          <a href="#user-subscription" className="font-semibold underline underline-offset-2">Manage billing</a>
        </div>
      )}

      <section aria-label="Your study tools" className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(17rem,1fr)]">
        <HomePrimaryAction
          eyebrow="Your study space"
          title="FocusDojo"
          description="Open your calm timer and study atmosphere when you're ready to focus."
          href="/focus-dojo"
          label="Start focus"
          detail={accessLabel}
          icon={<Timer size={24} strokeWidth={1.7} />}
        />
        <div className="home-surface flex flex-col justify-between sm:p-7">
          <div>
            <p className="home-eyebrow">PracticeDojo</p>
            <h2 className="home-section-title">Practise at your own pace</h2>
            <p className="home-section-description">Generate structured questions whenever you want a study companion.</p>
          </div>
          <Link href="/ai-practice-studio" className="home-text-link mt-5">Open PracticeDojo →</Link>
        </div>
      </section>

      <section aria-label="Your plan and account">
        <HomeSectionHeading eyebrow="Account" title="Plan and access" description="Your current access and account details, in one place." />
        <div className="grid gap-4 md:grid-cols-2">
        <div id="user-subscription" className="home-surface scroll-mt-6 sm:p-6">
          <p className="home-eyebrow">Subscription</p>
          <h3 className="home-section-title">{accessLabel}</h3>
          <p className="home-section-description">{subscriptionCopy.description}</p>
          {subscription ? (
            <dl className="mt-5 divide-y divide-[var(--theme-line)] text-sm text-[var(--theme-muted)]">
              {subscription.plan ? (
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <dt>Plan</dt>
                  <dd className="capitalize font-medium text-[var(--theme-ink)]">{subscription.plan}</dd>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-3 py-2.5">
                <dt>Status</dt>
                <dd className="capitalize font-medium text-[var(--theme-ink)]">
                  {subscriptionCopy.status}
                </dd>
              </div>
              {periodEnd ? (
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <dt>{subscriptionCopy.dateLabel}</dt>
                  <dd className="font-medium text-[var(--theme-ink)]">{periodEnd}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}
          {canManageSubscription ? (
            <>
              <p className="mt-4 text-sm leading-6 text-[var(--theme-muted)]">
                You can update payment details, view invoices, or cancel your
                subscription securely through Stripe.
              </p>
              <ManageFocusDojoSubscriptionButton />
            </>
          ) : (
            <Link
              href="/focus-dojo/pricing"
              className="home-text-link mt-4"
            >
              View pricing →
            </Link>
          )}
        </div>

        <div
          id="account"
          className="home-surface sm:p-6"
        >
          <p className="home-eyebrow">Account</p>
          <h3 className="home-section-title break-all">
            {profile?.email || user.email}
          </h3>
          <p className="home-section-description">
            Your account can later be linked to ScienceDojo student, parent, or
            tutor access without creating a second login.
          </p>
        </div>
        </div>
      </section>
    </div>
  );
}
