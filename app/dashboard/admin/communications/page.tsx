import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getPlatformAnnouncementsForAdmin } from "@/lib/platform-announcements";
import CommunicationsAdminUI from "./CommunicationsAdminUI";

export default async function AdminCommunicationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard/parent");

  const adminClient = createAdminClient();
  const [announcements, emailEventsResult] = await Promise.all([
    getPlatformAnnouncementsForAdmin(),
    adminClient
      .from("email_events")
      .select("id, recipient_email, category, audience, template_key, subject, status, error_message, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <CommunicationsAdminUI
      announcements={announcements}
      emailEvents={emailEventsResult.data || []}
    />
  );
}
