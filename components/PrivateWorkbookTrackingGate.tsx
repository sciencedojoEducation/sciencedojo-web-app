"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { isPrivateStudyPath } from "@/lib/private-study";
/** Keep private learning and invitation-return URLs out of marketing tag initialization. */
export default function PrivateWorkbookTrackingGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); const params = useSearchParams();
  const privateEntry = isPrivateStudyPath(pathname) || (["/login", "/signup"].includes(pathname) && isPrivateStudyPath(params.get("next") || ""));
  return privateEntry ? null : children;
}
