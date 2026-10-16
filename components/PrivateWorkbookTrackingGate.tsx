"use client";
import { usePathname, useSearchParams } from "next/navigation";
/** Keep private workbook and invitation-return URLs out of marketing tag initialization. */
export default function PrivateWorkbookTrackingGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); const params = useSearchParams();
  const privateEntry = pathname.startsWith("/workbooks/") || (["/login", "/signup"].includes(pathname) && params.get("next")?.startsWith("/workbooks/"));
  return privateEntry ? null : children;
}
