"use client"

import { useEffect, useState, useRef } from "react";
import { Message } from "@/lib/messaging-queries";
import { createClient } from "@/utils/supabase/client";
import { sendMessage, markAsRead } from "./actions";
import DojoFilter from "@/components/DojoFilter";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";

interface ChatWindowProps {
  conversationId: string;
  initialMessages: Message[];
  otherParticipant: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
  currentUserId: string;
  booking?: {
    subject: string;
    requested_date: string;
    status: string;
  };
  showMobileBack?: boolean;
}

export default function ChatWindow({ 
  conversationId, 
  initialMessages, 
  otherParticipant,
  currentUserId,
  booking,
  showMobileBack = false,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    setMessages(initialMessages);
    markAsRead(conversationId);

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((current) => {
            // Check if message already exists to avoid duplicates
            if (current.find((m) => m.id === newMessage.id)) return current;
            return [...current, newMessage];
          });
          
          if (newMessage.sender_id !== currentUserId) {
            markAsRead(conversationId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, initialMessages, currentUserId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSending) return;

    setIsSending(true);
    const text = content.trim();
    setContent("");

    const res = await sendMessage(conversationId, text);
    if (res.error) {
      alert(res.error);
    }
    setIsSending(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File is too large. Max size is 10MB.");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${conversationId}/${Date.now()}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from('message-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { error: msgError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: `Shared a file: ${file.name}`,
          is_file: true,
          file_url: data.path,
          file_name: file.name
        });

      if (msgError) throw msgError;

    } catch (err: any) {
      console.error("Upload error:", err.message);
      alert("Failed to upload file.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="relative flex h-full min-w-0 flex-col overflow-hidden bg-slate-50">
      {/* Header */}
      <div className="z-10 flex min-w-0 items-center gap-3 border-b border-secondary/10 bg-white p-3 shadow-sm sm:p-4">
        {showMobileBack && (
          <Link
            href="/dashboard/messages"
            aria-label="Back to conversations"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-secondary/10 bg-slate-50 text-secondary transition-colors hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 lg:hidden"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        )}
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-secondary/5">
          {otherParticipant.avatar_url ? (
            <Image
              src={otherParticipant.avatar_url}
              alt={otherParticipant.full_name}
              width={40}
              height={40}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {otherParticipant.full_name.charAt(0)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-black text-secondary">{otherParticipant.full_name}</h3>
          <p className="truncate text-[10px] font-bold uppercase tracking-widest text-secondary/40">
            {booking ? `${booking.subject} support` : "Conversation"}
          </p>
        </div>
      </div>

      {/* Session Context Banner */}
      {booking && (
        <div className="flex flex-col gap-1 border-b border-primary/10 bg-primary/5 px-4 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-6">
           <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="text-primary text-xs font-black uppercase tracking-widest">Session Context:</span>
              <span className="text-xs font-bold text-secondary">{booking.subject} • {format(new Date(booking.requested_date), "MMM d, yyyy")}</span>
           </div>
           <span className="w-fit rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase text-primary">
              {booking.status}
           </span>
        </div>
      )}

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6"
      >
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;

          // Detect structured system alert messages
          let systemAlert: { type: string; icon: string; title: string; reason: string; body: string; footer: string } | null = null;
          if (msg.content.startsWith('{')) {
            try {
              const parsed = JSON.parse(msg.content);
              if (parsed.type === 'SYSTEM_ALERT') systemAlert = parsed;
            } catch { /* not JSON, render normally */ }
          }

          if (systemAlert) {
            return (
              <div key={msg.id} className="flex justify-center my-2">
                <div className="w-full max-w-[92%] overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 shadow-sm md:max-w-[85%]">
                  {/* Header */}
                  <div className="flex items-center gap-2 bg-amber-100 px-4 py-2.5 border-b border-amber-200">
                    <span className="text-base">{systemAlert.icon}</span>
                    <span className="text-xs font-black text-amber-800 uppercase tracking-widest">{systemAlert.title}</span>
                  </div>
                  {/* Body */}
                  <div className="px-4 py-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest mt-0.5 shrink-0">Flagged for:</span>
                      <span className="text-xs font-bold text-amber-900">{systemAlert.reason}</span>
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed">{systemAlert.body}</p>
                    <p className="text-[10px] text-amber-600 font-bold italic border-t border-amber-200 pt-2 mt-2">{systemAlert.footer}</p>
                  </div>
                  {/* Timestamp */}
                  <div className="px-4 pb-2">
                    <p className="text-[9px] text-amber-500 font-bold text-right">{format(new Date(msg.created_at), "HH:mm")}</p>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[88%] break-words rounded-2xl px-4 py-3 text-sm shadow-sm md:max-w-[70%] ${
                  isMe
                    ? "bg-primary text-white rounded-tr-none"
                    : "bg-white text-secondary rounded-tl-none border border-secondary/5"
                }`}
              >
                {msg.is_file ? (
                  <a 
                    href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/authenticated/message-attachments/${msg.file_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all border border-white/10 mb-2"
                  >
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-xl">📄</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{msg.file_name}</p>
                      <p className="text-[9px] opacity-60 font-medium">Click to download</p>
                    </div>
                  </a>
                ) : (
                  <p className="leading-relaxed">{msg.content}</p>
                )}
                
                {msg.is_flagged && (
                  <div className="mt-2 pt-2 border-t border-red-500/20 flex items-center gap-1.5 text-[9px] font-bold text-red-500 bg-red-50/50 p-1 rounded">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    Safety Flag: Please keep contact info on-platform.
                  </div>
                )}
                <p className={`text-[9px] mt-1.5 opacity-50 font-bold ${isMe ? "text-right" : "text-left"}`}>
                  {format(new Date(msg.created_at), "HH:mm")}
                </p>
              </div>
            </div>
          );
        })}

      </div>

      {/* Input */}
      <div className="border-t border-secondary/10 bg-white p-3 sm:p-4">
        <form onSubmit={handleSend} className="flex min-w-0 items-center gap-2 sm:gap-4">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
          />
          <button 
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-secondary/10 bg-slate-50 text-secondary/40 transition-all hover:bg-slate-100 disabled:opacity-50 sm:h-12 sm:w-12"
            title="Attach File"
            aria-label="Attach file"
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
            )}
          </button>
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your professional message..."
            className="h-11 min-w-0 flex-1 rounded-2xl border border-secondary/10 bg-slate-50 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 sm:h-12 sm:px-6"
          />
          <button
            type="submit"
            disabled={isSending || !content.trim()}
            className="shrink-0 rounded-xl bg-primary p-3 text-white shadow-md transition-all hover:bg-primary-hover active:scale-95 disabled:opacity-50"
            aria-label="Send message"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
