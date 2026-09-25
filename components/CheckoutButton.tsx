"use client";

import { useState } from "react";

interface CheckoutButtonProps {
  bookingId: string;
  paymentStatus?: string | null;
  variant?: "default" | "compact";
}

export default function CheckoutButton({ bookingId, paymentStatus, variant = "default" }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout_sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          bookingId,
          returnUrl: window.location.origin + window.location.pathname
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No checkout URL returned");
        alert("Failed to start checkout. Please try again.");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCheckout}
      disabled={loading || paymentStatus === "paid"}
      className={variant === "compact"
        ? "inline-flex min-h-11 w-full items-center justify-center gap-2 self-stretch rounded-xl bg-[var(--student-accent,var(--theme-accent))] px-4 py-2.5 text-sm font-semibold text-[var(--student-accent-contrast,var(--theme-accent-contrast))] transition-colors hover:bg-[var(--student-accent-hover,var(--theme-accent-hover))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--student-accent,var(--theme-accent))] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:self-end"
        : "flex w-full items-center justify-center gap-3 rounded-2xl bg-primary py-4 font-black text-white shadow-xl transition-all hover:-translate-y-1 hover:bg-primary-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"}
    >
      {loading ? "Preparing Secure Checkout..." : "Pay by Card"}
      {!loading && (
        <svg className={variant === "compact" ? "h-4 w-4" : "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      )}
    </button>
  );
}
