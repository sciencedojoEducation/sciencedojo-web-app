"use server"

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Dismisses all flags in a conversation (False Positive)
 */
export async function dismissFlaggedConversation(conversationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  // Verify Admin Status
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Admin access required" };

  const { error } = await supabase
    .from("messages")
    .update({ 
      is_flagged: false, 
      flagged_reason: "Dismissed by Admin", 
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id
    })
    .eq("conversation_id", conversationId)
    .eq("is_flagged", true);

  if (error) {
    console.error("Dismiss flag error:", error.message);
    return { error: error.message };
  }

  revalidatePath("/dashboard", "layout");
  
  return { success: true };
}

/**
 * Issues a formal warning to a user and notifies the chat
 */
export async function issueUserWarning(conversationId: string, offenderId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  // Verify Admin Status
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (adminProfile?.role !== "admin") return { error: "Admin access required" };

  // 1. Fetch the flagged reason to make the warning dynamic
  const { data: flaggedMsgs } = await supabase
    .from("messages")
    .select("flagged_reason")
    .eq("conversation_id", conversationId)
    .eq("is_flagged", true)
    .limit(5);

  const reasons = Array.from(new Set(flaggedMsgs?.map(m => m.flagged_reason).filter(Boolean)));
  // Extract just the violation category (before the colon), deduplicated
  const cleanReasons = Array.from(new Set(
    reasons.map(r => r.includes(':') ? r.split(':')[0].trim() : r)
  ));
  const dynamicReason = cleanReasons.length > 0 ? cleanReasons.join(', ') : 'Safety Policy Violation';

  // 2. Increment Warning Count for the user
  const { error: profileError } = await supabase.rpc('increment_warning_count', { user_id: offenderId });
  
  // Fallback if RPC not yet created (manual update)
  if (profileError) {
    const { data: userProfile } = await supabase.from("profiles").select("warning_count").eq("id", offenderId).single();
    await supabase.from("profiles").update({ warning_count: (userProfile?.warning_count || 0) + 1 }).eq("id", offenderId);
  }

  // 3. Clear the flags
  await supabase
    .from("messages")
    .update({ 
      is_flagged: false, 
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id
    })
    .eq("conversation_id", conversationId)
    .eq("is_flagged", true);

  // 4. Send Automated System Warning Message as structured JSON so the UI can render it nicely
  // Body text adapts based on the type of violation
  const reasonLower = dynamicReason.toLowerCase();
  let alertBody: string;
  if (reasonLower.includes('profanity') || reasonLower.includes('inappropriate') || reasonLower.includes('language')) {
    alertBody = 'ScienceDojo is a professional learning environment for students of all ages. Messages in this conversation contained language that violates our community standards. Please keep all communication respectful and appropriate.';
  } else if (reasonLower.includes('contact') || reasonLower.includes('phone') || reasonLower.includes('payment') || reasonLower.includes('paypal') || reasonLower.includes('external')) {
    alertBody = 'To stay protected by our safety guarantee and insurance, all communication and payments must remain on the ScienceDojo platform. Sharing contact info or bypassing our secure checkout is a violation of our community standards.';
  } else {
    alertBody = 'A message in this conversation was reviewed and flagged for violating ScienceDojo community standards. Please ensure all communication remains professional, safe, and on-platform.';
  }

  const systemMessage = JSON.stringify({
    type: 'SYSTEM_ALERT',
    icon: '🛡️',
    title: 'ScienceDojo Safety Alert',
    reason: dynamicReason,
    body: alertBody,
    footer: 'This warning has been recorded on your profile.'
  });

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: systemMessage,
    is_read: false
  });

  revalidatePath("/dashboard", "layout");

  return { success: true };
}
