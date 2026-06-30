"use server"

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { getActiveInternalMemberByUserId } from "@/lib/internal-auth";

const SAFETY_KEYWORDS = [
  "whatsapp", "phone", "paypal", "email", "contact", "pay me", "transfer",
  "telegram", "instagram", "facebook", "sms", "mobile", "discord", "skype", 
  "venmo", "zelle", "cashapp", "wechat", "snapchat", "call you"
];
const PROFANITY_KEYWORDS = [
  "fuck", "shit", "bitch", "asshole", "bastard", "whore", "slut", "cunt",
  "nigger", "faggot", "retard", "dick", "pussy", "cock", "rape", "pedo",
  "kill yourself", "kys", "nazi", "chink", "spic", "dyke", "tranny",
  "kill yourself", "kys"
];
const CONTACT_INFO_REGEX = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})|(\+?[0-9\s-]{10,})/g;

async function getProfileRole(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return data?.role || null;
}

async function isAdminProfile(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  return (await getProfileRole(supabase, userId)) === "admin";
}

async function isInternalMessagingParticipant(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  if (await getActiveInternalMemberByUserId(supabase, userId)) {
    return true;
  }

  return isAdminProfile(supabase, userId);
}

async function getConversationOtherParticipantId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  conversationId: string,
  currentUserId: string
) {
  const { data: conversation, error } = await supabase
    .from("conversations")
    .select("participant_1_id, participant_2_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (error) {
    console.error("Conversation lookup error:", error.message);
    return null;
  }

  if (!conversation) return null;

  if (conversation.participant_1_id === currentUserId) return conversation.participant_2_id as string;
  if (conversation.participant_2_id === currentUserId) return conversation.participant_1_id as string;

  return null;
}

async function canInternalUseConversation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  conversationId: string,
  currentUserId: string
) {
  const otherParticipantId = await getConversationOtherParticipantId(supabase, conversationId, currentUserId);
  if (!otherParticipantId) return false;
  return isInternalMessagingParticipant(supabase, otherParticipantId);
}

export async function sendMessage(conversationId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const adminClient = createAdminClient();
  const isInternal = Boolean(await getActiveInternalMemberByUserId(adminClient, user.id));
  if (isInternal && !(await canInternalUseConversation(adminClient as any, conversationId, user.id))) {
    return { error: "Internal team members can only message admins and active internal team members." };
  }

  // 1. Safety Flagging (Keywords & Contact Info)
  const lowerContent = content.toLowerCase();
  
  // Use regex with word boundaries for profanity to avoid false positives (e.g. 'dick' in 'Dickens' or 'glasshole')
  // For basic substrings, includes is fine, but for short words \b is safer. We'll stick to a simple filter for now.
  const flaggedSafety = SAFETY_KEYWORDS.filter(kw => lowerContent.includes(kw));
  const flaggedProfanity = PROFANITY_KEYWORDS.filter(kw => new RegExp(`\\b${kw}\\b`, 'i').test(lowerContent) || (kw.length > 4 && lowerContent.includes(kw)));
  const hasContactInfo = CONTACT_INFO_REGEX.test(content);
  
  const isFlagged = flaggedSafety.length > 0 || flaggedProfanity.length > 0 || hasContactInfo;

  let flaggedReason = null;
  if (isFlagged) {
    const reasons = [];
    if (flaggedSafety.length > 0) reasons.push(`Contact/Bypass: ${flaggedSafety.join(", ")}`);
    if (flaggedProfanity.length > 0) reasons.push(`Inappropriate/Profanity: ${flaggedProfanity.join(", ")}`);
    if (hasContactInfo) reasons.push("Detected contact info (email/phone)");
    flaggedReason = reasons.join(" | ");
  }

  const { error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: content,
      is_flagged: isFlagged,
      flagged_reason: flaggedReason
    });

  if (error) {
    console.error("Send message error:", error.message);
    return { error: error.message };
  }

  // Also update the conversation last_message_at timestamp (trigger handles this but revalidate helps)
  revalidatePath("/dashboard/messages");
  
  return { success: true };
}

export async function createConversation(otherParticipantId: string, bookingId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const adminClient = createAdminClient();
  const isInternal = Boolean(await getActiveInternalMemberByUserId(adminClient, user.id));
  if (isInternal && !(await isInternalMessagingParticipant(adminClient as any, otherParticipantId))) {
    return { error: "Internal team members can only message admins and active internal team members." };
  }

  // Check if conversation already exists between these two users for this specific context
  let query = supabase
    .from("conversations")
    .select("id")
    .or(`and(participant_1_id.eq.${user.id},participant_2_id.eq.${otherParticipantId}),and(participant_1_id.eq.${otherParticipantId},participant_2_id.eq.${user.id})`);
    
  if (bookingId) {
    query = query.eq("booking_id", bookingId);
  } else {
    query = query.is("booking_id", null);
  }

  const { data: existing } = await query.single();

  if (existing) {
    return { conversationId: existing.id };
  }

  // Create new conversation
  const { data: newConv, error } = await supabase
    .from("conversations")
    .insert({
       participant_1_id: user.id,
       participant_2_id: otherParticipantId,
       booking_id: bookingId || null
    })
    .select("id")
    .single();

  if (error) {
    console.error("Create conversation error:", error.message);
    return { error: error.message };
  }

  revalidatePath("/dashboard/messages");
  return { conversationId: newConv.id };
}

export async function initiateInquiry(otherParticipantId: string, subject: string, goal: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  // 1. Create the conversation
  const convResult = await createConversation(otherParticipantId);
  if (convResult.error || !convResult.conversationId) return convResult;

  // 2. Send the structured first message
  const inquiryContent = `**New Lead Inquiry** 🛡️\n\n**Subject**: ${subject}\n**Learning Goal**: ${goal}`;
  
  const { error } = await supabase
    .from("messages")
    .insert({
      conversation_id: convResult.conversationId,
      sender_id: user.id,
      content: inquiryContent,
      is_flagged: CONTACT_INFO_REGEX.test(subject) || CONTACT_INFO_REGEX.test(goal),
      flagged_reason: (CONTACT_INFO_REGEX.test(subject) || CONTACT_INFO_REGEX.test(goal)) ? "Detected contact info in inquiry" : null
    });

  if (error) {
    console.error("Inquiry message error:", error.message);
    return { error: error.message };
  }

  revalidatePath("/dashboard/messages");
  return { success: true, conversationId: convResult.conversationId };
}

export async function markAsRead(conversationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const adminClient = createAdminClient();
  const isInternal = Boolean(await getActiveInternalMemberByUserId(adminClient, user.id));
  if (isInternal && !(await canInternalUseConversation(adminClient as any, conversationId, user.id))) {
    return { error: "Internal team members can only read admin and internal team conversations." };
  }

  const { error } = await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id);

  if (error) {
    console.error("Mark read error:", error.message);
    return { error: error.message };
  }

  revalidatePath("/dashboard/messages");
  return { success: true };
}
