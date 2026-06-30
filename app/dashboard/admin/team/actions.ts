"use server";

import { randomInt } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { sendInternalTeamInviteEmail } from "@/lib/email";
import { getSitePath } from "@/lib/site-url";
import { repairLinkedInternalUserRole } from "@/lib/internal-auth";

const TEAM_ROLES = ["owner", "admin", "developer", "support", "tutor_manager", "finance"] as const;
const TEAM_STATUSES = ["active", "inactive"] as const;

type TeamRole = (typeof TEAM_ROLES)[number];
type TeamStatus = (typeof TEAM_STATUSES)[number];

function readText(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isTeamRole(value: string): value is TeamRole {
  return TEAM_ROLES.includes(value as TeamRole);
}

function isTeamStatus(value: string): value is TeamStatus {
  return TEAM_STATUSES.includes(value as TeamStatus);
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin" && user.user_metadata?.role !== "admin") {
    throw new Error("Permission denied.");
  }

  return supabase;
}

async function findInternalProfileIdByEmail(supabase: Awaited<ReturnType<typeof createClient>>, email: string) {
  const { data } = await supabase
    .from("profiles")
    .select("id, role")
    .ilike("email", email)
    .eq("role", "internal")
    .maybeSingle();

  return data?.id || null;
}

function teamRedirect(message: string, type: "message" | "warning" = "message"): never {
  redirect(`/dashboard/admin/team?${type}=${encodeURIComponent(message)}`);
}

function teamError(message: string): never {
  redirect(`/dashboard/admin/team?error=${encodeURIComponent(message)}`);
}

function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const required = [
    "ABCDEFGHJKLMNPQRSTUVWXYZ",
    "abcdefghijkmnopqrstuvwxyz",
    "23456789",
    "!@#$%",
  ].map((group) => group[randomInt(group.length)]);

  const remaining = Array.from({ length: 12 }, () => alphabet[randomInt(alphabet.length)]);
  const password = [...required, ...remaining];

  for (let i = password.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join("");
}

function getInternalForgotPasswordUrl(email: string) {
  return `${getSitePath("/forgot-password")}?email=${encodeURIComponent(email)}&internal=1`;
}

function isRecoveryActionLink(value: unknown) {
  if (typeof value !== "string") return false;

  try {
    const url = new URL(value);
    return url.pathname.includes("/auth/v1/verify") &&
      url.searchParams.get("type") === "recovery" &&
      Boolean(url.searchParams.get("token"));
  } catch {
    return false;
  }
}

async function generateInternalResetLink(adminClient: ReturnType<typeof createAdminClient>, email: string) {
  const fallbackUrl = getInternalForgotPasswordUrl(email);
  const redirectTo = `${getSitePath("/auth/callback")}?next=/reset-password`;

  try {
    const { data, error } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo,
      },
    });

    if (error) {
      console.warn("[internal-team] Recovery link generation failed:", error.message);
      return fallbackUrl;
    }

    const actionLink = (data as any)?.properties?.action_link;

    if (isRecoveryActionLink(actionLink)) {
      return actionLink;
    }

    console.warn("[internal-team] Recovery link generation did not return a valid Supabase action link.");
    return fallbackUrl;
  } catch (error) {
    console.warn("[internal-team] Recovery link generation failed:", error);
    return fallbackUrl;
  }
}

async function sendInviteOrWarn({
  adminClient,
  email,
  name,
  role,
  title,
  temporaryPassword,
}: {
  adminClient: ReturnType<typeof createAdminClient>;
  email: string;
  name: string;
  role: string;
  title?: string | null;
  temporaryPassword: string;
}) {
  const resetLink = await generateInternalResetLink(adminClient, email);
  const emailResult = await sendInternalTeamInviteEmail({
    to: email,
    name,
    role,
    title,
    temporaryPassword,
    resetLink,
  });

  if (emailResult.success && emailResult.mock) {
    return "mock";
  }

  return emailResult.success ? "sent" : "failed";
}

