import { getConversations, getMessages } from "@/lib/messaging-queries";
import ConversationList from "./ConversationList";
import ChatWindow from "./ChatWindow";
import { createClient } from "@/utils/supabase/server";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id: activeId } = await searchParams;
  const conversations = await getConversations();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const activeConversation = activeId
    ? conversations.find(c => c.id === activeId) 
    : null;

  const initialMessages = activeConversation ? await getMessages(activeConversation.id) : [];

  return (
    <div className="h-full min-h-0 overflow-hidden bg-slate-50 lg:grid lg:grid-cols-[360px_1fr]">
      <div className={`${activeConversation ? "hidden lg:block" : "block"} h-full min-h-0 lg:block`}>
        <ConversationList 
          conversations={conversations} 
          activeId={activeId || null}
        />
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
                Select a chat from the sidebar to start messaging your tutors or students.
             </p>
          </div>
        )}
      </div>
    </div>
  );
}
