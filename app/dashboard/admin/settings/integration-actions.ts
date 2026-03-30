"use server"

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateIntegrationKeys(
  provider: 'stripe' | 'zoom' | 'google_calendar', 
  data: { key_1?: string; key_2?: string; key_3?: string; is_active: boolean }
) {
  const supabase = await createClient();

  // Verify Admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Unauthorized" };

  const { error } = await supabase
    .from("platform_integrations")
    .upsert({
      provider: provider,
      ...data,
      updated_at: new Date().toISOString()
    }, { onConflict: 'provider' });

  if (error) {
    console.error(`Update ${provider} integration error:`, error.message);
    return { error: error.message };
  }

  revalidatePath("/dashboard/admin/settings");
  
  return { success: true };
}
