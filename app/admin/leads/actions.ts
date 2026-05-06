"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/utils/supabase/server";

const allowedStatuses = ["new", "contacted", "booked", "converted", "closed"] as const;

export type LeadStatusState = {
  error?: string;
  success?: boolean;
};

export async function updateLeadStatus(
  _previousState: LeadStatusState,
  formData: FormData,
): Promise<LeadStatusState> {
  const leadId = String(formData.get("leadId") || "");
  const status = String(formData.get("status") || "");

  if (!leadId || !allowedStatuses.includes(status as any)) {
    return { error: "Invalid lead status update." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please log in again." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Admin access required." };
  }

  const adminClient = await createAdminClient();
  const { error } = await adminClient
    .from("assessment_leads")
    .update({ status })
    .eq("id", leadId);

  if (error) {
    console.error("Lead status update error:", error.message);
    return { error: "Could not update lead status." };
  }

  revalidatePath("/admin/leads");
  revalidatePath("/admin/overview");
  revalidatePath("/dashboard/admin/leads");
  revalidatePath("/dashboard/admin/overview");
  return { success: true };
}
