import "server-only";

import { createAdminClient } from "@/utils/supabase/admin";

type QueryClient = {
  from: (table: string) => any;
};

type ActiveInternalMember = {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  title?: string | null;
  status: "active";
};

type RepairResult = {
  repaired: boolean;
  skipped?: boolean;
  reason?: string;
};

export async function getActiveInternalMemberByUserId(
  client: QueryClient,
  userId: string | null | undefined
): Promise<ActiveInternalMember | null> {
  if (!userId) return null;

  const { data, error } = await client
    .from("internal_team_members")
    .select("id, user_id, name, email, role, title, status")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.error("[internal-auth] Active internal member lookup failed:", error.message);
    return null;
  }

  return data as ActiveInternalMember | null;
}

export async function isActiveLinkedInternalUser(client: QueryClient, userId: string | null | undefined) {
  return Boolean(await getActiveInternalMemberByUserId(client, userId));
}

export async function repairLinkedInternalUserRole(userId: string | null | undefined): Promise<RepairResult> {
  if (!userId) {
    return { repaired: false, skipped: true, reason: "Missing user id." };
  }

  const adminClient = createAdminClient();
  const member = await getActiveInternalMemberByUserId(adminClient, userId);

  if (!member) {
    return { repaired: false, skipped: true, reason: "No active linked internal team member found." };
  }

  if (member.role === "owner" || member.role === "admin") {
    return { repaired: false, skipped: true, reason: "Owner and admin internal team records are not auto-repaired." };
  }

  const { data: authData, error: authError } = await adminClient.auth.admin.getUserById(userId);
  if (authError || !authData.user) {
    throw new Error(authError?.message || "Linked auth user was not found.");
  }

  const authRole = authData.user.user_metadata?.role;
  if (authRole === "admin" || authRole === "owner") {
    return { repaired: false, skipped: true, reason: "Admin auth accounts are not auto-repaired." };
  }

  const { data: profile, error: profileLookupError } = await adminClient
    .from("profiles")
    .select("id, email, full_name, avatar_url, role, student_name")
    .eq("id", userId)
    .maybeSingle();

  if (profileLookupError) {
    throw new Error(profileLookupError.message);
  }

  if (profile?.role === "admin" || profile?.role === "owner") {
    return { repaired: false, skipped: true, reason: "Admin profile accounts are not auto-repaired." };
  }

  const safeMetadata = {
    ...authData.user.user_metadata,
    role: "internal",
    full_name:
      authData.user.user_metadata?.full_name ||
      authData.user.user_metadata?.name ||
      profile?.full_name ||
      member.name ||
      "",
    avatar_url:
      authData.user.user_metadata?.avatar_url ||
      authData.user.user_metadata?.picture ||
      profile?.avatar_url ||
      "",
    auth_provider: authData.user.user_metadata?.auth_provider || "email",
  };

  const { error: upsertError } = await adminClient
    .from("profiles")
    .upsert({
      id: userId,
      email: profile?.email || authData.user.email?.toLowerCase() || member.email || "",
      full_name: profile?.full_name || safeMetadata.full_name,
      avatar_url: profile?.avatar_url || safeMetadata.avatar_url || null,
      student_name: profile?.student_name || null,
      role: "internal",
    }, { onConflict: "id" });

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  const { error: metadataError } = await adminClient.auth.admin.updateUserById(userId, {
    user_metadata: safeMetadata,
  });

  if (metadataError) {
    throw new Error(metadataError.message);
  }

  return { repaired: profile?.role !== "internal" || authRole !== "internal" };
}
