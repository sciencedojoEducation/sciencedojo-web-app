import DashboardSidebar from "@/components/DashboardSidebar";
import { createClient } from "@/utils/supabase/server";

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
    
  const role = (profile?.role as "admin" | "tutor" | "parent" | "student") || "parent";
  
  return (
    <div className="flex flex-1 min-h-[calc(100vh-80px)] bg-background">
      <DashboardSidebar role={role} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
