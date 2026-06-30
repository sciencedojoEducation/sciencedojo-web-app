import { getConversations, getMessages } from "@/lib/messaging-queries";
import ConversationList from "./ConversationList";
import ChatWindow from "./ChatWindow";
import StaffContactList, { type StaffContact } from "./StaffContactList";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { redirect } from "next/navigation";
import { getActiveInternalMemberByUserId } from "@/lib/internal-auth";

function formatRole(value: string | null | undefined) {
  return String(value || "internal").replace(/_/g, " ");
}

async function getInternalStaffContacts(currentUserId: string): Promise<StaffContact[]> {
  const adminClient = createAdminClient();
  const { data: internalMembers } = await adminClient
    .from("internal_team_members")
    .select("user_id, name, role, title")
    .eq("status", "active")
    .not("user_id", "is", null);
  const internalUserIds = (internalMembers || [])
    .map((member) => member.user_id)
    .filter((id): id is string => Boolean(id) && id !== currentUserId);

  const { data: admins } = await adminClient
    .from("profiles")
    .select("id, full_name, avatar_url")
    .eq("role", "admin");
  const adminIds = (admins || [])
    .map((admin) => admin.id)
    .filter((id): id is string => Boolean(id) && id !== currentUserId);
  const profileIds = Array.from(new Set([...internalUserIds, ...adminIds]));

  if (profileIds.length === 0) {
    return [];
  }

  const { data: profiles } = await adminClient
    .from("profiles")
    .select("id, full_name, avatar_url, role")
    .in("id", profileIds);
  const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
  const internalMemberMap = new Map((internalMembers || []).map((member) => [member.user_id, member]));
  const contacts: StaffContact[] = [];

  for (const userId of profileIds) {
    const profile = profileMap.get(userId);
    const member = internalMemberMap.get(userId);
    contacts.push({
      id: userId,
      name: profile?.full_name || member?.name || "ScienceDojo teammate",
      role: profile?.role === "admin" ? "admin" : formatRole(member?.role),
      title: profile?.role === "admin" ? "Platform admin" : member?.title || formatRole(member?.role),
      avatar_url: profile?.avatar_url || null,
    });
  }

  return contacts.sort((a, b) => a.name.localeCompare(b.name));
}

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id: activeId } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const adminClient = createAdminClient();
  const isInternal = Boolean(await getActiveInternalMemberByUserId(adminClient, user.id));

  if (profile?.role === "internal" && !isInternal) {
    redirect(`/login/internal/denied?error=${encodeURIComponent("Your internal access is inactive or has not been linked yet.")}`);
  }

  const conversations = await getConversations();
  const staffContacts = isInternal ? await getInternalStaffContacts(user.id) : [];

  const activeConversation = activeId
    ? conversations.find(c => c.id === activeId) 
    : null;

  const initialMessages = activeConversation ? await getMessages(activeConversation.id) : [];

  return (
    <div className="h-full min-h-0 overflow-hidden bg-slate-50 lg:grid lg:grid-cols-[360px_1fr]">
      <div className={`${activeConversation ? "hidden lg:flex" : "flex"} h-full min-h-0 flex-col lg:flex`}>
        {isInternal && <StaffContactList contacts={staffContacts} />}
        <div className="min-h-0 flex-1">
          <ConversationList
            conversations={conversations}
            activeId={activeId || null}
            isInternal={isInternal}
          />
        </div>
      </div>

      <div className={`${activeConversation ? "block" : "hidden lg:block"} h-full min-w-0`}>
        {activeConversation ? (
          <ChatWindow
            key={activeConversation.id}
            conversationId={activeConversation.id}
            initialMessages={initialMessages}
            otherParticipant={activeConversation.other_participant!}
            currentUserId={user.id}
            booking={activeConversation.booking}
            showMobileBack
            allowFileUploads={!isInternal}
          />
        ) : (
          <div className="hidden h-full flex-col items-center justify-center bg-slate-50 p-8 text-center lg:flex">
             <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
             </div>
             <h2 className="text-xl font-black text-secondary mb-2">Your Conversations</h2>
             <p className="text-sm text-secondary/40 font-medium max-w-xs leading-relaxed">
                {isInternal ? "Select a teammate or admin to continue the conversation." : "Select a chat from the sidebar to start messaging your tutors or students."}
             </p>
          </div>
        )}
      </div>
    </div>
  );
}
