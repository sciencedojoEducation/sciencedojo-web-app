import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import UserManagementUI from "./UserManagementUI";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify Admin Status
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    redirect("/dashboard/parent");
  }

  // Fetch all users in the system from the profiles table
  const { data: allUsers } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, avatar_url, created_at")
    .order("created_at", { ascending: false });

  return <UserManagementUI users={(allUsers as any[]) || []} currentUserId={user.id} />;
}
