"use client";

import { useLinkStatus } from "next/link";

export default function NavigationPending() {
  const { pending } = useLinkStatus();
  return <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center" role="status" aria-label={pending ? "Opening page…" : undefined}>
    <span aria-hidden="true" className={`h-3 w-3 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin ${pending ? "opacity-70" : "opacity-0"}`} />
  </span>;
}
