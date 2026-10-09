"use client";

import { usePathname } from "next/navigation";

export default function PublicChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isTutorOnboarding =
    pathname === "/tutor/onboarding" || pathname.startsWith("/tutor/onboarding/");
  const isBusiness = pathname === "/business" || pathname.startsWith("/business/");

  if (pathname.startsWith("/dashboard") || pathname === "/maintenance" || isTutorOnboarding || isBusiness) {
    return null;
  }

  return <>{children}</>;
}
