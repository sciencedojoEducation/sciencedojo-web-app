"use client";

import { useState } from "react";

interface CheckoutButtonProps {
  bookingId: string;
  paymentStatus?: string | null;
}

export default function CheckoutButton({ bookingId, paymentStatus }: CheckoutButtonProps) {
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
      onClick={handleCheckout}
      disabled={loading || paymentStatus === "paid"}
      className="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary py-4 font-black text-white shadow-xl transition-all hover:-translate-y-1 hover:bg-primary-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Preparing Secure Checkout..." : "Pay by Card"}
      {!loading && (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      )}
    </button>
  );
}
