"use client";

import { usePathname } from "next/navigation";

export default function DashboardFrame({
  children,
  sidebar,
  guidedTour,
}: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  guidedTour: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAcademyRoute = pathname === "/dashboard/tutor/academy" || pathname.startsWith("/dashboard/tutor/academy/");

  if (isAcademyRoute) {
    return <div className="h-[100dvh] min-h-0 overflow-hidden bg-white">{children}</div>;
  }

  return (
    <div className="flex h-[100dvh] min-h-0 flex-1 flex-col overflow-hidden bg-background lg:flex-row">
      {sidebar}
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain">
        {children}
      </main>
      {guidedTour}
    </div>
  );
}
