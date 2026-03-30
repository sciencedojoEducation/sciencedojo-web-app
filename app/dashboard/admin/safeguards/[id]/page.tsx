import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { format } from "date-fns";
import DojoFilter from "@/components/DojoFilter";

export default async function ConversationTranscript({ params }: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = await params;
  const supabase = await createClient();

  // 1. Fetch Conversation Context (Participants)
  const { data: conversation } = await supabase
    .from("conversations")
    .select(`
      id,
      participant_1:profiles!conversations_participant_1_id_fkey(id, full_name, role, avatar_url),
      participant_2:profiles!conversations_participant_2_id_fkey(id, full_name, role, avatar_url)
    `)
    .eq("id", conversationId)
    .single();

  // 2. Fetch All Messages
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (!conversation) return <div>Conversation not found</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <Link 
              href="/dashboard/admin/safeguards"
              className="w-10 h-10 rounded-full bg-secondary/5 flex items-center justify-center hover:bg-secondary/10 transition-colors"
            >
               <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </Link>
            <div>
               <h1 className="text-2xl font-black text-secondary">Conversation Transcript 🕵️‍♂️</h1>
               <p className="text-secondary/60 text-xs font-bold uppercase tracking-widest mt-1">
                 {conversation.participant_1?.full_name} ↔ {conversation.participant_2?.full_name}
               </p>
            </div>
         </div>
      </div>

      <div className="bg-slate-50 rounded-[3rem] p-8 border border-secondary/10 shadow-inner">
         <div className="space-y-6">
            {messages?.map((msg) => {
               const sender = msg.sender_id === conversation.participant_1?.id 
                  ? conversation.participant_1 
                  : conversation.participant_2;
               
               return (
                  <div key={msg.id} className={`flex flex-col ${msg.is_flagged ? 'relative' : ''}`}>
                     <div className={`flex items-start gap-4 ${msg.is_flagged ? 'p-6 bg-red-50/50 rounded-3xl border border-red-100 shadow-sm' : ''}`}>
                        <div className="w-10 h-10 rounded-full bg-white border-2 border-secondary/10 overflow-hidden shrink-0 shadow-sm">
                           {sender?.avatar_url ? (
                              <img src={sender.avatar_url} alt={sender.full_name} className="w-full h-full object-cover" />
                           ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-secondary/40 text-xs">{sender?.full_name?.charAt(0)}</div>
                           )}
                        </div>
                        <div className="flex-1">
                           <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-black text-secondary uppercase tracking-tight">{sender?.full_name}</span>
                              <span className="text-[10px] text-secondary/40 font-bold">{format(new Date(msg.created_at), "MMM d, h:mm a")}</span>
                           </div>
                           <div className="text-sm text-secondary/70 leading-relaxed font-medium">
                              {msg.content}
                           </div>
                           
                           {msg.is_flagged && (
                              <div className="mt-4 pt-4 border-t border-red-200/50 flex flex-col gap-2">
                                 <div className="flex items-center gap-2">
                                    <span className="bg-red-600 text-white text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full shadow-sm">Safety Violation Flagged</span>
                                 </div>
                                 <div className="text-[10px] font-bold text-red-600/70 italic">
                                    Reason: {msg.flagged_reason || "Automated contact info detection"}
                                 </div>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
               );
            })}
         </div>
      </div>
      
      <div className="mt-8 flex justify-end gap-3">
         <button className="px-6 py-3 bg-white border border-secondary/10 text-secondary/60 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-colors">
            Dismiss as Noise
         </button>
         <button className="px-6 py-3 bg-secondary text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-secondary/90 shadow-lg active:scale-95 transition-all">
            Issue Warning
         </button>
      </div>
    </div>
  );
}
