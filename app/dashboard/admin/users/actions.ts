"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  deactivateUserAccount,
  permanentlyDeleteTestUserAccount,
} from "@/lib/admin-user-lifecycle";
import { revalidatePath } from "next/cache";

export async function adminCreateUser(formData: FormData) {
  // First, verify the current executor is an admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("Permission Denied. Only Admins can invoke the Developer API.");

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;
  const role = formData.get("role") as string;

  if (!email || !password || !fullName || !role) {
    throw new Error("Missing required fields.");
  }

  // Engage the powerful Admin API
  const adminClient = createAdminClient();

  // Create the user and FORCE email_confirm: true to skip auth loops
  const { data: { user: newUser }, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: role,
    }
  });

  if (createError) {
    console.error("Admin user creation failed:", createError);
    throw new Error(`Failed to create developer-grade user: ${createError.message}`);
  }

  if (newUser) {
    // Upsert the new profile because sometimes triggers lag or fail
    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert({
        id: newUser.id,
        full_name: fullName,
        email: email,
        role: role,
      });

    if (profileError) {
      console.warn("Failed to manually upsert profile after admin creation:", profileError.message);
    }
  }

  revalidatePath("/dashboard/admin/users");
  return { success: true };
}


export async function adminDeactivateUser(targetUserId: string) {
  return deactivateUserAccount(targetUserId);
}

export async function adminPermanentlyDeleteTestUser(targetUserId: string, confirmationEmail: string) {
  return permanentlyDeleteTestUserAccount(targetUserId, confirmationEmail);
}
