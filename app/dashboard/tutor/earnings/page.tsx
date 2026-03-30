import { getBookingsByUserId, getTutorEarnings } from "@/lib/supabase-queries";
import { createClient } from "@/utils/supabase/server";

export default async function TutorEarnings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return <p>Please log in.</p>;

  // Fetch real data from Supabase
  const bookings = await getBookingsByUserId(user.id);
  const completedBookings = bookings.filter(b => b.status === "completed");
  const rawTotalCollected = await getTutorEarnings(user.id);
  
  // Fetch live platform fee
  const { data: settings } = await supabase.from("platform_settings").select("platform_fee_percent").limit(1).single();
  const platformFeeRaw = settings?.platform_fee_percent ?? 25;
  const platformFee = platformFeeRaw / 100;
  const tutorCut = 1 - platformFee;

  // Apply Platform Fee
  const liveTotalEarned = rawTotalCollected * tutorCut;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-10">
         <h1 className="text-3xl font-bold text-secondary mb-2 flex items-center gap-4">
            Earnings
            <span className="px-3 py-1 bg-green-500/10 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full">Live Balance</span>
         </h1>
         <p className="text-secondary/60 font-medium">Track your historical payouts and your upcoming Stripe transfers.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
         <div className="bg-gradient-to-br from-[#003366] to-[#001133] p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 group-hover:scale-110 transition-transform"></div>
            <h2 className="text-white/50 font-black uppercase tracking-[0.2em] text-[10px] mb-4">Available Balance</h2>
            <div className="text-6xl font-black mb-2 tracking-tighter">£{liveTotalEarned.toFixed(2)}</div>
            <p className="text-white/40 text-xs font-bold mb-10 flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
               Next Automatic Transfer: Friday
            </p>
            <button className="w-full py-4 bg-white text-secondary font-black rounded-2xl shadow-xl hover:bg-slate-50 transition-all hover:-translate-y-1 active:scale-95 text-sm uppercase tracking-widest">
               Express Payout (Stripe Connect)
            </button>
         </div>

         <div className="bg-white p-10 rounded-[2.5rem] border border-secondary/10 shadow-xl flex flex-col justify-between">
            <div>
               <h2 className="text-secondary/30 font-black uppercase tracking-[0.2em] text-[10px] mb-4">Historical Total</h2>
               <div className="text-4xl font-black text-secondary mb-2">£{liveTotalEarned.toFixed(2)}</div>
               <p className="text-secondary/60 text-xs font-bold mb-8 italic flex items-center gap-2">
                 Lifetime Earnings 
                 <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[9px] uppercase tracking-widest rounded-md">{platformFeeRaw}% Fee Applied</span>
               </p>
            </div>
            
            <div className="pt-6 border-t border-secondary/5">
               <h3 className="font-black text-secondary/40 mb-4 text-[10px] uppercase tracking-widest">Recent Transfers</h3>
               <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm font-bold opacity-30">
                     <span className="text-secondary/60">Legacy Payout (Mock)</span>
                     <span className="font-black">£0.00</span>
                  </div>
                  <p className="text-[10px] text-secondary/30 font-medium">Automatic transfers are logged here once processed by Stripe.</p>
               </div>
            </div>
         </div>
      </div>

      <div className="flex items-center justify-between mb-8">
         <h2 className="text-2xl font-black text-secondary">Payout Ledger</h2>
         <span className="text-xs font-bold text-secondary/40 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">
            Showing {completedBookings.length} completed sessions
         </span>
      </div>

      <div className="bg-white rounded-[2rem] border border-secondary/10 shadow-xl overflow-hidden">
         <table className="w-full text-left border-collapse">
            <thead>
               <tr className="bg-slate-50 border-b border-secondary/10 text-secondary/40 text-[10px] font-black uppercase tracking-[0.2em]">
                  <th className="p-6">Session Date</th>
                  <th className="p-6">Student</th>
                  <th className="p-6">Subject</th>
                  <th className="p-6 text-right">Fee ({platformFeeRaw}%)</th>
                  <th className="p-6 text-right">Net Earned</th>
               </tr>
            </thead>
            <tbody className="font-medium">
               {completedBookings.map((booking, i) => (
                  <tr key={booking.id} className={`border-b border-secondary/5 hover:bg-slate-50/50 transition-colors ${i === completedBookings.length - 1 ? 'border-none' : ''}`}>
                     <td className="p-6 text-sm text-secondary font-black">
                        {new Date(booking.requested_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                     </td>
                     <td className="p-6 text-sm text-secondary/70 flex items-center gap-3 font-bold">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] uppercase text-secondary/40">
                           {booking.student_name?.[0] || 'S'}
                        </div>
                        {booking.student_name}
                     </td>
                     <td className="p-6">
                        <span className="text-xs font-bold text-secondary/40 uppercase tracking-widest bg-secondary/5 px-2 py-1 rounded-md">{booking.subject}</span>
                     </td>
                     <td className="p-6 text-sm font-black text-red-400 text-right">- £{(Number(booking.price_at_booking) * platformFee).toFixed(2)}</td>
                     <td className="p-6 text-sm font-black text-green-600 text-right">+ £{(Number(booking.price_at_booking) * tutorCut).toFixed(2)}</td>
                  </tr>
               ))}
               {completedBookings.length === 0 && (
                  <tr>
                     <td colSpan={4} className="p-20 text-center">
                        <div className="flex flex-col items-center gap-4 text-secondary/20">
                           <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                           <p className="font-black uppercase tracking-widest text-xs">No completed earnings found in ledger.</p>
                        </div>
                     </td>
                  </tr>
               )}
            </tbody>
         </table>
      </div>
    </div>
  );
}
