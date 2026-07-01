import type { SupabaseClient } from "@supabase/supabase-js";

export type AccountMembershipKey =
  | "sciencedojo_student"
  | "parent"
  | "tutor"
  | "internal"
  | "admin";

export type PublicAccountRole =
  | "user"
  | "parent"
  | "student"
  | "tutor"
  | "admin"
  | "internal";

export function membershipForRole(
  role?: string | null,
): AccountMembershipKey | null {
  if (role === "student") return "sciencedojo_student";
  if (
    role === "parent" ||
    role === "tutor" ||
    role === "internal" ||
    role === "admin"
  ) {
    return role;
  }
  return null;
}

export async function upsertMembershipForRole(
  supabase: SupabaseClient,
  userId: string,
  role?: string | null,
) {
  const membershipKey = membershipForRole(role);
  if (!membershipKey) return;

  const { error } = await supabase.from("account_memberships").upsert(
    {
      user_id: userId,
      membership_key: membershipKey,
      status: "active",
    },
    { onConflict: "user_id,membership_key" },
  );

  if (error) {
    console.error("[account-memberships] Upsert failed:", error.message);
  }
}

export async function hasActiveMembership(
  supabase: SupabaseClient,
  userId: string,
  membershipKey: AccountMembershipKey,
) {
  const { data } = await supabase
    .from("account_memberships")
    .select("id")
    .eq("user_id", userId)
    .eq("membership_key", membershipKey)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  return Boolean(data);
}
