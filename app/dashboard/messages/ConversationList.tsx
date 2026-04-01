"use client"

import { Conversation } from "@/lib/messaging-queries";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
}

export default function ConversationList({ conversations, activeId }: ConversationListProps) {
  const router = useRouter();

  const handleSelect = (id: string) => {
    router.push(`/dashboard/messages?id=${id}`);
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-secondary/10 overflow-y-auto">
      <div className="p-6 border-b border-secondary/10">
        <h2 className="text-xl font-black text-secondary">Messages</h2>
      </div>
      
      <div className="flex-1">
        {conversations.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-secondary/40 font-medium">No conversations yet.</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => handleSelect(conv.id)}
              className={`w-full p-4 flex items-center gap-4 transition-all border-b border-secondary/5 hover:bg-secondary/5 ${
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
              
              <div className="flex-1 text-left min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-secondary text-sm truncate">
                    {conv.booking ? `${conv.booking.subject} w/ ${conv.other_participant?.full_name}` : conv.other_participant?.full_name}
                  </h3>
                  <span className="text-[10px] text-secondary/40 font-medium whitespace-nowrap ml-2">
                    {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                  </span>
                </div>
                <p className={`text-xs truncate ${conv.unread_count && conv.unread_count > 0 ? "font-bold text-secondary" : "text-secondary/60"}`}>
                  {(() => {
                    try {
                      if (conv.last_message?.startsWith('{')) {
                        const parsed = JSON.parse(conv.last_message);
                        if (parsed.type) return `${parsed.icon || '🔔'} System Alert`;
                      }
                    } catch (e) {}
                    return conv.last_message;
                  })()}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
