"use client";

import { useState } from "react";

export default function ManageFocusDojoSubscriptionButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openBillingPortal() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/focusdojo/billing-portal", {
        method: "POST",
      });
      const payload = (await response.json()) as {
        url?: string;
        error?: string;
      };

      if (!response.ok || !payload.url) {
        setError(
          payload.error ||
            "We could not open billing management right now. Please try again.",
        );
        return;
      }

      window.location.href = payload.url;
    } catch {
      setError("We could not open billing management right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mt-5 space-y-3">
      <button
        type="button"
        onClick={openBillingPortal}
        disabled={isLoading}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-secondary px-5 text-sm font-black text-white transition hover:bg-secondary/90 disabled:cursor-wait disabled:opacity-70"
      >
        {isLoading ? "Opening billing..." : "Manage subscription"}
      </button>
      {error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
