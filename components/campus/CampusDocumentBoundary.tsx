"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { campusNeedsFreshDocument } from "@/lib/private-study";

const reloadMarker = "sciencedojo-campus-private-document";
function subscribe(change: () => void) {
  window.addEventListener("pageshow", change);
  return () => window.removeEventListener("pageshow", change);
}
function documentState(): "ready" | "opening" | "reload" {
  const marketing = window as Window & {
    fbq?: unknown;
    _fbq?: unknown;
    google_tag_manager?: unknown;
  };
  const tagsPresent =
    typeof window.gtag === "function" ||
    Boolean(marketing.fbq || marketing._fbq || marketing.google_tag_manager) ||
    Boolean(
      document.querySelector(
        'script[src*="googletagmanager.com"], script[src*="connect.facebook.net"]',
      ),
    );
  const navigation = performance.getEntriesByType("navigation")[0];
  if (!campusNeedsFreshDocument(location.href, navigation?.name, tagsPresent))
    return "ready";
  try {
    return sessionStorage.getItem(reloadMarker) === location.href
      ? "reload"
      : "opening";
  } catch {
    return "reload";
  }
}
const serverState = () => "checking" as const;

/** An SPA transition cannot unload third-party code already present in the document. */
export default function CampusDocumentBoundary({
  children,
}: {
  children: ReactNode;
}) {
  const state = useSyncExternalStore(subscribe, documentState, serverState);
  useEffect(() => {
    if (state === "ready") {
      try {
        sessionStorage.removeItem(reloadMarker);
      } catch {
        /* Storage is optional in a clean document. */
      }
    } else if (state === "opening") {
      // The next document checks this marker to avoid an automatic reload loop.
      try {
        sessionStorage.setItem(reloadMarker, location.href);
        location.replace(location.href);
      } catch {
        /* The fallback link remains available if automatic navigation is blocked. */
      }
    }
  }, [state]);

  if (state === "ready") return children;
  return (
    <section
      className="flex min-h-screen items-center justify-center bg-[#f5f3ec] p-8 text-[#173b39]"
      aria-label="Private study session"
    >
      <div className="max-w-lg">
        <h1 className="text-2xl font-semibold">Preparing your study session</h1>
        <p role="status" className="mt-4 leading-7">
          {state === "reload"
            ? "Open the school in a fresh page to keep public-site tracking scripts separate from your study activity. If this message returns, try a browser profile without extensions that add tracking scripts."
            : "Opening the school in a private page…"}
        </p>
        {/* A document navigation is required here; client routing would retain loaded scripts. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/campus"
          className="mt-6 inline-flex min-h-12 items-center rounded-full bg-[#173b39] px-6 text-white"
        >
          Open a fresh school page →
        </a>
      </div>
    </section>
  );
}
