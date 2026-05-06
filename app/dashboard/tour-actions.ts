"use server";

import { createClient } from "@/utils/supabase/server";
import type { DashboardTourRole } from "@/src/tours/types";

export async function markDashboardTourCompleted(role: DashboardTourRole) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const currentTours = user.user_metadata?.dashboardToursCompleted || {};

  const { error } = await supabase.auth.updateUser({
    data: {
      ...user.user_metadata,
      dashboardToursCompleted: {
        ...currentTours,
        [role]: true,
      },
    },
  });

  if (error) {
    console.error("Dashboard tour completion error:", error.message);
    return { error: error.message };
  }

  return { success: true };
}
