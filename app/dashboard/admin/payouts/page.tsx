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
  const totalOutstanding = ledgersArray.reduce((s, l) => s + l.outstandingOwed, 0);

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-3 py-5 sm:px-4 md:p-8">
      <div className="mb-5 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Financial operations</p>
          <h1 className="mb-2 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Tutor Payouts</h1>
          <p className="max-w-2xl text-sm font-medium leading-relaxed text-slate-500 md:text-base">
            Monthly tutor balances, platform commission, and payout readiness in one operational view.
          </p>
          <p className="mt-2 text-xs font-bold text-slate-400">
            Platform commission: <span className="text-indigo-600">{platformFeeRaw}%</span> · Tutors receive: <span className="text-green-600">{tutorCutRaw}%</span>
          </p>
        </div>
        <PayAllButton
          tutorLedgers={ledgersArray.map(l => ({ id: l.id, name: l.name, outstandingOwed: l.outstandingOwed, stripeReady: l.stripeReady }))}
          totalOutstanding={totalOutstanding}
        />
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:mb-10 md:grid-cols-3 md:gap-6">
        <div className="col-span-2 rounded-[1.5rem] bg-slate-900 p-4 text-white shadow-sm md:col-span-1 md:rounded-[2rem] md:p-8 md:shadow-xl">
          <h2 className="mb-2 text-[9px] font-black uppercase tracking-[0.16em] text-slate-400 md:mb-3 md:text-[10px] md:tracking-[0.2em]">Total Gross Owed</h2>
          <div className="text-3xl font-black tracking-tighter md:text-4xl">£{totalTutorPayouts.toFixed(2)}</div>
          <p className="mt-1 text-[11px] font-medium text-slate-400 md:mt-2 md:text-xs">All completed sessions × {tutorCutRaw}%</p>
        </div>
        <div className="rounded-[1.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 p-4 text-white shadow-sm md:rounded-[2rem] md:p-8 md:shadow-xl">
          <h2 className="mb-2 text-[9px] font-black uppercase tracking-[0.16em] text-blue-200 md:mb-3 md:text-[10px] md:tracking-[0.2em]">ScienceDojo Revenue</h2>
          <div className="text-2xl font-black tracking-tighter md:text-4xl">£{totalPlatformRevenue.toFixed(2)}</div>
          <p className="mt-1 text-[11px] font-medium text-blue-200/90 md:mt-2 md:text-xs">{platformFeeRaw}% retained</p>
        </div>
        <div className="rounded-[1.5rem] bg-gradient-to-br from-green-600 to-emerald-700 p-4 text-white shadow-sm md:rounded-[2rem] md:p-8 md:shadow-xl">
          <h2 className="mb-2 text-[9px] font-black uppercase tracking-[0.16em] text-green-200 md:mb-3 md:text-[10px] md:tracking-[0.2em]">Outstanding Owed</h2>
          <div className="text-2xl font-black tracking-tighter md:text-4xl">
            £{totalOutstanding.toFixed(2)}
          </div>
          <p className="mt-1 text-[11px] font-medium text-green-200/90 md:mt-2 md:text-xs">Ready to manage</p>
        </div>
      </div>

      {/* Tutor Ledger */}
      <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm md:rounded-[2rem]">
        <div className="border-b border-slate-100 bg-slate-50 p-4 md:flex md:items-center md:justify-between md:p-6">
          <div>
            <h2 className="font-bold text-slate-900">Tutor ledger</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">Balances by tutor, with Stripe readiness and payout action.</p>
          </div>
          <span className="mt-2 inline-flex text-xs font-bold text-slate-400 md:mt-0">{ledgersArray.length} tutors with completed sessions</span>
        </div>

        <div className="grid gap-3 p-3 lg:hidden">
          {ledgersArray.map((ledger) => (
            <article key={ledger.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-words text-sm font-black leading-tight text-slate-900">{ledger.name}</h3>
                  <p className="mt-1 break-words text-xs font-medium text-slate-400">{ledger.email}</p>
                </div>
                {ledger.stripeReady ? (
                  <span className="shrink-0 rounded-full border border-green-100 bg-green-50 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-green-600">
                    Ready
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    No Stripe
                  </span>
                )}
              </div>

              <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/70 p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-600">Outstanding</p>
                <div className="mt-1 text-2xl font-black tracking-tight text-amber-700">£{ledger.outstandingOwed.toFixed(2)}</div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl bg-slate-50 p-2">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Sessions</p>
                  <p className="mt-1 text-sm font-black text-slate-800">{ledger.sessionCount}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-2">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Gross</p>
                  <p className="mt-1 text-sm font-black text-slate-800">£{ledger.grossPayout.toFixed(2)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-2">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Paid</p>
                  <p className="mt-1 text-sm font-black text-green-600">£{ledger.alreadyPaid.toFixed(2)}</p>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <PayoutButton
                  tutorId={ledger.id}
                  tutorName={ledger.name}
                  amountOwed={ledger.outstandingOwed}
                  stripeReady={ledger.stripeReady}
                />
              </div>
            </article>
          ))}
          {ledgersArray.length === 0 && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-center">
              <h3 className="text-sm font-black text-slate-800">No payout records yet</h3>
              <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">Completed tutoring sessions will appear here once there are balances to review.</p>
            </div>
          )}
        </div>

        <table className="hidden w-full border-collapse text-left lg:table">
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
