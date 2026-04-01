import { getAllAnnouncementsForAdmin } from "@/lib/announcement-queries";
import AdminBroadcastUI from "./AdminBroadcastUI";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminBroadcastPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  
  if (profile?.role !== 'admin') {
    redirect("/dashboard/parent");
  }

  const announcements = await getAllAnnouncementsForAdmin();

  return <AdminBroadcastUI announcements={announcements} />;
}
