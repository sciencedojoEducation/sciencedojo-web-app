import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default async function AdminSafeguards() {
  const supabase = await createClient();

  // Fetch all flagged messages, joined with sender and conversation participants
  const { data: flaggedMessages, error } = await supabase
    .from("messages")
    .select(`
      id,
      content,
      created_at,
      flagged_reason,
      conversation_id,
      sender_id,
      sender:profiles!messages_sender_id_fkey(id, full_name, role, avatar_url),
      conversation:conversations(
        participant_1:profiles!conversations_participant_1_id_fkey(full_name),
        participant_2:profiles!conversations_participant_2_id_fkey(full_name)
      )
    `)
    .eq("is_flagged", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch flagged messages error:", error.message);
  }

  // Group flagged messages by conversation_id — one row per conversation
  const conversationMap = new Map<string, any>();
  for (const msg of flaggedMessages || []) {
    if (!conversationMap.has(msg.conversation_id)) {
      conversationMap.set(msg.conversation_id, {
        conversation_id: msg.conversation_id,
        sender: msg.sender,
        sender_id: msg.sender_id,
        conversation: msg.conversation,
        latestMessage: msg,
        flaggedReasons: new Set<string>(),
        count: 0,
      });
    }
    const entry = conversationMap.get(msg.conversation_id);
    entry.count += 1;
    if (msg.flagged_reason) entry.flaggedReasons.add(msg.flagged_reason);
  }

  const groupedAlerts = Array.from(conversationMap.values());

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-10 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <Link 
              href="/dashboard/admin"
              className="w-10 h-10 rounded-full bg-secondary/5 flex items-center justify-center hover:bg-secondary/10 transition-colors"
            >
               <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </Link>
            <div>
               <h1 className="text-3xl font-black mb-1 bg-gradient-to-r from-secondary to-red-600 bg-clip-text text-transparent">
                  Dojo Safeguards 🛡️
               </h1>
               <p className="text-secondary/70 text-sm font-medium tracking-tight">Review flagged messaging violations and maintain platform safety.</p>
            </div>
         </div>
         <div className="bg-red-50 px-4 py-2 rounded-2xl border border-red-100 flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-red-600 animate-pulse"></span>
            <span className="text-xs font-black text-red-600 uppercase tracking-widest">{groupedAlerts.length} Alerts Active</span>
         </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-secondary/10 shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50 border-b border-secondary/5">
                     <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-secondary/40">Sender</th>
                     <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-secondary/40">Latest Violation</th>
                     <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-secondary/40">Detected Reasons</th>
                     <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-secondary/40 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-secondary/5">
                  {groupedAlerts.map((alert: any) => {
                    const reasons = Array.from(alert.flaggedReasons as Set<string>);
                    return (
                      <tr key={alert.conversation_id} className="hover:bg-slate-50/50 transition-colors">
                         <td className="px-6 py-6">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-full bg-secondary/10 border-2 border-white shadow-sm overflow-hidden">
                                  {alert.sender?.avatar_url ? (
                                     <img src={alert.sender.avatar_url} alt="Sender" className="w-full h-full object-cover" />
                                  ) : (
                                     <div className="w-full h-full flex items-center justify-center font-bold text-secondary">{alert.sender?.full_name?.charAt(0)}</div>
                                  )}
                               </div>
                               <div>
                                  <p className="text-sm font-bold text-secondary">{alert.sender?.full_name}</p>
                                  <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-secondary/5 text-secondary/50 rounded-md">
                                     {alert.sender?.role}
                                  </span>
                               </div>
                            </div>
                         </td>
                         <td className="px-6 py-6 max-w-sm">
                            <div className="bg-slate-50 p-3 rounded-2xl border border-secondary/5">
                               <p className="text-xs text-secondary/80 font-medium leading-relaxed italic">
                                  &quot;{alert.latestMessage.content.substring(0, 100)}{alert.latestMessage.content.length > 100 ? '...' : ''}&quot;
                               </p>
                               <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-secondary/40">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  {formatDistanceToNow(new Date(alert.latestMessage.created_at))} ago
                                  {alert.count > 1 && (
                                     <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-600 rounded-md font-black text-[9px]">
                                       +{alert.count - 1} more flagged{alert.count - 1 > 1 ? ' messages' : ' message'}
                                     </span>
                                  )}
                               </div>
                            </div>
                         </td>
                         <td className="px-6 py-6">
                            <div className="flex flex-wrap items-center gap-1.5">
                               {reasons.length > 0 ? reasons.map((r: string) => (
                                  <span key={r} className="px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100">
                                     {r}
                                  </span>
                               )) : (
                                  <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100">
                                     Safety Violation
                                  </span>
                               )}
                            </div>
                         </td>
                         <td className="px-6 py-6 text-right">
                            <Link 
                               href={`/dashboard/admin/safeguards/${alert.conversation_id}`}
                               className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-xl text-xs font-bold hover:bg-secondary/90 transition-all shadow-md active:scale-95"
                            >
                               Review Transcript
                               <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </Link>
                         </td>
                      </tr>
                    );
                  })}
               </tbody>
            </table>
            {groupedAlerts.length === 0 && (
               <div className="p-20 text-center">
                  <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                     <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </div>
                  <h3 className="text-xl font-bold text-secondary mb-2">Platform Secure</h3>
                  <p className="text-secondary/60 text-sm max-w-sm mx-auto">No flagged safety violations detected. All conversations are moving through the Dojo safely.</p>
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
