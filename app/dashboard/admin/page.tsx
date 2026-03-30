import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import Image from "next/image";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const meta = user?.user_metadata;
  const userName = meta?.full_name || "Admin";
  const avatarUrl = meta?.avatar_url;

  // Fetch Live Stats
  // 1. Tutors Count
  const { count: activeTutors } = await supabase
    .from("tutors")
    .select("*", { count: 'exact', head: true })
    .eq("is_verified", true);

  // 2. Students Count
  const { count: totalStudents } = await supabase
    .from("profiles")
    .select("*", { count: 'exact', head: true })
    .in("role", ["parent", "student"]);

  // 3. Flagged Messages Count (Safety Alerts)
  const { count: flaggedCount } = await supabase
    .from("messages")
    .select("*", { count: 'exact', head: true })
    .eq("is_flagged", true);

  // 4. Platform Fee Configuration
  const { data: settings } = await supabase.from("platform_settings").select("platform_fee_percent").limit(1).single();
  const platformFeeRaw = settings?.platform_fee_percent ?? 25;
  const platformFee = platformFeeRaw / 100;

  // 4. Completed Bookings (for Revenue and Hours)
  const { data: completedBookings } = await supabase
    .from("bookings")
    .select("price_at_booking, duration_hours")
    .eq("status", "completed");

  let totalPlatformVolume = 0;
  let totalPlatformProfit = 0;
  let hoursTaught = 0;

  if (completedBookings) {
    completedBookings.forEach(b => {
      const price = Number(b.price_at_booking);
      totalPlatformVolume += price;
      totalPlatformProfit += (price * platformFee);
      hoursTaught += Number(b.duration_hours || 1);
    });
  }

  // 4. Recent Bookings (All statuses)
  // Hardened dual-strategy fetch: 
  // 1. Try Joined Fetch first
  let { data: recentBookings, error: bookingsError } = await supabase
    .from("bookings")
    .select('*, student:profiles!student_id(full_name), tutor:profiles!tutor_id(full_name)')
    .order('created_at', { ascending: false })
    .limit(5);

  // 2. FALLBACK: Manual profile fetch if the Join failed (PGRST200)
  if (bookingsError || !recentBookings) {
     console.log("🕵️ Falling back to manual profile fetch...");
     const { data: rawBookings } = await supabase
        .from("bookings")
        .select("*")
        .order('created_at', { ascending: false })
        .limit(5);

     if (rawBookings && rawBookings.length > 0) {
        // Fetch all involved profile names manually
        const profileIds = [...new Set([
           ...rawBookings.map(b => b.student_id),
           ...rawBookings.map(b => b.tutor_id)
        ])];

        const { data: manualProfiles } = await supabase
           .from("profiles")
           .select("id, full_name")
           .in("id", profileIds);

        const profileMap = Object.fromEntries(manualProfiles?.map(p => [p.id, p.full_name]) || []);

        recentBookings = rawBookings.map(b => ({
           ...b,
           student: { full_name: profileMap[b.student_id] || "Unknown Student" },
           tutor: { full_name: profileMap[b.tutor_id] || "Unknown Tutor" }
        }));
     }
  }

  // 5. Top Tutors
  const { data: topTutors } = await supabase
    .from("tutors")
    .select(`
      id,
      rating,
      subjects,
      profiles!id(full_name, avatar_url)
    `)
    .order('rating', { ascending: false })
    .limit(4);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-10 flex items-center gap-6">
         <div className="w-16 h-16 rounded-full bg-secondary/10 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
            {avatarUrl ? (
               <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
               <span className="text-2xl font-bold text-secondary">{userName.charAt(0)}</span>
            )}
         </div>
         <div>
            <h1 className="text-3xl font-black mb-1 bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
               Hello, {userName.split(' ')[0]}!
            </h1>
            <p className="text-secondary/70 text-sm font-medium tracking-tight">System overview and platform management.</p>
         </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
         <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 p-6 rounded-3xl shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/30 rounded-full blur-2xl -z-10 group-hover:scale-110 transition-transform"></div>
            <div className="text-indigo-200 text-sm font-bold uppercase tracking-wider mb-2">Platform Profit ({platformFeeRaw}%)</div>
            <div className="text-4xl font-black text-white">£{totalPlatformProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="text-indigo-300 text-xs font-bold mt-2">
               Gross Vol: £{totalPlatformVolume.toFixed(2)}
            </div>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-secondary/10 shadow-sm">
            <div className="text-secondary/50 text-sm font-bold uppercase tracking-wider mb-2">Hours Taught</div>
            <div className="text-4xl font-black text-secondary">{hoursTaught} <span className="text-2xl text-secondary/40 font-bold">hrs</span></div>
            <div className="text-secondary/40 text-xs font-bold mt-2">Based on completed sessions</div>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-secondary/10 shadow-sm">
            <div className="text-secondary/50 text-sm font-bold uppercase tracking-wider mb-2">Verified Tutors</div>
            <div className="text-4xl font-black text-secondary">{activeTutors || 0}</div>
            <div className="text-secondary/40 text-xs font-bold mt-2">Active on marketplace</div>
         </div>
          <Link href="/dashboard/admin/safeguards" className="bg-white p-6 rounded-3xl border border-secondary/10 shadow-sm hover:border-red-200 transition-colors group">
             <div className="text-secondary/50 text-sm font-bold uppercase tracking-wider mb-2 group-hover:text-red-500 transition-colors">Safety Alerts</div>
             <div className="text-4xl font-black text-secondary group-hover:text-red-600 transition-colors">{flaggedCount || 0}</div>
             <div className="text-secondary/40 text-xs font-bold mt-2">Flagged violations</div>
          </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
         <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-bold text-secondary">Recent Bookings (Live)</h2>
               <Link href="/dashboard/admin/bookings" className="text-sm font-bold text-primary hover:underline">View All Bookings</Link>
            </div>
            <div className="bg-white rounded-3xl border border-secondary/10 shadow-sm overflow-hidden min-h-[300px]">
               {recentBookings?.map((booking: any, i) => {
                  const studentName = booking.student?.full_name || "Unknown Student";
                  const tutorName = booking.tutor?.full_name || "Unknown Tutor";
                  return (
                     <div key={booking.id} className={`p-4 sm:p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${i !== (recentBookings?.length || 0) - 1 ? 'border-b border-secondary/5' : ''}`}>
                        <div className="flex items-center gap-4">
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                             booking.status === 'completed' ? 'bg-green-100 text-green-600' :
                             booking.status === 'confirmed' ? 'bg-blue-100 text-blue-600' :
                             'bg-amber-100 text-amber-600'
                           }`}>
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                           </div>
                           <div>
                              <p className="font-bold text-secondary sm:text-lg">
                                {studentName} <span className="text-secondary/50 font-normal">booked</span> {tutorName}
                              </p>
                              <div className="flex gap-2 items-center text-xs">
                                <span className="text-secondary/60">{new Date(booking.requested_date).toLocaleDateString()}</span>
                                <span className="uppercase font-black text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                  {booking.status}
                                </span>
                              </div>
                           </div>
                        </div>
                        <div className="font-black text-secondary sm:text-lg text-right">
                           £{booking.price_at_booking}
                        </div>
                     </div>
                  );
               })}
               {(!recentBookings || recentBookings.length === 0) && (
                 <div className="flex items-center justify-center p-12 text-secondary/40 font-bold">
                    No recent bookings.
                 </div>
               )}
            </div>
         </div>

         {/* Tutor Roster Teaser */}
         <div>
            <h2 className="text-xl font-bold text-secondary mb-4">Top Tutors</h2>
            <div className="bg-white rounded-3xl border border-secondary/10 shadow-sm p-4">
               <div className="space-y-3">
                  {topTutors?.map((tutor: any) => (
                     <div key={tutor.id} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-secondary/10 relative overflow-hidden">
                              <Image src={tutor.profiles?.avatar_url || "/tutor_placeholder.webp"} alt={tutor.profiles?.full_name || "Tutor"} fill className="object-cover" />
                           </div>
                           <div>
                              <p className="text-sm font-bold text-secondary">{tutor.profiles?.full_name || "Tutor"}</p>
                              <p className="text-[10px] uppercase font-black tracking-widest text-primary truncate max-w-[120px]">
                                {tutor.subjects?.[0] || "General"}
                              </p>
                           </div>
                        </div>
                        <div className="text-xs font-black text-amber-500 bg-amber-50 px-2 py-1 rounded-md">
                           ★ {tutor.rating > 0 ? tutor.rating : "New"}
                        </div>
                     </div>
                  ))}
               </div>
               <Link href="/dashboard/admin/payouts" className="block w-full mt-4 py-3 text-center bg-slate-50 text-secondary font-black tracking-widest uppercase text-[10px] rounded-xl hover:bg-slate-100 transition-colors border border-secondary/10">
                  Manage Payouts
               </Link>
            </div>
         </div>
      </div>
    </div>
  );
}
