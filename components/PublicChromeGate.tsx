"use client";

import { usePathname } from "next/navigation";

export default function PublicChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isTutorOnboarding =
    pathname === "/tutor/onboarding" || pathname.startsWith("/tutor/onboarding/");
  const isAuth = pathname === "/login" || pathname.startsWith("/login/") || pathname === "/signup" || pathname.startsWith("/signup/");
  const isBusiness = pathname === "/business" || pathname.startsWith("/business/");

  if (pathname === "/campus" || pathname.startsWith("/campus/") || pathname.startsWith("/dashboard") || pathname.startsWith("/workbooks/") || pathname === "/maintenance" || isTutorOnboarding || isBusiness || isAuth) {
    return null;
  }

  return <>{children}</>;
}
