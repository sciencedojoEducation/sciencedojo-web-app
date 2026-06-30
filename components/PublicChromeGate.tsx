"use client";

import { usePathname } from "next/navigation";

export default function PublicChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isTutorOnboarding =
    pathname === "/tutor/onboarding" || pathname.startsWith("/tutor/onboarding/");

  if (pathname.startsWith("/dashboard") || pathname === "/maintenance" || isTutorOnboarding) {
    return null;
  }

  return <>{children}</>;
}
