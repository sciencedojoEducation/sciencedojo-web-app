import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminPayoutsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Double check admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard/parent");
  }

  // 1. Fetch live platform fee
  const { data: settings } = await supabase.from("platform_settings").select("platform_fee_percent").limit(1).single();
  const platformFeeRaw = settings?.platform_fee_percent ?? 25;
  const platformFee = platformFeeRaw / 100;
  const tutorCutRaw = 100 - platformFeeRaw;
  const tutorCut = 1 - platformFee;

  // 2. Fetch all completed bookings
  const { data: completedBookings } = await supabase
    .from("bookings")
    .select(`
      id,
      price_at_booking,
      tutor_id,
      profiles!bookings_tutor_id_fkey(full_name, email)
    `)
    .eq("status", "completed");

  // 3. Aggregate data by tutor
  const tutorLedgers: Record<string, {
    name: string;
    email: string;
    totalRevenue: number;
    platformFee: number;
    netPayout: number;
    sessionCount: number;
  }> = {};

  let totalPlatformRevenue = 0;
  let totalTutorPayouts = 0;

  if (completedBookings) {
    completedBookings.forEach((b: any) => {
      const tutorId = b.tutor_id;
      const price = Number(b.price_at_booking);
      
      const pFee = price * platformFee;
      const tPayout = price * tutorCut;

      totalPlatformRevenue += pFee;
      totalTutorPayouts += tPayout;

      if (!tutorLedgers[tutorId]) {
        tutorLedgers[tutorId] = {
          name: b.profiles?.full_name || "Unknown Tutor",
          email: b.profiles?.email || "No Email",
          totalRevenue: 0,
          platformFee: 0,
          netPayout: 0,
          sessionCount: 0
        };
      }

      tutorLedgers[tutorId].totalRevenue += price;
      tutorLedgers[tutorId].platformFee += pFee;
      tutorLedgers[tutorId].netPayout += tPayout;
      tutorLedgers[tutorId].sessionCount += 1;
    });
  }

  const ledgersArray = Object.values(tutorLedgers).sort((a, b) => b.totalRevenue - a.totalRevenue);

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen">
      <div className="mb-10 flex items-end justify-between">
         <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Tutor Payouts</h1>
            <p className="text-slate-500 font-medium">Manage and track your platform's financial obligations to tutors.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
         <div className="bg-slate-800 p-10 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
            <h2 className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] mb-4">Total Owed to Tutors ({tutorCutRaw}%)</h2>
            <div className="text-6xl font-black mb-2 tracking-tighter">£{totalTutorPayouts.toFixed(2)}</div>
            <p className="text-slate-400 text-xs font-bold flex items-center gap-2">
               Includes all completed sessions.
            </p>
         </div>

         <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-10 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <h2 className="text-blue-200 font-black uppercase tracking-[0.2em] text-[10px] mb-4">ScienceDojo Revenue ({platformFeeRaw}%)</h2>
            <div className="text-5xl font-black mb-2 tracking-tighter">£{totalPlatformRevenue.toFixed(2)}</div>
            <p className="text-blue-200 text-xs font-bold mt-6 italic">Total Platform Profit Retained</p>
         </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
         <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
           <h2 className="font-bold text-slate-800">Tutor Ledger</h2>
           <button className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700">Export CSV</button>
         </div>
         <table className="w-full text-left border-collapse">
            <thead>
               <tr className="border-b border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                  <th className="p-6">Tutor</th>
                  <th className="p-6 text-center">Sessions Taught</th>
                  <th className="p-6 text-right">Gross Volume</th>
                  <th className="p-6 text-right text-indigo-500">Platform Cut ({platformFeeRaw}%)</th>
                  <th className="p-6 text-right text-green-600">Net Owed ({tutorCutRaw}%)</th>
               </tr>
            </thead>
            <tbody className="font-medium">
               {ledgersArray.map((ledger, i) => (
                  <tr key={ledger.email} className={`hover:bg-slate-50 transition-colors ${i !== ledgersArray.length - 1 ? 'border-b border-slate-100' : ''}`}>
                     <td className="p-6 text-sm text-slate-800">
                        <div className="font-bold">{ledger.name}</div>
                        <div className="text-xs text-slate-400">{ledger.email}</div>
                     </td>
                     <td className="p-6 text-sm text-slate-500 text-center font-bold">
                        {ledger.sessionCount}
                     </td>
                     <td className="p-6 text-sm text-slate-500 text-right">
                        £{ledger.totalRevenue.toFixed(2)}
                     </td>
                     <td className="p-6 text-sm font-black text-indigo-500 text-right">
                        £{ledger.platformFee.toFixed(2)}
                     </td>
                     <td className="p-6 text-sm font-black text-green-600 text-right">
                        £{ledger.netPayout.toFixed(2)}
                     </td>
                  </tr>
               ))}
               
               {ledgersArray.length === 0 && (
                 <tr>
                   <td colSpan={5} className="p-12 text-center text-slate-400 font-bold">No completed bookings found.</td>
                 </tr>
               )}
            </tbody>
         </table>
      </div>
    </div>
  );
}
