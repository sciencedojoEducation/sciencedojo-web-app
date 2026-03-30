"use server"

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleTutorVerification(tutorId: string, currentStatus: boolean) {
  const supabase = await createClient();
  
  // Verify Admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Unauthorized" };

  // Use upsert to handle cases where the tutors record might be missing
  const { error } = await supabase
    .from("tutors")
    .upsert({ 
      id: tutorId, 
      is_verified: !currentStatus,
      hourly_rate: 30, // Default if not existing
      subjects: ['General'], // Default if not existing
      rating: 0
    }, { onConflict: 'id' });

  if (error) {
    console.error("🚨 Admin Verification Error for Tutor", tutorId, ":", error.message);
    return { error: error.message };
  }

  console.log("✅ Tutor", tutorId, "verification toggled to:", !currentStatus);
  revalidatePath("/dashboard/admin/tutors");
  revalidatePath("/"); // Update the public directory
  revalidatePath(`/tutor/${tutorId}`);
  return { success: true };
}
