import type { Metadata } from "next";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardGuidedTour from "@/components/DashboardGuidedTour";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getActiveInternalMemberByUserId, repairLinkedInternalUserRole } from "@/lib/internal-auth";

type DashboardRole = "admin" | "tutor" | "parent" | "student" | "internal";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

function normalizeDashboardRole(role?: unknown): DashboardRole | null {
  return role === "admin" || role === "tutor" || role === "parent" || role === "student" || role === "internal" ? role : null;
}

export default async function DashboardLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .maybeSingle();
    
  const profileRole = normalizeDashboardRole(profile?.role);
  const metadataRole = normalizeDashboardRole(user?.user_metadata?.role);
  let role: DashboardRole = profileRole || metadataRole || "parent";
  const activeInternalMember = await getActiveInternalMemberByUserId(supabase, user?.id);

  // ROUTE-BASED ROLE INFERENCE: If the URL is /dashboard/tutor but the profile says 'parent',
  // check for an existing application record. If found, auto-repair the profile.
  const headersList = await headers();
  const pathname = headersList.get("x-next-pathname") || headersList.get("referer") || "";
  const isTutorRoute = pathname.includes("/dashboard/tutor");

  const isInternalAllowedRoute =
    pathname === "/dashboard/internal" ||
    pathname.startsWith("/dashboard/internal/settings") ||
    pathname.startsWith("/dashboard/messages");

  if (activeInternalMember && user) {
    role = "internal";
    try {
      await repairLinkedInternalUserRole(user.id);
    } catch (repairError) {
      console.error("[dashboard-layout] Internal role repair failed:", repairError);
    }
  }

  if (role === "internal" && !isInternalAllowedRoute) {
    redirect("/dashboard/internal");
  }

  if (role !== "internal" && pathname.startsWith("/dashboard/internal")) {
    redirect(`/dashboard/${role}`);
  }

  // Admin accounts are sometimes created/updated through auth metadata first.
  // Treat either trusted source as admin so the shared dashboard shell does not
  // fall back to the parent navigation while admin pages load.
  if (profileRole === "admin" || metadataRole === "admin") {
    role = "admin";
  }

  if (isTutorRoute && role !== "tutor" && role !== "admin" && role !== "internal" && user) {
    // Check if this user has an application (i.e., they went through tutor onboarding)
    const { data: application } = await supabase
      .from("applications")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (application) {
      // Auto-repair: They have an application, so they are a tutor
      await supabase
        .from("profiles")
        .update({ role: "tutor" })
        .eq("id", user.id);
      role = "tutor";
    }
  }
  
  return (
    <div className="flex h-[100dvh] min-h-0 flex-1 flex-col overflow-hidden bg-background lg:flex-row">
      <DashboardSidebar role={role} />
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain">
        {children}
      </main>
      <DashboardGuidedTour
        role={role}
        completedTours={user?.user_metadata?.dashboardToursCompleted}
      />
    </div>
  );
}
