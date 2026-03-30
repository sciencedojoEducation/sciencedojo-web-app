"use server"

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updatePlatformFeePercentage(formData: FormData) {
  const newFeeStr = formData.get("feePercent") as string;
  const newFee = Math.round(Number(newFeeStr));

  if (isNaN(newFee) || newFee < 0 || newFee > 100) {
    return { error: "Platform fee must be between 0 and 100." };
  }

  const supabase = await createClient();

  // Verify Admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Unauthorized" };

  // Fetch the only row
  const { data: settingsRow } = await supabase
    .from("platform_settings")
    .select("id")
    .limit(1)
    .single();

  if (!settingsRow) {
    return { error: "Settings row not initialized in database." };
  }

  // Update
  const { error } = await supabase
    .from("platform_settings")
    .update({ platform_fee_percent: newFee, updated_at: new Date().toISOString() })
    .eq("id", settingsRow.id);

  if (error) {
    console.error("Update fee error:", error.message);
    return { error: error.message };
  }

  // Revalidate ALL paths that might show financial math
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/settings");
  revalidatePath("/dashboard/admin/payouts");
  revalidatePath("/dashboard/tutor/earnings");
  
  return { success: true };
}
