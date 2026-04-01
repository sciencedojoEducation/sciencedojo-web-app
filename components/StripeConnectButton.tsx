"use client";

import { useState } from "react";

export default function StripeConnectButton() {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/stripe/connect", {
        method: "POST",
      });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to connect to Stripe.");
        setLoading(false);
      }
    } catch (err) {
      alert("Network error.");
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className="w-full py-4 bg-white text-secondary font-black rounded-2xl shadow-xl hover:bg-slate-50 transition-all hover:-translate-y-1 active:scale-95 text-sm uppercase tracking-widest flex items-center justify-center gap-2"
    >
      {loading ? (
        <span className="flex items-center gap-2">
           <svg className="animate-spin h-5 w-5 text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
           </svg>
           Connecting securely...
        </span>
      ) : (
        <>
          <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 24 24"><path d="M11.996 0C5.37 0 0 5.37 0 11.996 0 18.62 5.37 24 11.996 24 18.62 24 24 18.62 24 11.996 24 5.37 18.62 0 11.996 0zm5.174 16.79c-1.353 1.3-3.6 1.3-5.32 1.3-3.8 0-6.28-2.022-6.28-5.362 0-3.328 2.5-5.334 6.273-5.334 1.832 0 3.65.253 4.9.897l-1.077 2.658c-1.037-.52-2.316-.766-3.7-.766-1.928 0-3.15.823-3.15 2.52 0 1.573 1.13 2.112 3.078 2.378l.492.06c2.09.28 3.52 1.1 3.52 3.05 0 2.1-1.637 3.32-4.136 3.32-1.748 0-3.218-.3-4.484-.962l1.1-2.735c1.196.58 2.61.94 3.96.94 1.954 0 2.924-.764 2.924-2.126 0-1.402-1.05-1.93-3.08-2.19l-.5-.072c-2.05-.28-3.524-1.127-3.524-3.067 0-2.348 1.82-3.882 4.417-3.882 2.056 0 3.626.335 4.86 1.058l-1.164 2.8z"/></svg>
          Connect Stripe
        </>
      )}
    </button>
  );
}
