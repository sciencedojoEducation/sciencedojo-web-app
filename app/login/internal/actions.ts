"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getActiveInternalMemberByUserId, repairLinkedInternalUserRole } from "@/lib/internal-auth";

export async function internalLogin(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  const { data: { user }, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !user) {
    redirect(`/login/internal?error=${encodeURIComponent(error?.message || "Authentication failed.")}`);
  }

  const teamMember = await getActiveInternalMemberByUserId(supabase, user.id);

  if (!teamMember) {
    await supabase.auth.signOut();
    redirect(`/login/internal?error=${encodeURIComponent("Internal access is inactive or not linked to this account.")}`);
  }

  try {
    await repairLinkedInternalUserRole(user.id);
  } catch (repairError) {
    console.error("[internal-login] Internal role repair failed:", repairError);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard/internal");
}
