import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getActiveInternalMemberByUserId } from "@/lib/internal-auth";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  is_flagged?: boolean;
  is_file?: boolean;
  file_url?: string;
  file_name?: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  last_message_at: string;
  created_at: string;
  other_participant?: {
    full_name: string;
    avatar_url: string;
    id: string;
  };
  last_message?: string;
  unread_count?: number;
  booking?: {
    subject: string;
    requested_date: string;
    status: string;
  };
}

export async function getConversations() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const adminClient = createAdminClient();
  const isInternalUser = Boolean(await getActiveInternalMemberByUserId(adminClient, user.id));
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const { data: rawConversations, error } = await supabase
    .from("conversations")
    .select(`
      *,
      participant_1:profiles!conversations_participant_1_id_fkey(id, full_name, avatar_url),
      participant_2:profiles!conversations_participant_2_id_fkey(id, full_name, avatar_url),
      messages(content, is_read, sender_id, created_at)
    `)
    .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false });

  if (error) {
    console.error("Error fetching conversations:", error.message);
    return [];
  }

  const participantIds = Array.from(new Set(
    (rawConversations || [])
      .flatMap((conversation) => [conversation.participant_1_id, conversation.participant_2_id])
      .filter(Boolean)
  ));

  const profileMap: Record<string, { id: string; full_name: string; avatar_url: string; role?: string | null }> = {};
  if (participantIds.length > 0) {
    const { data: participantProfiles } = await adminClient
      .from("profiles")
      .select("id, full_name, avatar_url, role")
      .in("id", participantIds);

    for (const profile of participantProfiles || []) {
      profileMap[profile.id] = profile;
    }
  }

  let internalStaffIds = new Set<string>();
  let adminIds = new Set<string>();

  if (isInternalUser) {
    const { data: internalMembers } = await adminClient
      .from("internal_team_members")
      .select("user_id")
      .eq("status", "active")
      .not("user_id", "is", null);

    internalStaffIds = new Set((internalMembers || []).map((member) => member.user_id).filter(Boolean) as string[]);
    adminIds = new Set(
      Object.values(profileMap)
        .filter((profile) => profile.role === "admin")
        .map((profile) => profile.id)
    );
  }

  // 1. Collect all booking IDs to fetch them separately
  const bookingIds = rawConversations
    .map(c => c.booking_id)
    .filter(id => id !== null);

  let bookingsMap: Record<string, any> = {};
  if (bookingIds.length > 0) {
    const { data: bookingsData } = await supabase
      .from("bookings")
      .select("id, subject, requested_date, status")
      .in("id", bookingIds);
    
    if (bookingsData) {
      bookingsMap = bookingsData.reduce((acc, b) => {
        acc[b.id] = b;
        return acc;
      }, {} as any);
    }
  }

  return (rawConversations as any[]).map(conv => {
    const isP1 = conv.participant_1_id === user.id;
    const otherId = isP1 ? conv.participant_2_id : conv.participant_1_id;
    const other = profileMap[otherId] || (isP1 ? conv.participant_2 : conv.participant_1);
    
    // Join booking data in memory
    const booking = conv.booking_id ? bookingsMap[conv.booking_id] : null;
    
    // Sort messages by created_at to get the latest one safely
    const sortedMessages = [...(conv.messages || [])].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    const unreadCount = sortedMessages.filter(m => !m.is_read && m.sender_id !== user.id).length;

    return {
      ...conv,
      other_participant: other,
      booking: booking,
      last_message: sortedMessages[0]?.content || "No messages yet",
      unread_count: unreadCount
    };
  }).filter((conv) => {
    if (!isInternalUser && currentProfile?.role !== "internal") return true;

    const otherId = conv.other_participant?.id;
    return Boolean(otherId && (adminIds.has(otherId) || internalStaffIds.has(otherId)));
  });
}

export async function getMessages(conversationId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error.message);
    return [];
  }

  return data as Message[];
}

export async function getUnreadMessageCount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return 0;

  const adminClient = createAdminClient();
  const isInternalUser = Boolean(await getActiveInternalMemberByUserId(adminClient, user.id));

  // First, get conversations where the user is an actual participant
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, participant_1_id, participant_2_id")
    .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`);

  if (!conversations || conversations.length === 0) return 0;

  let conversationIds = conversations.map(c => c.id);

  if (isInternalUser) {
    const { data: internalMembers } = await adminClient
      .from("internal_team_members")
      .select("user_id")
      .eq("status", "active")
      .not("user_id", "is", null);
    const { data: admins } = await adminClient
      .from("profiles")
      .select("id")
      .eq("role", "admin");
    const allowedIds = new Set([
      ...((internalMembers || []).map((member) => member.user_id).filter(Boolean) as string[]),
      ...((admins || []).map((profile) => profile.id) as string[]),
    ]);

    conversationIds = conversations
      .filter((conversation) => {
        const otherId = conversation.participant_1_id === user.id ? conversation.participant_2_id : conversation.participant_1_id;
        return allowedIds.has(otherId);
      })
      .map((conversation) => conversation.id);
  }

  if (conversationIds.length === 0) return 0;

  // Then, count unread messages only within those conversations
  const { count, error } = await supabase
    .from("messages")
    .select("*", { count: 'exact', head: true })
    .in("conversation_id", conversationIds)
    .neq("sender_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error("Error fetching unread count:", error.message);
    return 0;
  }

  return count || 0;
}
