import { createClient } from "@/utils/supabase/server";

export type PlatformAnnouncement = {
  id: string;
  title: string;
  message: string;
  audience: "all" | "tutor" | "parent" | "student" | "user";
  category: "account" | "onboarding" | "service" | "product" | "tutor_growth" | "policy";
  send_email: boolean;
  show_dashboard: boolean;
  show_public_updates_page: boolean;
  cta_label: string | null;
  cta_url: string | null;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export async function getActivePlatformAnnouncementsForUser(): Promise<PlatformAnnouncement[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let role = user.user_metadata?.role || "user";
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  role = profile?.role || role;

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("platform_announcements")
    .select("*")
    .eq("is_active", true)
    .eq("show_dashboard", true)
    .lte("starts_at", now)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .or(`audience.eq.all,audience.eq.${role}`)
    .order("starts_at", { ascending: false });

  if (error) {
    console.error("Error fetching platform announcements:", error.message);
    return [];
  }

  return (data || []) as PlatformAnnouncement[];
}

export async function getPublicPlatformUpdates(): Promise<PlatformAnnouncement[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("platform_announcements")
    .select("*")
    .eq("is_active", true)
    .eq("show_public_updates_page", true)
    .lte("starts_at", now)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .order("starts_at", { ascending: false });

  if (error) {
    console.error("Error fetching public updates:", error.message);
    return [];
  }

  return (data || []) as PlatformAnnouncement[];
}

export async function getPlatformAnnouncementsForAdmin(): Promise<PlatformAnnouncement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("platform_announcements")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching admin platform announcements:", error.message);
    return [];
  }

  return (data || []) as PlatformAnnouncement[];
}
