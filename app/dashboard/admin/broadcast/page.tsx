import { getAllAnnouncementsForAdmin } from "@/lib/announcement-queries";
import AdminBroadcastUI from "./AdminBroadcastUI";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminBroadcastPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== 'admin') {
    redirect("/dashboard");
  }

  const announcements = await getAllAnnouncementsForAdmin();

  return <AdminBroadcastUI announcements={announcements} />;
}
