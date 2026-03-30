import { createClient } from "@/utils/supabase/server";

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
    const other = isP1 ? conv.participant_2 : conv.participant_1;
    
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

  const { count, error } = await supabase
    .from("messages")
    .select("*", { count: 'exact', head: true })
    .neq("sender_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error("Error fetching unread count:", error.message);
    return 0;
  }

  return count || 0;
}
