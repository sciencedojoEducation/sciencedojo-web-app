import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { format } from "date-fns";

export default async function AdminDisputesPage() {
  const supabase = await createClient();
  
  // Fetch disputes with joined data
  const { data: disputes, error } = await supabase
    .from("disputes")
    .select(`
      *,
      reporter:profiles!disputes_reporter_id_fkey(full_name, role),
      booking:bookings(
        id, 
        subject, 
        requested_date, 
        status,
        student:profiles!bookings_student_id_fkey(full_name),
        tutor:profiles!bookings_tutor_id_fkey(full_name)
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch disputes error:", error.message);
  }

  // Also fetch flagged messages count for overview
  const { count: flaggedCount } = await supabase
    .from("messages")
    .select("*", { count: 'exact', head: true })
    .eq("is_flagged", true);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-secondary mb-2">Dispute Management ⚖️</h1>
          <p className="text-secondary/60 font-medium">Review reported issues and investigate flagged safety violations.</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-red-50 border border-red-100 px-4 py-2 rounded-xl text-center">
              <p className="text-[10px] uppercase font-black text-red-500 tracking-widest">Flagged Messages</p>
              <p className="text-xl font-black text-red-600">{flaggedCount || 0}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {(!disputes || disputes.length === 0) ? (
          <div className="bg-white rounded-3xl border border-secondary/10 p-12 text-center shadow-sm">
             <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
             </div>
             <h3 className="text-lg font-bold text-secondary mb-1">No active disputes</h3>
             <p className="text-secondary/60 text-sm">Everything is running smoothly on ScienceDojo.</p>
          </div>
        ) : (
          disputes.map((dispute) => (
            <div key={dispute.id} className="bg-white rounded-3xl border border-secondary/10 shadow-sm overflow-hidden flex flex-col md:flex-row">
              <div className={`w-2 md:w-3 ${
                dispute.status === 'open' ? 'bg-amber-500' : 
                dispute.status === 'under_review' ? 'bg-blue-500' : 'bg-green-500'
              }`}></div>
              
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        dispute.status === 'open' ? 'bg-amber-100 text-amber-700' : 
                        dispute.status === 'under_review' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {dispute.status.replace('_', ' ')}
                      </span>
                      <span className="text-secondary/40 text-xs font-medium">#{dispute.id.slice(0, 8)}</span>
                    </div>
                    <h2 className="text-xl font-black text-secondary">{dispute.reason}</h2>
                  </div>
                  <p className="text-xs text-secondary/40 font-bold">{format(new Date(dispute.created_at), "MMM d, yyyy HH:mm")}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-4 border-y border-secondary/5 mt-4">
                   <div>
                      <p className="text-[10px] uppercase font-black text-secondary/40 tracking-widest mb-1">Reporter</p>
                      <p className="text-sm font-bold text-secondary">{dispute.reporter?.full_name} <span className="opacity-40">({dispute.reporter?.role})</span></p>
                   </div>
                   <div>
                      <p className="text-[10px] uppercase font-black text-secondary/40 tracking-widest mb-1">Session Context</p>
                      <p className="text-sm font-bold text-secondary">{dispute.booking?.subject}</p>
                      <p className="text-xs text-secondary/60">{format(new Date(dispute.booking?.requested_date), "MMM d, yyyy")}</p>
                   </div>
                   <div>
                      <p className="text-[10px] uppercase font-black text-secondary/40 tracking-widest mb-1">Involved Parties</p>
                      <p className="text-xs font-bold text-secondary">Student: {dispute.booking?.student?.full_name}</p>
                      <p className="text-xs font-bold text-secondary">Tutor: {dispute.booking?.tutor?.full_name}</p>
                   </div>
                </div>

                <div className="flex gap-3 mt-6">
                   <Link 
                     href={`/dashboard/admin/disputes/${dispute.id}`}
                     className="px-6 py-2 bg-secondary text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-secondary/90 transition-all shadow-md active:scale-95"
                   >
                     Investigate Case
                   </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
