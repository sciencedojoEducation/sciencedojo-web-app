import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { revalidatePath } from "next/cache";

async function resolveDispute(formData: FormData) {
  "use server"
  const supabase = await createClient();
  const id = formData.get("id") as string;
  const status = formData.get("status") as string;
  const adminNotes = formData.get("notes") as string;

  const { error } = await supabase
    .from("disputes")
    .update({ 
      status: status,
      admin_notes: adminNotes,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) console.error("Update dispute error:", error.message);
  
  revalidatePath(`/dashboard/admin/disputes/${id}`);
  revalidatePath("/dashboard/admin/disputes");
}

export default async function DisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Fetch Dispute details
  const { data: dispute, error: dError } = await supabase
    .from("disputes")
    .select(`
      *,
      reporter:profiles!disputes_reporter_id_fkey(id, full_name, role),
      booking:bookings(
        id, 
        subject, 
        requested_date, 
        status,
        meeting_url,
        price_at_booking,
        student:profiles!bookings_student_id_fkey(id, full_name, avatar_url),
        tutor:profiles!bookings_tutor_id_fkey(id, full_name, avatar_url)
      )
    `)
    .eq("id", id)
    .single();

  if (dError || !dispute) return notFound();

  // 2. Fetch Chat Evidence for this booking
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("booking_id", dispute.booking_id)
    .single();

  let messages: any[] = [];
  if (conversation) {
    const { data: mData } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true });
    messages = mData || [];
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-10 flex items-center justify-between border-b border-secondary/10 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <span className="text-secondary/40 text-sm font-bold tracking-widest uppercase">Case #{dispute.id.slice(0,8)}</span>
             <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                dispute.status === 'open' ? 'bg-amber-100 text-amber-700' : 
                dispute.status === 'under_review' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
              }`}>
                {dispute.status.replace('_', ' ')}
              </span>
          </div>
          <h1 className="text-3xl font-black text-secondary">Investigate Dispute</h1>
        </div>
        <button 
           className="px-6 py-2 bg-slate-50 text-secondary font-bold text-sm rounded-xl hover:bg-slate-100 transition-all border border-secondary/10"
           onClick={() => { /* Implementation for going back */ }}
        >
          Back to List
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Investigation Details & Chat Evidence */}
        <div className="lg:col-span-2 space-y-8">
           
           {/* Dispute Summary */}
           <div className="bg-white p-8 rounded-3xl border border-secondary/10 shadow-sm relative">
              <div className="absolute top-0 right-0 p-8">
                 <svg className="w-12 h-12 text-secondary/5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                 </svg>
              </div>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">Platform Violation Report</p>
              <h2 className="text-2xl font-black text-secondary mb-4">{dispute.reason}</h2>
              <div className="flex gap-12 border-t border-secondary/5 pt-6">
                 <div>
                    <p className="text-[10px] uppercase font-black text-secondary/40 tracking-widest mb-1">Reporter</p>
                    <p className="text-sm font-bold text-secondary">{dispute.reporter?.full_name}</p>
                 </div>
                 <div>
                    <p className="text-[10px] uppercase font-black text-secondary/40 tracking-widest mb-1">Reported At</p>
                    <p className="text-sm font-bold text-secondary">{format(new Date(dispute.created_at), "MMM d, yyyy HH:mm")}</p>
                 </div>
              </div>
           </div>

           {/* Chat Evidence Transcript */}
           <div className="bg-white rounded-3xl border border-secondary/10 shadow-sm overflow-hidden">
              <div className="p-6 bg-slate-50 border-b border-secondary/10 flex justify-between items-center">
                 <h3 className="font-bold text-secondary flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Evidence: Chat Transcript
                 </h3>
                 <span className="text-[10px] uppercase font-black text-secondary/40">Secure Auditor View</span>
              </div>
              <div className="p-8 max-h-[600px] overflow-y-auto space-y-6 bg-slate-50/50">
                 {messages.length === 0 ? (
                    <div className="py-12 text-center text-secondary/30 italic">No chat messages found for this booking.</div>
                 ) : (
                    messages.map((msg) => {
                       const isReporter = msg.sender_id === dispute.reporter_id;
                       const senderName = isReporter ? dispute.reporter?.full_name : 
                         (msg.sender_id === dispute.booking?.student?.id ? dispute.booking?.student?.full_name : dispute.booking?.tutor?.full_name);
                       
                       return (
                          <div key={msg.id} className="border-l-2 border-secondary/10 pl-4 py-2 hover:bg-white transition-colors">
                             <div className="flex justify-between items-baseline mb-1">
                                <span className={`text-xs font-black uppercase tracking-widest ${isReporter ? 'text-primary' : 'text-secondary/60'}`}>
                                   {senderName}
                                </span>
                                <span className="text-[9px] text-secondary/30 font-bold">{format(new Date(msg.created_at), "HH:mm")}</span>
                             </div>
                             <p className={`text-sm leading-relaxed ${msg.is_flagged ? 'text-red-600 bg-red-50 p-2 rounded-lg border border-red-100' : 'text-secondary/80'}`}>
                                {msg.content}
                             </p>
                             {msg.is_flagged && (
                                <p className="text-[9px] font-black text-red-500 uppercase mt-1">⚠️ Safety Violation Detected</p>
                             )}
                          </div>
                       );
                    })
                 )}
              </div>
           </div>

        </div>

        {/* Right: Actions & Metadata */}
        <div className="space-y-6">
           
           {/* Session Overview */}
           <div className="bg-white p-6 rounded-3xl border border-secondary/10 shadow-sm">
              <h3 className="text-lg font-black text-secondary mb-4 underline decoration-primary decoration-4 underline-offset-4">Session Info</h3>
              <div className="space-y-4">
                 <div>
                    <label className="text-[10px] font-black text-secondary/30 uppercase block">Subject</label>
                    <p className="font-bold text-secondary">{dispute.booking?.subject}</p>
                 </div>
                 <div className="flex justify-between">
                    <div>
                       <label className="text-[10px] font-black text-secondary/30 uppercase block">Total Price</label>
                       <p className="font-black text-secondary text-xl">£{dispute.booking?.price_at_booking}</p>
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-secondary/30 uppercase block text-right">Status</label>
                       <p className="font-bold text-amber-600 text-right uppercase text-xs">{dispute.booking?.status}</p>
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-secondary/30 uppercase block">Class Date</label>
                    <p className="font-bold text-secondary">{format(new Date(dispute.booking?.requested_date), "EEEE, MMM d, yyyy")}</p>
                 </div>
              </div>
           </div>

           {/* Administrative Actions */}
           <div className="bg-white p-8 rounded-3xl border-2 border-primary/20 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
              <h3 className="text-xl font-black text-secondary mb-6">Final Ruling</h3>
              <form action={resolveDispute} className="space-y-6">
                 <input type="hidden" name="id" value={dispute.id} />
                 
                 <div>
                    <label className="block text-xs font-black text-secondary/50 uppercase tracking-widest mb-2">Set Verdict</label>
                    <select 
                      name="status"
                      defaultValue={dispute.status}
                      className="w-full p-3 rounded-xl border border-secondary/10 bg-slate-50 text-sm font-bold text-secondary focus:ring-2 focus:ring-primary/20"
                    >
                       <option value="open">Keep Open</option>
                       <option value="under_review">Mark Under Review</option>
                       <option value="resolved">Resolved (Close Case)</option>
                       <option value="dismissed">Dismissed (No Action)</option>
                    </select>
                 </div>

                 <div>
                    <label className="block text-xs font-black text-secondary/50 uppercase tracking-widest mb-2">Internal Admin Notes</label>
                    <textarea 
                      name="notes"
                      defaultValue={dispute.admin_notes}
                      placeholder="Add details about your investigation and final ruling here..."
                      className="w-full h-32 p-4 rounded-xl border border-secondary/10 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-primary/20 resize-none"
                    ></textarea>
                 </div>

                 <button 
                   type="submit"
                   className="w-full py-4 bg-primary text-white font-black uppercase tracking-[0.2em] text-xs rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95"
                 >
                    Apply Ruling
                 </button>
              </form>
           </div>

        </div>
      </div>
    </div>
  );
}
