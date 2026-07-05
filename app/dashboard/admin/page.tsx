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
    .eq("is_publicly_listed", true);

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

  const { count: activeTeamMembers } = await supabase
    .from("internal_team_members")
    .select("*", { count: 'exact', head: true })
    .eq("status", "active");

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

  const operationalMetrics = [
    {
      label: `Platform profit (${platformFeeRaw}%)`,
      value: `£${totalPlatformProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      detail: `Gross volume £${totalPlatformVolume.toFixed(2)}`,
      tone: "border-secondary/20 bg-gradient-to-br from-secondary to-primary",
      labelTone: "text-white/72",
      valueTone: "text-white",
      detailTone: "text-white/58",
    },
    {
      label: "Tutoring hours",
      value: `${hoursTaught}`,
      detail: "Completed session hours",
      tone: "border-sky-100 bg-sky-50/85 hover:border-sky-200",
      labelTone: "text-sky-700/70",
      valueTone: "text-sky-900",
      detailTone: "text-sky-700/55",
    },
    {
      label: "Verified tutors",
      value: `${activeTutors || 0}`,
      detail: "Approved educators",
      tone: "border-cyan-100 bg-cyan-50/85 hover:border-cyan-200",
      labelTone: "text-cyan-700/70",
      valueTone: "text-cyan-900",
      detailTone: "text-cyan-700/55",
    },
    {
      label: "Safety alerts",
      value: `${flaggedCount || 0}`,
      detail: flaggedCount && flaggedCount > 0 ? "Needs review" : "No active flags",
      href: "/dashboard/admin/safeguards",
      attention: !!flaggedCount && flaggedCount > 0,
      tone: flaggedCount && flaggedCount > 0 ? "border-red-200 bg-red-50/80 hover:border-red-300" : "border-emerald-100 bg-emerald-50/80 hover:border-emerald-200",
      labelTone: flaggedCount && flaggedCount > 0 ? "text-red-500" : "text-emerald-700/70",
      valueTone: flaggedCount && flaggedCount > 0 ? "text-red-600" : "text-emerald-800",
      detailTone: flaggedCount && flaggedCount > 0 ? "text-red-500/65" : "text-emerald-700/55",
    },
  ];

  const attentionLinks = [
    {
      label: flaggedCount && flaggedCount > 0 ? `${flaggedCount} safeguard alert${flaggedCount === 1 ? "" : "s"}` : "Safeguards clear",
      detail: flaggedCount && flaggedCount > 0 ? "Review flagged messages" : "Monitor student safety",
      href: "/dashboard/admin/safeguards",
      attention: !!flaggedCount && flaggedCount > 0,
      tone: flaggedCount && flaggedCount > 0 ? "border-red-200 bg-red-50/80 hover:border-red-300" : "border-emerald-100 bg-emerald-50/85 hover:border-emerald-200",
      labelTone: flaggedCount && flaggedCount > 0 ? "text-red-600" : "text-emerald-800",
      detailTone: flaggedCount && flaggedCount > 0 ? "text-red-500/65" : "text-emerald-700/55",
    },
    {
      label: "Assessment leads",
      detail: "Review parent intake",
      href: "/dashboard/admin/leads",
      tone: "border-sky-100 bg-sky-50/85 hover:border-sky-200",
      labelTone: "text-sky-800",
      detailTone: "text-sky-700/55",
    },
    {
      label: "Tutor review",
      detail: "Verify experts and applications",
      href: "/dashboard/admin/tutors",
      tone: "border-indigo-100 bg-indigo-50/85 hover:border-indigo-200",
      labelTone: "text-indigo-800",
      detailTone: "text-indigo-700/55",
    },
    {
      label: "Payouts",
      detail: "Check tutor balances",
      href: "/dashboard/admin/payouts",
      tone: "border-cyan-100 bg-cyan-50/85 hover:border-cyan-200",
      labelTone: "text-cyan-800",
      detailTone: "text-cyan-700/55",
    },
    {
      label: "Internal team",
      detail: `${activeTeamMembers || 0} active collaborator${activeTeamMembers === 1 ? "" : "s"}`,
      href: "/dashboard/admin/team",
      tone: "border-slate-200 bg-slate-50/90 hover:border-slate-300",
      labelTone: "text-slate-800",
      detailTone: "text-slate-500",
    },
  ];

  return (
    <div className="px-3 py-5 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6 md:space-y-8">
      <div className="flex items-center gap-4 md:gap-5">
         <div className="w-11 h-11 rounded-2xl bg-secondary/10 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center md:h-14 md:w-14">
            {avatarUrl ? (
               <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
               <span className="text-lg font-bold text-secondary md:text-xl">{userName.charAt(0)}</span>
            )}
         </div>
         <div>
            <h1 className="text-2xl font-black mb-1 bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent md:text-3xl">
               Hello, {userName.split(' ')[0]}!
            </h1>
            <p className="text-secondary/60 text-sm font-medium tracking-tight">Educational operations, tutor support, and platform health.</p>
         </div>
      </div>

      <section className="rounded-[1.5rem] border border-secondary/10 bg-white p-4 shadow-sm md:rounded-[2rem] md:p-5">
        <div className="mb-4 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-secondary/35">Operational snapshot</p>
            <h2 className="mt-1 text-xl font-black text-secondary">Platform health</h2>
          </div>
          <p className="text-xs font-bold text-secondary/45">{totalStudents || 0} family/student accounts tracked</p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {operationalMetrics.map((metric) => {
            const content = (
              <div className={`h-full rounded-2xl border p-4 transition-colors ${metric.tone}`}>
                <p className={`text-[10px] font-black uppercase tracking-[0.1em] ${metric.labelTone}`}>
                  {metric.label}
                </p>
                <p className={`mt-2 text-2xl font-black md:text-3xl ${metric.valueTone}`}>
                  {metric.value}
                </p>
                <p className={`mt-1 text-xs font-bold leading-5 ${metric.detailTone}`}>{metric.detail}</p>
              </div>
            );

            return metric.href ? (
              <Link key={metric.label} href={metric.href} className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                {content}
              </Link>
            ) : (
              <div key={metric.label}>{content}</div>
            );
          })}
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-primary/10 bg-gradient-to-br from-white via-[#fbfdff] to-[#f4f9ff] p-4 shadow-sm md:rounded-[2rem] md:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-secondary/35">Needs attention</p>
            <h2 className="mt-1 text-lg font-black text-secondary">Operational next checks</h2>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {attentionLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-2xl border px-4 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${item.tone}`}
            >
              <p className={`text-sm font-black ${item.labelTone}`}>{item.label}</p>
              <p className={`mt-1 text-xs font-bold ${item.detailTone}`}>{item.detail}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
         <div className="lg:col-span-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-end mb-3">
               <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-secondary/35">Learning movement</p>
                  <h2 className="mt-1 text-xl font-black text-secondary">Recent learning activity</h2>
               </div>
               <Link href="/dashboard/admin/bookings" className="text-xs font-black uppercase tracking-[0.12em] text-primary hover:underline">View bookings</Link>
            </div>
            <div className="bg-white rounded-[1.5rem] border border-secondary/10 shadow-sm overflow-hidden min-h-[180px] md:rounded-[2rem]">
               {recentBookings?.map((booking: any, i) => {
                  const studentName = booking.student?.full_name || "Unknown Student";
                  const tutorName = booking.tutor?.full_name || "Unknown Tutor";
                  return (
                     <div key={booking.id} className={`p-4 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center ${i !== (recentBookings?.length || 0) - 1 ? 'border-b border-secondary/5' : ''}`}>
                        <div className="flex min-w-0 items-center gap-3">
                           <div className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center ${
                             booking.status === 'completed' ? 'bg-green-50 text-green-600' :
                             booking.status === 'confirmed' ? 'bg-blue-50 text-blue-600' :
                             'bg-amber-50 text-amber-600'
                           }`}>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                           </div>
                           <div className="min-w-0">
                              <p className="truncate text-sm font-black text-secondary">
                                {studentName} <span className="text-secondary/45 font-semibold">with</span> {tutorName}
                              </p>
                              <div className="mt-1 flex flex-wrap gap-2 items-center text-xs">
                                <span className="font-bold text-secondary/45">{new Date(booking.requested_date).toLocaleDateString()}</span>
                                <span className="uppercase font-black text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                  {booking.status}
                                </span>
                              </div>
                           </div>
                        </div>
                        <div className="text-sm font-black text-secondary/60 sm:text-right">
                           £{booking.price_at_booking}
                        </div>
                     </div>
                  );
               })}
               {(!recentBookings || recentBookings.length === 0) && (
                 <div className="flex min-h-[180px] items-center justify-center p-8 text-center text-sm font-bold text-secondary/40">
                    No recent learning activity yet.
                 </div>
               )}
            </div>
         </div>

         <div>
            <div className="mb-3">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-secondary/35">Educator operations</p>
              <h2 className="mt-1 text-xl font-black text-secondary">Tutor support snapshot</h2>
            </div>
            <div className="bg-white rounded-[1.5rem] border border-secondary/10 shadow-sm p-3 md:rounded-[2rem] md:p-4">
               <div className="space-y-2">
                  {topTutors?.map((tutor: any) => (
                     <div key={tutor.id} className="flex justify-between items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-slate-50">
                        <div className="flex min-w-0 items-center gap-3">
                           <div className="w-9 h-9 shrink-0 rounded-xl bg-secondary/10 relative overflow-hidden">
                              <Image src={tutor.profiles?.avatar_url || "/tutor_placeholder.webp"} alt={tutor.profiles?.full_name || "Tutor"} fill className="object-cover" />
                           </div>
                           <div className="min-w-0">
                              <p className="truncate text-sm font-black text-secondary">{tutor.profiles?.full_name || "Tutor"}</p>
                              <p className="truncate text-[10px] uppercase font-black tracking-[0.1em] text-secondary/38">
                                {tutor.subjects?.[0] || "General support"}
                              </p>
                           </div>
                        </div>
                        <div className="shrink-0 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-black text-amber-600">
                           {tutor.rating > 0 ? `★ ${tutor.rating}` : "New"}
                        </div>
                     </div>
                  ))}
               </div>
               <Link href="/dashboard/admin/payouts" className="mt-4 flex w-full items-center justify-center rounded-2xl border border-secondary/10 bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-secondary/60 transition-colors hover:bg-slate-100 hover:text-secondary">
                  Manage payouts
               </Link>
            </div>
         </div>
      </div>
    </div>
  );
}
