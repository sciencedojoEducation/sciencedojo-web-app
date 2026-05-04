import DashboardSidebar from "@/components/DashboardSidebar";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";

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
    .single();
    
  let role = (profile?.role as "admin" | "tutor" | "parent" | "student") || "parent";

  // ROUTE-BASED ROLE INFERENCE: If the URL is /dashboard/tutor but the profile says 'parent',
  // check for an existing application record. If found, auto-repair the profile.
  const headersList = await headers();
  const pathname = headersList.get("x-next-pathname") || headersList.get("referer") || "";
  const isTutorRoute = pathname.includes("/dashboard/tutor");

  if (isTutorRoute && role !== "tutor" && role !== "admin" && user) {
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
    <div className="flex flex-1 min-h-[calc(100vh-80px)] bg-background">
      <DashboardSidebar role={role} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
