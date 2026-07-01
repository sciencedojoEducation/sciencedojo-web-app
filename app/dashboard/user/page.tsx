import Link from "next/link";
import { redirect } from "next/navigation";
import { getFocusDojoAccessLevel } from "@/lib/focusdojo/access";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
  title: "My Dojo | ScienceDojo",
  description: "A lightweight dashboard for ScienceDojo tools and account access.",
};

function firstName(name?: string | null) {
  return name?.trim().split(/\s+/)[0] || "there";
}

export default async function UserDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, accessLevelResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
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
            Manage access
          </h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-secondary/55">
            Upgrade to Pro or review the FocusDojo access tiers.
          </p>
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
