"use client"

import { useEffect, useState, useRef } from "react";
import { Message } from "@/lib/messaging-queries";
import { createClient } from "@/utils/supabase/client";
import { sendMessage, markAsRead } from "./actions";
import DojoFilter from "@/components/DojoFilter";
import Image from "next/image";
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
}

export default function ChatWindow({ 
  conversationId, 
  initialMessages, 
  otherParticipant,
  currentUserId,
  booking
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
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-white border-b border-secondary/10 flex items-center gap-4 z-10 shadow-sm">
        <div className="w-10 h-10 rounded-full overflow-hidden border border-secondary/5">
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
        <div>
          <h3 className="font-black text-secondary">{otherParticipant.full_name}</h3>
          <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Active Now</p>
        </div>
      </div>

      {/* Session Context Banner */}
      {booking && (
        <div className="bg-primary/5 px-6 py-2 border-b border-primary/10 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <span className="text-primary text-xs font-black uppercase tracking-widest">Session Context:</span>
              <span className="text-secondary text-xs font-bold">{booking.subject} • {format(new Date(booking.requested_date), "MMM d, yyyy")}</span>
           </div>
           <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {booking.status}
           </span>
        </div>
      )}

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4"
      >
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] px-4 py-3 rounded-2xl shadow-sm text-sm ${
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
      <div className="p-4 bg-white border-t border-secondary/10">
        <form onSubmit={handleSend} className="flex items-center gap-4">
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
            className="w-12 h-12 flex items-center justify-center bg-slate-50 text-secondary/40 rounded-2xl hover:bg-slate-100 transition-all border border-secondary/10 disabled:opacity-50"
            title="Attach File"
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
            className="flex-1 h-12 px-6 bg-slate-50 border border-secondary/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium"
          />
          <button
            type="submit"
            disabled={isSending || !content.trim()}
            className="bg-primary text-white p-3 rounded-xl hover:bg-primary-hover disabled:opacity-50 transition-all shadow-md active:scale-95"
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
