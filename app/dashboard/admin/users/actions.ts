"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
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


export async function adminDeleteUser(targetUserId: string) {
  // Verify execution permission
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  if (!currentUser) throw new Error("Unauthorized");
  if (currentUser.id === targetUserId) throw new Error("You cannot permanently delete yourself.");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", currentUser.id).single();
  if (profile?.role !== "admin") throw new Error("Permission Denied.");

  // Engage Admin API
  const adminClient = createAdminClient();

  // Wipes the record from public.profiles FIRST
  const { error: profileError } = await adminClient
    .from("profiles")
    .delete()
    .eq("id", targetUserId);

  if (profileError) {
    console.error(`Failed to delete profile for user ${targetUserId}:`, profileError.message);
    // Continue anyway to try and wipe the auth user
  }

  // Wipes the user from auth.users (Cascading deletes across entire database natively)
  const { error } = await adminClient.auth.admin.deleteUser(targetUserId);

  if (error) {
    // If the user is already gone from Auth, it's a success for us
    if (error.message?.includes("User not found")) {
      console.log(`User ${targetUserId} already removed from Auth.`);
    } else {
      console.error(`Failed to wipe user ${targetUserId}:`, error);
      throw new Error(`Failed to completely delete the user: ${error.message}`);
    }
  }

  revalidatePath("/dashboard/admin/users");
  return { success: true };
}
