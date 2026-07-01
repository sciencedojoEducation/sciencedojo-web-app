import type { Metadata } from "next";
import Link from "next/link";
import FocusDojoPricingActions from "./FocusDojoPricingActions";
import { siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "FocusDojo Pricing | ScienceDojo",
  description:
    "Start FocusDojo free, get FocusDojo Basic with ScienceDojo learning, or unlock every study atmosphere with FocusDojo Pro.",
  alternates: {
    canonical: `${siteUrl}/focus-dojo/pricing`,
  },
};

const tiers = [
  {
    name: "FocusDojo Free",
    price: "€0",
    body: "Start your focus habit with selected themes and background music.",
    features: [
      "Basic focus timer",
      "Selected free themes",
      "Selected background music",
    ],
    action: (
      <Link
        href="/focus-dojo"
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full border border-secondary/15 bg-white px-5 text-sm font-black text-secondary transition hover:border-primary/30 hover:text-primary"
      >
        Start Free
      </Link>
    ),
  },
  {
    name: "FocusDojo Basic",
    price: "Included for ScienceDojo students",
    body: "A calmer study space between lessons.",
    features: [
      "Basic focus timer",
      "3 themes",
      "All current background music",
    ],
    action: (
      <Link
        href="/free-assessment"
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full border border-primary/20 bg-primary/10 px-5 text-sm font-black text-primary transition hover:bg-primary/15"
      >
        Learn with ScienceDojo
      </Link>
    ),
  },
];

export default function FocusDojoPricingPage() {
  return (
    <main className="min-h-screen bg-background text-secondary">
      <section className="mx-auto w-full max-w-6xl px-4 py-12 md:px-8 md:py-16">
        <div className="max-w-3xl">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 md:text-xs">
            FocusDojo access
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-secondary md:text-6xl">
            Unlock your full study atmosphere
          </h1>
          <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-secondary/65 md:text-lg">
            FocusDojo helps students study with calm, clarity, and consistency.
            Start free, get FocusDojo Basic with ScienceDojo learning, or
            upgrade to Pro for every theme and future premium study
            environments.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {tiers.map((tier) => (
            <article
              key={tier.name}
              className="rounded-lg border border-secondary/10 bg-white p-5 shadow-sm"
            >
              <h2 className="text-xl font-black tracking-tight text-secondary">
                {tier.name}
              </h2>
              <p className="mt-3 text-2xl font-black text-primary">
                {tier.price}
              </p>
              <p className="mt-3 min-h-12 text-sm font-semibold leading-6 text-secondary/55">
                {tier.body}
              </p>
              <ul className="mt-5 space-y-2 text-sm font-bold text-secondary/65">
                {tier.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              {tier.action}
            </article>
          ))}

          <article className="rounded-lg border border-primary/30 bg-white p-5 shadow-xl shadow-primary/10">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary/70">
              Full environment
            </p>
            <h2 className="mt-2 text-xl font-black tracking-tight text-secondary">
              FocusDojo Pro
            </h2>
            <p className="mt-3 text-2xl font-black text-primary">
              €4.99/month or €39/year
            </p>
            <p className="mt-3 min-h-12 text-sm font-semibold leading-6 text-secondary/55">
              Unlock every visual theme and future premium study environments.
            </p>
            <ul className="mt-5 space-y-2 text-sm font-bold text-secondary/65">
              <li>All themes</li>
              <li>All current background music</li>
              <li>Future premium themes</li>
              <li>Future premium study environments</li>
            </ul>
            <FocusDojoPricingActions />
          </article>
        </div>
      </section>
    </main>
  );
}
