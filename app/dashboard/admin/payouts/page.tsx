import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import PayoutButton from "./PayoutButton";
import PayAllButton from "./PayAllButton";

export default async function AdminPayoutsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard/parent");

  // 1. Fetch live platform fee
  const { data: settings } = await supabase.from("platform_settings").select("platform_fee_percent").limit(1).single();
  const platformFeeRaw = settings?.platform_fee_percent ?? 25;
  const platformFee = platformFeeRaw / 100;
  const tutorCutRaw = 100 - platformFeeRaw;
  const tutorCut = 1 - platformFee;

  // 2. Fetch all completed bookings
  const { data: completedBookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("id, price_at_booking, tutor_id")
    .eq("status", "completed");

  if (bookingsError) console.error("[Payouts] bookings query error:", bookingsError.message);

  const tutorIds = [...new Set((completedBookings || []).map(b => b.tutor_id))];
  const { data: tutorProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", tutorIds);

  const tutorProfileMap: Record<string, { full_name: string; email: string }> = {};
  for (const t of tutorProfiles || []) {
    tutorProfileMap[t.id] = { full_name: t.full_name, email: t.email };
  }

  // 3. Fetch already-paid payout amounts per tutor
  const { data: existingPayouts, error: payoutsError } = await supabase
    .from("payouts")
    .select("tutor_id, amount, status");

  if (payoutsError) console.error("[Payouts] payouts table error:", payoutsError.message);

  const paidByTutor: Record<string, number> = {};
  for (const p of existingPayouts || []) {
    if (p.status === "paid") {
      paidByTutor[p.tutor_id] = (paidByTutor[p.tutor_id] || 0) + Number(p.amount);
    }
  }

  // 4. Fetch tutor Stripe status
  const { data: tutorStripeData, error: tutorError } = await supabase
    .from("tutors")
    .select("id, stripe_account_id, stripe_onboarding_complete");

  if (tutorError) console.error("[Payouts] tutors query error:", tutorError.message);
  const tutorStripeMap: Record<string, { accountId: string | null; onboarded: boolean }> = {};
  for (const t of tutorStripeData || []) {
    tutorStripeMap[t.id] = { accountId: t.stripe_account_id, onboarded: t.stripe_onboarding_complete };
  }


  // 5. Aggregate per tutor
  const tutorLedgers: Record<string, {
    id: string;
    name: string;
    email: string;
    totalRevenue: number;
    platformFee: number;
    grossPayout: number;
    alreadyPaid: number;
    outstandingOwed: number;
    sessionCount: number;
    stripeReady: boolean;
  }> = {};

  let totalPlatformRevenue = 0;
  let totalTutorPayouts = 0;

  for (const b of completedBookings || []) {
    const bid = (b as any).tutor_id;
    const price = Number((b as any).price_at_booking);
    const pFee = price * platformFee;
    const tPayout = price * tutorCut;
    totalPlatformRevenue += pFee;
    totalTutorPayouts += tPayout;

    if (!tutorLedgers[bid]) {
      tutorLedgers[bid] = {
        id: bid,
        name: tutorProfileMap[bid]?.full_name || "Unknown Tutor",
        email: tutorProfileMap[bid]?.email || "No Email",
        totalRevenue: 0, platformFee: 0, grossPayout: 0,
        alreadyPaid: 0, outstandingOwed: 0, sessionCount: 0,
        stripeReady: tutorStripeMap[bid]?.onboarded ?? false,
      };
    }
    tutorLedgers[bid].totalRevenue += price;
    tutorLedgers[bid].platformFee += pFee;
    tutorLedgers[bid].grossPayout += tPayout;
    tutorLedgers[bid].sessionCount += 1;
  }

  // Calculate outstanding after subtracting already-paid amounts
  for (const tid of Object.keys(tutorLedgers)) {
    tutorLedgers[tid].alreadyPaid = paidByTutor[tid] || 0;
    tutorLedgers[tid].outstandingOwed = Math.max(0, tutorLedgers[tid].grossPayout - tutorLedgers[tid].alreadyPaid);
  }

  const ledgersArray = Object.values(tutorLedgers).sort((a, b) => b.outstandingOwed - a.outstandingOwed);

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Tutor Payouts</h1>
          <p className="text-slate-500 font-medium">Monthly payouts — triggered manually at the end of each month.</p>
          <p className="text-xs text-slate-400 font-bold mt-1">Platform commission: <span className="text-indigo-600">{platformFeeRaw}%</span> · Tutors receive: <span className="text-green-600">{tutorCutRaw}%</span></p>
        </div>
        <PayAllButton
          tutorLedgers={ledgersArray.map(l => ({ id: l.id, name: l.name, outstandingOwed: l.outstandingOwed, stripeReady: l.stripeReady }))}
          totalOutstanding={ledgersArray.reduce((s, l) => s + l.outstandingOwed, 0)}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-slate-800 p-8 rounded-[2rem] text-white shadow-xl">
          <h2 className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] mb-3">Total Gross Owed</h2>
          <div className="text-4xl font-black tracking-tighter">£{totalTutorPayouts.toFixed(2)}</div>
          <p className="text-slate-500 text-xs mt-2">All sessions × {tutorCutRaw}%</p>
        </div>
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2rem] text-white shadow-xl">
          <h2 className="text-blue-200 font-black uppercase tracking-[0.2em] text-[10px] mb-3">ScienceDojo Revenue</h2>
          <div className="text-4xl font-black tracking-tighter">£{totalPlatformRevenue.toFixed(2)}</div>
          <p className="text-blue-300 text-xs mt-2">{platformFeeRaw}% platform fee retained</p>
        </div>
        <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-8 rounded-[2rem] text-white shadow-xl">
          <h2 className="text-green-200 font-black uppercase tracking-[0.2em] text-[10px] mb-3">Outstanding Owed</h2>
          <div className="text-4xl font-black tracking-tighter">
            £{ledgersArray.reduce((s, l) => s + l.outstandingOwed, 0).toFixed(2)}
          </div>
          <p className="text-green-300 text-xs mt-2">Unpaid tutor balances</p>
        </div>
      </div>

      {/* Tutor Ledger */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="font-bold text-slate-800">Tutor Ledger</h2>
          <span className="text-xs text-slate-400 font-bold">{ledgersArray.length} tutors with completed sessions</span>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <th className="p-5">Tutor</th>
              <th className="p-5 text-center">Sessions</th>
              <th className="p-5 text-right">Gross (75%)</th>
              <th className="p-5 text-right text-green-600">Paid Out</th>
              <th className="p-5 text-right text-amber-600">Outstanding</th>
              <th className="p-5 text-center">Stripe</th>
              <th className="p-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="font-medium divide-y divide-slate-100">
            {ledgersArray.map((ledger) => (
              <tr key={ledger.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-5 text-sm text-slate-800">
                  <div className="font-bold">{ledger.name}</div>
                  <div className="text-xs text-slate-400">{ledger.email}</div>
                </td>
                <td className="p-5 text-sm text-slate-500 text-center font-bold">
                  {ledger.sessionCount}
                </td>
                <td className="p-5 text-sm text-slate-500 text-right font-bold">
                  £{ledger.grossPayout.toFixed(2)}
                </td>
                <td className="p-5 text-sm font-black text-green-600 text-right">
                  £{ledger.alreadyPaid.toFixed(2)}
                </td>
                <td className="p-5 text-sm font-black text-amber-600 text-right">
                  £{ledger.outstandingOwed.toFixed(2)}
                </td>
                <td className="p-5 text-center">
                  {ledger.stripeReady ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>Ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                      Not Connected
                    </span>
                  )}
                </td>
                <td className="p-5 text-right">
                  <PayoutButton
                    tutorId={ledger.id}
                    tutorName={ledger.name}
                    amountOwed={ledger.outstandingOwed}
                    stripeReady={ledger.stripeReady}
                  />
                </td>
              </tr>
            ))}
            {ledgersArray.length === 0 && (
              <tr>
                <td colSpan={7} className="p-12 text-center text-slate-400 font-bold">
                  No completed bookings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
