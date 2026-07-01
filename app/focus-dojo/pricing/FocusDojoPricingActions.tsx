"use client";

import { useState } from "react";
import Link from "next/link";

type Plan = "monthly" | "yearly";

export default function FocusDojoPricingActions() {
  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(plan: Plan) {
    setLoadingPlan(plan);
    setError(null);

    try {
      const response = await fetch("/api/focusdojo/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const payload = (await response.json()) as {
        url?: string;
        loginUrl?: string;
        error?: string;
      };

      if (payload.loginUrl) {
        window.location.href = payload.loginUrl;
        return;
      }

      if (!response.ok || !payload.url) {
        setError(payload.error || "Unable to start checkout.");
        return;
      }

      window.location.href = payload.url;
    } catch {
      setError("Unable to start checkout. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div className="mt-5 space-y-3">
      <button
        type="button"
        onClick={() => startCheckout("monthly")}
        disabled={loadingPlan !== null}
        className="min-h-12 w-full rounded-full bg-secondary px-5 text-sm font-black text-white transition hover:bg-secondary/90 disabled:cursor-wait disabled:opacity-70"
      >
        {loadingPlan === "monthly" ? "Opening checkout..." : "Upgrade monthly"}
      </button>
      <button
        type="button"
        onClick={() => startCheckout("yearly")}
        disabled={loadingPlan !== null}
        className="min-h-12 w-full rounded-full border border-secondary/15 bg-white px-5 text-sm font-black text-secondary transition hover:border-primary/30 hover:text-primary disabled:cursor-wait disabled:opacity-70"
      >
        {loadingPlan === "yearly" ? "Opening checkout..." : "Upgrade yearly"}
      </button>
      <Link
        href="/focus-dojo"
        className="block text-center text-xs font-black uppercase tracking-[0.16em] text-secondary/45 transition hover:text-primary"
      >
        Continue Free
      </Link>
      {error && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-center text-sm font-bold text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
