import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminBookingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    redirect("/dashboard/parent");
  }

  // Fetch all bookings with hardened dual-strategy
  let { data: bookings, error: ledgerError } = await supabase
    .from("bookings")
    .select('*, student:profiles!student_id(full_name, email), tutor:profiles!tutor_id(full_name)')
    .order("created_at", { ascending: false });

  // FALLBACK: Manual profile fetch if the Join failed (PGRST200)
  if (ledgerError || !bookings) {
     const { data: rawBookings } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });

     if (rawBookings && rawBookings.length > 0) {
        const profileIds = [...new Set([
           ...rawBookings.map(b => b.student_id),
           ...rawBookings.map(b => b.tutor_id)
        ])];

        const { data: manualProfiles } = await supabase
           .from("profiles")
           .select("id, full_name, email")
           .in("id", profileIds);

        const profileMap = Object.fromEntries(manualProfiles?.map(p => [p.id, { full_name: p.full_name, email: p.email }]) || []);

        bookings = rawBookings.map(b => ({
           ...b,
           student: profileMap[b.student_id] || { full_name: "Unknown Student" },
           tutor: profileMap[b.tutor_id] || { full_name: "Unknown Tutor" }
        }));
     }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen">
      <div className="mb-10 flex items-end justify-between">
         <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Bookings Ledger</h1>
            <p className="text-slate-500 font-medium">Global view of all platform tutoring sessions.</p>
         </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
         <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
           <h2 className="font-bold text-slate-800">All Sessions ({bookings?.length || 0})</h2>
         </div>
         <table className="w-full text-left border-collapse">
            <thead>
               <tr className="border-b border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] bg-slate-50">
                  <th className="p-6">Date</th>
                  <th className="p-6">Student</th>
                  <th className="p-6">Tutor</th>
                  <th className="p-6">Subject & Price</th>
                  <th className="p-6 text-right">Status</th>
               </tr>
            </thead>
            <tbody className="font-medium">
                {bookings?.map((booking: any, i) => {
                   const student = booking.student || {};
                   const tutor = booking.tutor || {};

                  return (
                    <tr key={booking.id} className={`hover:bg-slate-50 transition-colors ${i !== bookings.length - 1 ? 'border-b border-slate-100' : ''}`}>
                       <td className="p-6 text-sm text-slate-600 font-bold">
                          {new Date(booking.requested_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                       </td>
                       <td className="p-6 text-sm text-slate-800">
                          <div className="font-bold">{student.full_name || "Unknown"}</div>
                          <div className="text-[10px] text-slate-400">{student.email}</div>
                       </td>
                       <td className="p-6 text-sm text-slate-800 font-bold">
                          {tutor.full_name || "Unknown"}
                       </td>
                       <td className="p-6">
                          <span className="text-[9px] uppercase font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full tracking-widest block w-fit mb-1">
                            {booking.subject}
                          </span>
                          <div className="text-sm font-black text-slate-600">£{booking.price_at_booking}</div>
                       </td>
                       <td className="p-6 text-right">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                            booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                            booking.status === 'requested' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-50 text-red-600'
                          }`}>
                            {booking.status}
                          </span>
                       </td>
                    </tr>
                  )
               })}
               
               {(!bookings || bookings.length === 0) && (
                 <tr>
                   <td colSpan={5} className="p-12 text-center text-slate-400 font-bold">No bookings found.</td>
                 </tr>
               )}
            </tbody>
         </table>
      </div>
    </div>
  );
}