export async function createTeamMember(formData: FormData) {
  const supabase = await requireAdmin();

  const name = readText(formData, "name");
  const email = normalizeEmail(readText(formData, "email"));
  const role = readText(formData, "role");
  const title = readText(formData, "title");
  const responsibilityArea = readText(formData, "responsibility_area");
  const notes = readText(formData, "notes");

  if (!name || !email) {
    throw new Error("Name and email are required.");
  }

  if (!isTeamRole(role)) {
    throw new Error("Choose a valid internal team role.");
  }

  const userId = await findInternalProfileIdByEmail(supabase, email);
  const { error } = await supabase.from("internal_team_members").insert({
    user_id: userId,
    name,
    email,
    role,
    title: title || null,
    responsibility_area: responsibilityArea || null,
    status: "active",
    notes: notes || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/admin/team");
  revalidatePath("/dashboard/admin");
}

export async function updateTeamMember(formData: FormData) {
  const supabase = await requireAdmin();

  const id = readText(formData, "id");
  const name = readText(formData, "name");
  const email = normalizeEmail(readText(formData, "email"));
  const role = readText(formData, "role");
  const title = readText(formData, "title");
  const responsibilityArea = readText(formData, "responsibility_area");
  const status = readText(formData, "status");
  const notes = readText(formData, "notes");

  if (!id || !name || !email) {
    throw new Error("Missing required team member fields.");
  }

  if (!isTeamRole(role) || !isTeamStatus(status)) {
    throw new Error("Invalid team member role or status.");
  }

  const userId = await findInternalProfileIdByEmail(supabase, email);
  const { error } = await supabase
    .from("internal_team_members")
    .update({
      user_id: userId,
      name,
      email,
      role,
      title: title || null,
      responsibility_area: responsibilityArea || null,
      status,
      notes: notes || null,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/admin/team");
  revalidatePath("/dashboard/admin");
}

export async function deactivateTeamMember(formData: FormData) {
  const supabase = await requireAdmin();
  const id = readText(formData, "id");

  if (!id) {
    teamError("Missing team member id.");
  }

  const { error } = await supabase
    .from("internal_team_members")
    .update({ status: "inactive" })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/admin/team");
  revalidatePath("/dashboard/admin");
  teamRedirect("Internal team member marked inactive.");
}

export async function reactivateTeamMember(formData: FormData) {
  const supabase = await requireAdmin();
  const id = readText(formData, "id");

  if (!id) {
    teamError("Missing team member id.");
  }

  const { data: member, error: memberError } = await supabase
    .from("internal_team_members")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (memberError || !member) {
    teamError(memberError?.message || "Internal team member not found.");
  }

  if (member.status === "active") {
    teamError("This internal team member is already active.");
  }

  const { error } = await supabase
    .from("internal_team_members")
    .update({ status: "active" })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/admin/team");
  revalidatePath("/dashboard/admin");
  teamRedirect("Internal team member reactivated.");
}

export async function disableInternalAccess(formData: FormData) {
  const supabase = await requireAdmin();
  const id = readText(formData, "id");
  const confirmation = readText(formData, "confirmation");

  if (!id) {
    teamError("Missing team member id.");
  }

  if (confirmation !== "DELETE") {
    teamError("Type DELETE to confirm disabling internal access.");
  }

  const { data: member, error: memberError } = await supabase
    .from("internal_team_members")
    .select("id, role, status")
    .eq("id", id)
    .maybeSingle();

  if (memberError || !member) {
    teamError(memberError?.message || "Internal team member not found.");
  }

  if (member.role === "owner" || member.role === "admin") {
    teamError("Owner and admin internal team records cannot be disabled from this danger zone.");
  }

  if (member.status === "inactive") {
    teamError("This internal team member is already inactive.");
  }

  const { error } = await supabase
    .from("internal_team_members")
    .update({ status: "inactive" })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/admin/team");
  revalidatePath("/dashboard/admin");
  teamRedirect("Internal access disabled. The linked login was kept, but inactive members cannot access the internal dashboard.");
}

export async function repairInternalLoginRole(formData: FormData) {
  const supabase = await requireAdmin();
  const id = readText(formData, "id");

  if (!id) {
    teamError("Missing team member id.");
  }

  const { data: member, error: memberError } = await supabase
    .from("internal_team_members")
    .select("id, user_id, status")
    .eq("id", id)
    .maybeSingle();

  if (memberError || !member) {
    teamError(memberError?.message || "Internal team member not found.");
  }

  if (member.status !== "active" || !member.user_id) {
    teamError("Only active linked internal team members can have login roles repaired.");
  }

  const result = await repairLinkedInternalUserRole(member.user_id);

  if (result.skipped) {
    teamError(result.reason || "This login role could not be repaired automatically.");
  }

  revalidatePath("/dashboard/admin/team");
  revalidatePath("/dashboard/admin");
  teamRedirect("Internal login role repaired.");
}

export async function createInternalLoginAccount(formData: FormData) {
  const supabase = await requireAdmin();
  const id = readText(formData, "id");
  const temporaryPassword = generateTemporaryPassword();

  if (!id) {
    teamError("Missing team member id.");
  }

  const { data: member, error: memberError } = await supabase
    .from("internal_team_members")
    .select("id, user_id, name, email, role, title, status")
    .eq("id", id)
    .maybeSingle();

  if (memberError || !member) {
    teamError(memberError?.message || "Internal team member not found.");
  }

  if (member.status !== "active") {
    teamError("Only active internal team members can receive login accounts.");
  }

  if (member.user_id) {
    teamError("This internal team member already has a linked login account.");
  }

  const email = normalizeEmail(member.email);
  const adminClient = createAdminClient();
  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("id, role")
    .eq("email", email)
    .maybeSingle();

  if (existingProfile) {
    teamError("This email already belongs to an existing platform account. Use a different email for the internal login.");
  }

  const { data: authUsers, error: authUsersError } = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (authUsersError) {
    throw new Error(authUsersError.message);
  }

  if (authUsers.users.some((user) => user.email?.toLowerCase() === email)) {
    teamError("This email already belongs to an existing auth account. Use a different email for the internal login.");
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: {
      full_name: member.name,
      role: "internal",
      auth_provider: "email",
    },
  });

  if (createError || !created.user) {
    throw new Error(createError?.message || "Failed to create internal login account.");
  }

  const { error: profileError } = await adminClient
    .from("profiles")
    .upsert({
      id: created.user.id,
      full_name: member.name,
      email,
      role: "internal",
    }, { onConflict: "id" });

  if (profileError) {
    throw new Error(profileError.message);
  }

  const { error: linkError } = await adminClient
    .from("internal_team_members")
    .update({ user_id: created.user.id })
    .eq("id", member.id);

  if (linkError) {
    throw new Error(linkError.message);
  }

  try {
    await repairLinkedInternalUserRole(created.user.id);
  } catch (repairError) {
    console.error("[internal-team] Internal role repair after create failed:", repairError);
  }

  revalidatePath("/dashboard/admin/team");
  revalidatePath("/dashboard/admin/users");

  const inviteStatus = await sendInviteOrWarn({
    adminClient,
    email,
    name: member.name,
    role: member.role,
    title: member.title,
    temporaryPassword,
  });

  if (inviteStatus === "mock") {
    teamRedirect("Login account created. Invite generated in local mock mode. Check the server terminal for the email content.", "warning");
  }

  if (inviteStatus === "failed") {
    teamRedirect("Login account created, but the invite email failed. Please resend the invite or share details manually.", "warning");
  }

  teamRedirect("Login account created and invite email sent.");
}

export async function resendInternalInvite(formData: FormData) {
  const supabase = await requireAdmin();
  const id = readText(formData, "id");
  const temporaryPassword = generateTemporaryPassword();

  if (!id) {
    teamError("Missing team member id.");
  }

  const { data: member, error: memberError } = await supabase
    .from("internal_team_members")
    .select("id, user_id, name, email, role, title, status")
    .eq("id", id)
    .maybeSingle();

  if (memberError || !member) {
    teamError(memberError?.message || "Internal team member not found.");
  }

  if (member.status !== "active" || !member.user_id) {
    teamError("Only active linked internal team members can receive invite emails.");
  }

  const email = normalizeEmail(member.email);
  const adminClient = createAdminClient();
  const { error: updateError } = await adminClient.auth.admin.updateUserById(member.user_id, {
    password: temporaryPassword,
    user_metadata: {
      full_name: member.name,
      role: "internal",
      auth_provider: "email",
    },
  });

  if (updateError) {
    throw new Error(updateError.message);
  }

  try {
    await repairLinkedInternalUserRole(member.user_id);
  } catch (repairError) {
    console.error("[internal-team] Internal role repair before resend failed:", repairError);
  }

  const inviteStatus = await sendInviteOrWarn({
    adminClient,
    email,
    name: member.name,
    role: member.role,
    title: member.title,
    temporaryPassword,
  });

  revalidatePath("/dashboard/admin/team");

  if (inviteStatus === "mock") {
    teamRedirect("Temporary password updated. Invite generated in local mock mode. Check the server terminal for the email content.", "warning");
  }

  if (inviteStatus === "failed") {
    teamRedirect("Temporary password updated, but the invite email failed. Please share details manually.", "warning");
  }

  teamRedirect("Invite email resent with a fresh temporary password.");
}
