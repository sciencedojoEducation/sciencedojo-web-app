import { createClient } from "@/utils/supabase/server";

export interface Announcement {
  id: string;
  sender_id: string;
  title: string;
  content: string;
  target_role: "all" | "tutor" | "parent" | "student";
  is_pinned: boolean;
  is_active: boolean;
  created_at: string;
  sender?: {
    full_name: string;
  };
}

/** Fetch all announcements for admins. */
export async function getAllAnnouncementsForAdmin(): Promise<Announcement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("announcements")
    .select(`
      *,
      sender:profiles!sender_id(full_name)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching admin announcements:", error.message);
    return [];
  }
  return data as any[];
}

/** Fetch active announcements for the current user's role. */
export async function getActiveAnnouncementsForUser(): Promise<Announcement[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const role = user.user_metadata?.role || "student";

  const { data, error } = await supabase
    .from("announcements")
    .select(`
      *,
      sender:profiles!sender_id(full_name)
    `)
    .eq("is_active", true)
    .or(`target_role.eq.all,target_role.eq.${role}`)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user announcements:", error.message);
    return [];
  }
  return data as any[];
}
