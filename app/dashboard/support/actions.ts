"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

/**
 * Finds or creates a support conversation between the current user and an admin,
 * then redirects to the messages page with that conversation open.
 * 
 * This is the entry point for all "Contact Admin/Support" flows.
 */
export async function getOrCreateSupportConversation(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Find an admin profile to contact
  const { data: adminProfile, error: adminError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "admin")
    .limit(1)
    .single();

  if (adminError || !adminProfile) {
    console.error("Support Hub: Could not find an admin profile.", adminError?.message);
    // Redirect to messages anyway; the UI can handle the empty state
    redirect("/dashboard/messages");
  }

  // 2. Check if support conversation already exists (without a booking_id)
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .or(
      `and(participant_1_id.eq.${user.id},participant_2_id.eq.${adminProfile.id}),and(participant_1_id.eq.${adminProfile.id},participant_2_id.eq.${user.id})`
    )
    .is("booking_id", null)
    .maybeSingle();

  if (existing) {
    redirect(`/dashboard/messages?id=${existing.id}`);
  }

  // 3. Create a new support conversation
  const { data: newConv, error: convError } = await supabase
    .from("conversations")
    .insert({
      participant_1_id: user.id,
      participant_2_id: adminProfile.id,
      booking_id: null,
    })
    .select("id")
    .single();

  if (convError || !newConv) {
    console.error("Support Hub: Could not create support conversation.", convError?.message);
    redirect("/dashboard/messages");
  }

  // 4. Send an automated opening message so the conversation is ready to use
  const message = formData.get("message") as string | null;
  const openingMessage = message?.trim() || "Hello! I need some help with my account.";

  await supabase.from("messages").insert({
    conversation_id: newConv.id,
    sender_id: user.id,
    content: openingMessage,
    is_flagged: false,
  });

  redirect(`/dashboard/messages?id=${newConv.id}`);
}
