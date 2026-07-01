import Link from "next/link";
import { redirect } from "next/navigation";
import { getFocusDojoAccessLevel } from "@/lib/focusdojo/access";
import { FOCUSDOJO_PRO_PRODUCT_KEY } from "@/lib/focusdojo/access-levels";
import { createClient } from "@/utils/supabase/server";

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

export default async function UserDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: subscription }, accessLevelResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("subscriptions")
        .select("plan, status, current_period_end, cancel_at_period_end")
        .eq("user_id", user.id)
        .eq("product_key", FOCUSDOJO_PRO_PRODUCT_KEY)
        .maybeSingle(),
      getFocusDojoAccessLevel(user.id),
    ]);

  const name = profile?.full_name || user.user_metadata?.full_name;
  const accessLabel =
    accessLevelResult === "pro"
      ? "FocusDojo Pro"
      : accessLevelResult === "basic"
        ? "FocusDojo Basic"
        : "FocusDojo Free";
  const periodEnd = formatDate(subscription?.current_period_end);
  const subscriptionDescription =
    accessLevelResult === "pro"
      ? "Your full FocusDojo environment is unlocked."
      : accessLevelResult === "basic"
        ? "Included with your ScienceDojo learning. You have 3 themes and all background music."
        : "Selected themes and music are available.";

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
            {subscriptionDescription}
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
                  {subscription.status.replace(/_/g, " ")}
                </dd>
              </div>
              {periodEnd ? (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-secondary/[0.03] px-3 py-2">
                  <dt>
                    {subscription.cancel_at_period_end ? "Ends" : "Renews"}
                  </dt>
                  <dd className="text-secondary">{periodEnd}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}
          <Link
            href="/focus-dojo/pricing"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl border border-secondary/10 bg-white px-5 text-sm font-black text-secondary transition hover:border-primary/30 hover:text-primary"
          >
            View pricing
          </Link>
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
