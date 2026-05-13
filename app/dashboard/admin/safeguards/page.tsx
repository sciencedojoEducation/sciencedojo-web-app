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
    <div className="mx-auto max-w-6xl px-3 py-5 sm:px-4 md:p-8">
      <div className="mb-5 flex flex-col gap-4 lg:mb-10 lg:flex-row lg:items-center lg:justify-between">
         <div className="flex items-center gap-3">
            <Link 
              href="/dashboard/admin"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary/5 transition-colors hover:bg-secondary/10"
            >
               <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </Link>
            <div>
               <h1 className="mb-1 bg-gradient-to-r from-secondary to-red-600 bg-clip-text text-2xl font-black text-transparent md:text-3xl">
                  Dojo Safeguards
               </h1>
               <p className="max-w-xl text-sm font-medium leading-6 tracking-tight text-secondary/65">
                  Review flagged conversations and keep ScienceDojo learning spaces protected.
               </p>
            </div>
         </div>
         <div className="flex w-fit items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-2">
            <span className="flex h-2 w-2 rounded-full bg-red-600"></span>
            <span className="text-xs font-black uppercase tracking-widest text-red-600">{groupedAlerts.length} Alerts Active</span>
         </div>
      </div>

      <div className="grid gap-3 lg:hidden">
         {groupedAlerts.map((alert: any) => {
            const reasons = Array.from(alert.flaggedReasons as Set<string>);

            return (
               <article key={alert.conversation_id} className="rounded-[1.5rem] border border-secondary/10 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                     <div className="flex min-w-0 items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-2xl border border-white bg-secondary/10 shadow-sm">
                           {alert.sender?.avatar_url ? (
                              <img src={alert.sender.avatar_url} alt="Sender" className="h-full w-full object-cover" />
                           ) : (
                              <div className="flex h-full w-full items-center justify-center font-bold text-secondary">{alert.sender?.full_name?.charAt(0)}</div>
                           )}
                        </div>
                        <div className="min-w-0">
                           <p className="truncate text-sm font-black text-secondary">{alert.sender?.full_name || "Unknown sender"}</p>
                           <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-secondary/38">{alert.sender?.role || "Participant"}</p>
                        </div>
                     </div>
                     <span className="shrink-0 rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-red-600">
                        {alert.count} flag{alert.count === 1 ? "" : "s"}
                     </span>
                  </div>

                  <div className="mt-4 rounded-2xl border border-secondary/5 bg-slate-50 p-3">
                     <p className="text-sm font-semibold italic leading-6 text-secondary/75">
                        &quot;{alert.latestMessage.content.substring(0, 130)}{alert.latestMessage.content.length > 130 ? "..." : ""}&quot;
                     </p>
                     <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.1em] text-secondary/35">
                        {formatDistanceToNow(new Date(alert.latestMessage.created_at))} ago
                     </p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                     {reasons.length > 0 ? reasons.map((reason: string) => (
                        <span key={reason} className="rounded-full border border-red-100 bg-red-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-red-600">
                           {reason}
                        </span>
                     )) : (
                        <span className="rounded-full border border-red-100 bg-red-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-red-600">
                           Safety violation
                        </span>
                     )}
                  </div>

                  <Link
                     href={`/dashboard/admin/safeguards/${alert.conversation_id}`}
                     className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-secondary px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-white shadow-sm transition-colors hover:bg-secondary/90"
                  >
                     Review transcript
                     <svg className="ml-2 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </Link>
               </article>
            );
         })}

         {groupedAlerts.length === 0 && (
            <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-6 text-center shadow-sm">
               <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
               </div>
               <h3 className="text-lg font-black text-secondary">Platform secure</h3>
               <p className="mx-auto mt-2 max-w-sm text-sm font-medium leading-6 text-secondary/55">
                  No flagged conversations need review right now. ScienceDojo is actively monitoring learning spaces.
               </p>
            </div>
         )}
      </div>

      <div className="hidden overflow-hidden rounded-[2.5rem] border border-secondary/10 bg-white shadow-sm lg:block">
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
