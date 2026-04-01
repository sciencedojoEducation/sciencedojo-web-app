"use server";

import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy", {
  apiVersion: "2024-12-18.acacia" as any,
});

/**
 * Triggers a Stripe Transfer from the platform account to a tutor's connected account.
 * Records the payout in the `payouts` table.
 */
export async function triggerTutorPayout(tutorId: string, amountGBP: number) {
  const supabase = await createClient();

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Admin access required" };

  // Fetch tutor's Stripe account
  const { data: tutor } = await supabase
    .from("tutors")
    .select("stripe_account_id, stripe_onboarding_complete")
    .eq("id", tutorId)
    .maybeSingle();

  if (!tutor?.stripe_account_id) {
    return { error: "Tutor has not connected a Stripe account yet." };
  }
  if (!tutor?.stripe_onboarding_complete) {
    return { error: "Tutor's Stripe onboarding is not yet complete." };
  }

  const amountInPence = Math.round(amountGBP * 100);
  if (amountInPence <= 0) {
    return { error: "Payout amount must be greater than £0." };
  }

  // Create a record first (pending)
  const { data: payoutRecord, error: insertError } = await supabase
    .from("payouts")
    .insert({
      tutor_id: tutorId,
      amount: amountGBP,
      currency: "gbp",
      status: "pending",
    })
    .select()
    .single();

  if (insertError) {
    console.error("[Payout] Failed to insert payout record:", insertError.message);
    return { error: "Failed to create payout record." };
  }

  try {
    // Execute Stripe Transfer
    const transfer = await stripe.transfers.create({
      amount: amountInPence,
      currency: "gbp",
      destination: tutor.stripe_account_id,
      metadata: {
        tutor_id: tutorId,
        payout_record_id: payoutRecord.id,
      },
    });

    console.log(`[Payout] Transfer ${transfer.id} created for tutor ${tutorId}: £${amountGBP}`);

    // Update record to paid
    await supabase
      .from("payouts")
      .update({
        status: "paid",
        stripe_transfer_id: transfer.id,
        paid_at: new Date().toISOString(),
      })
      .eq("id", payoutRecord.id);

    revalidatePath("/dashboard/admin/payouts");
    return { success: true, transferId: transfer.id };
  } catch (err: any) {
    console.error("[Payout] Stripe Transfer failed:", err.message);

    // Mark record as failed
    await supabase.from("payouts").update({ status: "failed" }).eq("id", payoutRecord.id);

    return { error: err.message || "Stripe transfer failed." };
  }
}

/**
 * Triggers monthly payouts for ALL tutors with outstanding balances.
 * Loops through every tutor, calculates their unpaid 75% cut, and sends a Stripe Transfer.
 */
export async function triggerAllTutorPayouts(
  tutorLedgers: Array<{ id: string; name: string; outstandingOwed: number; stripeReady: boolean }>
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Admin access required" };

  const results = { paid: 0, skipped: 0, failed: 0, errors: [] as string[] };

  for (const ledger of tutorLedgers) {
    if (!ledger.stripeReady || ledger.outstandingOwed <= 0) {
      results.skipped++;
      continue;
    }

    const res = await triggerTutorPayout(ledger.id, ledger.outstandingOwed);
    if (res.success) {
      results.paid++;
      console.log(`[Pay All] ✓ Paid ${ledger.name}: £${ledger.outstandingOwed.toFixed(2)}`);
    } else {
      results.failed++;
      results.errors.push(`${ledger.name}: ${res.error}`);
      console.error(`[Pay All] ✗ Failed ${ledger.name}: ${res.error}`);
    }
  }

  revalidatePath("/dashboard/admin/payouts");
  return { success: true, ...results };
}

