"use client"

import { Conversation } from "@/lib/messaging-queries";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  isInternal?: boolean;
}

function getMessagePreview(message?: string) {
  try {
    if (message?.startsWith('{')) {
      const parsed = JSON.parse(message);
      if (parsed.type) return `${parsed.icon || '🔔'} System Alert`;
    }
  } catch {}

  return message || "No messages yet";
}

export default function ConversationList({ conversations, activeId, isInternal = false }: ConversationListProps) {
  const router = useRouter();

  const handleSelect = (id: string) => {
    router.push(`/dashboard/messages?id=${id}`);
  };

  return (
    <div className="flex h-full min-w-0 flex-col overflow-y-auto bg-white lg:border-r lg:border-secondary/10">
      <div className="border-b border-secondary/10 p-5 sm:p-6">
        <h2 className="text-xl font-black text-secondary">Messages</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-secondary/45">
          {isInternal
            ? "Private conversations with internal teammates and admins stay connected here."
            : "Conversations with tutors, students, and families stay connected here."}
        </p>
      </div>
      
      <div className="flex-1">
        {conversations.length === 0 ? (
          <div className="flex h-full min-h-[22rem] flex-col items-center justify-center p-8 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/5">
              <svg className="h-8 w-8 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 4v-4z" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-secondary">No messages yet</h3>
            <p className="mt-2 max-w-xs text-sm font-medium leading-6 text-secondary/45">
              {isInternal
                ? "Choose an internal contact above to start a staff conversation."
                : "Your conversations with tutors, students, or parents will appear here once support begins."}
            </p>
          </div>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => handleSelect(conv.id)}
              className={`flex w-full min-w-0 items-start gap-4 border-b border-secondary/5 p-4 text-left transition-all hover:bg-secondary/5 sm:p-5 ${
                activeId === conv.id ? "bg-primary/5 border-l-4 border-l-primary" : "border-l-4 border-l-transparent"
              }`}
            >
              <div className="relative w-12 h-12 shrink-0">
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-surface shadow-sm">
                  {conv.other_participant?.avatar_url ? (
                    <Image
                      src={conv.other_participant.avatar_url}
                      alt={conv.other_participant.full_name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {conv.other_participant?.full_name.charAt(0)}
                    </div>
                  )}
                </div>
                {conv.unread_count && conv.unread_count > 0 ? (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-white">
                    {conv.unread_count}
                  </span>
                ) : null}
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex min-w-0 items-start justify-between gap-3">
                  <h3 className="line-clamp-2 min-w-0 text-sm font-bold leading-5 text-secondary">
                    {conv.booking ? `${conv.booking.subject} w/ ${conv.other_participant?.full_name}` : conv.other_participant?.full_name}
                  </h3>
                  <span className="max-w-[5.5rem] shrink-0 text-right text-[10px] font-medium leading-4 text-secondary/40">
                    {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                  </span>
                </div>
                <p className={`line-clamp-2 text-xs leading-5 ${conv.unread_count && conv.unread_count > 0 ? "font-bold text-secondary" : "text-secondary/60"}`}>
                  {getMessagePreview(conv.last_message)}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
