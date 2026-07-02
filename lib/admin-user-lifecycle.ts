"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

type AdminClient = ReturnType<typeof createAdminClient>;
type AuthUser = Awaited<ReturnType<AdminClient["auth"]["admin"]["listUsers"]>>["data"]["users"][number];

type UserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  avatar_url: string | null;
  is_suspended?: boolean | null;
};

type StorageTarget = {
  bucket: string;
  path: string;
};

const USER_RELATED_REVALIDATION_PATHS = [
  "/dashboard/admin/users",
  "/dashboard/admin/tutors",
  "/dashboard/admin/team",
  "/dashboard/admin",
  "/dashboard/messages",
  "/dashboard/classes",
  "/",
];

function normalizeEmail(email?: string | null) {
  return String(email || "").trim().toLowerCase();
}

function uniqueValues(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function uniqueStorageTargets(targets: StorageTarget[]) {
  const seen = new Set<string>();
  return targets.filter((target) => {
    const key = `${target.bucket}:${target.path}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isAdminRole(role?: string | null) {
  return role === "admin";
}

function getStoragePathFromUrl(url: string | null | undefined, bucket: string) {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const markerIndex = parsed.pathname.indexOf(marker);

    if (markerIndex === -1) {
      return "";
    }

    return decodeURIComponent(parsed.pathname.slice(markerIndex + marker.length));
  } catch {
    return "";
  }
}

async function requireAdminUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin" && user.user_metadata?.role !== "admin") {
    throw new Error("Permission denied.");
  }

  return user;
}

export async function listAuthUsersByEmail(adminClient: AdminClient, email: string) {
  const normalizedEmail = normalizeEmail(email);
  const matches: AuthUser[] = [];
  let page = 1;
  const perPage = 1000;

  if (!normalizedEmail) {
    return matches;
  }

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw new Error(`Failed to inspect Auth users: ${error.message}`);
    }

    matches.push(
      ...data.users.filter((authUser) => normalizeEmail(authUser.email) === normalizedEmail)
    );

    if (data.users.length < perPage) {
      return matches;
    }

    page += 1;
  }
}

export async function deleteAuthUserIfPresent(adminClient: AdminClient, userId: string) {
  const { error } = await adminClient.auth.admin.deleteUser(userId);

  if (error && !error.message?.includes("User not found")) {
    throw new Error(`Failed to delete Supabase Auth user: ${error.message}`);
  }
}

async function getTargetContext(adminClient: AdminClient, userId: string) {
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, email, full_name, role, avatar_url, is_suspended")
    .eq("id", userId)
    .maybeSingle<UserProfile>();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const { data: authData } = await adminClient.auth.admin.getUserById(userId);
  const authUser = authData?.user || null;
  const email = normalizeEmail(profile?.email || authUser?.email);

  if (!profile && !authUser) {
    throw new Error("User not found in profiles or Supabase Auth.");
  }

  return { profile, authUser, email };
}

async function listStorageObjectsRecursive(adminClient: AdminClient, bucket: string, prefix: string) {
  const results: string[] = [];
  const normalizedPrefix = prefix.replace(/^\/+|\/+$/g, "");

  async function visit(path: string) {
    const { data, error } = await adminClient.storage.from(bucket).list(path || undefined, {
      limit: 1000,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      console.warn(`[user-lifecycle] Could not list storage ${bucket}/${path}:`, error.message);
      return;
    }

    for (const item of data || []) {
      const childPath = path ? `${path}/${item.name}` : item.name;

      if (item.id) {
        results.push(childPath);
      } else {
        await visit(childPath);
      }
    }
  }

  await visit(normalizedPrefix);
  return results;
}

async function collectStorageTargets(adminClient: AdminClient, userId: string, profile?: UserProfile | null) {
  const targets: StorageTarget[] = [];
  const avatarPath = getStoragePathFromUrl(profile?.avatar_url, "avatars");

  if (avatarPath) {
    targets.push({ bucket: "avatars", path: avatarPath });
  }

  const avatarObjects = await listStorageObjectsRecursive(adminClient, "avatars", "avatars");
  for (const path of avatarObjects) {
    if (path.includes(userId)) {
      targets.push({ bucket: "avatars", path });
    }
  }

  const privateDocs = await listStorageObjectsRecursive(adminClient, "private_docs", userId);
  for (const path of privateDocs) {
    targets.push({ bucket: "private_docs", path });
  }

  const { data: classRows } = await adminClient
    .from("classes")
    .select("id")
    .or(`student_id.eq.${userId},tutor_id.eq.${userId}`);
  const classIds = uniqueValues((classRows || []).map((row) => String(row.id)));

  for (const classId of classIds) {
    const classFiles = await listStorageObjectsRecursive(adminClient, "class-files", classId);
    for (const path of classFiles) {
      targets.push({ bucket: "class-files", path });
    }
  }

  const { data: authoredPosts } = await adminClient
    .from("class_posts")
    .select("id, file_url")
    .eq("author_id", userId);
  const authoredPostIds = uniqueValues((authoredPosts || []).map((row) => String(row.id)));

  for (const post of authoredPosts || []) {
    const path = getStoragePathFromUrl(String(post.file_url || ""), "class-files");
    if (path) targets.push({ bucket: "class-files", path });
  }

  const { data: authoredComments } = await adminClient
    .from("class_comments")
    .select("file_url")
    .eq("author_id", userId);

  for (const comment of authoredComments || []) {
    const path = getStoragePathFromUrl(String(comment.file_url || ""), "class-files");
    if (path) targets.push({ bucket: "class-files", path });
  }

  for (const postId of authoredPostIds) {
    const submissionFiles = await listStorageObjectsRecursive(adminClient, "class-files", `submissions/${postId}`);
    for (const path of submissionFiles) {
      targets.push({ bucket: "class-files", path });
    }
  }

  const { data: conversations } = await adminClient
    .from("conversations")
    .select("id")
    .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`);
  const conversationIds = uniqueValues((conversations || []).map((row) => String(row.id)));

  if (conversationIds.length > 0) {
    const { data: messages } = await adminClient
      .from("messages")
      .select("file_url")
      .in("conversation_id", conversationIds);

    for (const message of messages || []) {
      const path = String(message.file_url || "");
      if (path) targets.push({ bucket: "message-attachments", path });
    }
  }

  const { data: sentMessages } = await adminClient
    .from("messages")
    .select("file_url")
    .eq("sender_id", userId);

  for (const message of sentMessages || []) {
    const path = String(message.file_url || "");
    if (path) targets.push({ bucket: "message-attachments", path });
  }

  return uniqueStorageTargets(targets);
}

async function removeStorageTargets(adminClient: AdminClient, targets: StorageTarget[]) {
  const failures: string[] = [];
  const targetsByBucket = targets.reduce<Record<string, string[]>>((acc, target) => {
    acc[target.bucket] = acc[target.bucket] || [];
    acc[target.bucket].push(target.path);
    return acc;
  }, {});

  for (const [bucket, paths] of Object.entries(targetsByBucket)) {
    for (let index = 0; index < paths.length; index += 100) {
      const batch = paths.slice(index, index + 100);
      const { error } = await adminClient.storage.from(bucket).remove(batch);

      if (error) {
        failures.push(`${bucket}: ${error.message}`);
      }
    }
  }

  if (failures.length > 0) {
    console.warn("[user-lifecycle] Storage cleanup had non-blocking failures:", failures);
  }

  return failures;
}

async function deleteRows(
  adminClient: AdminClient,
  table: string,
  column: string,
  userId: string,
) {
  const { error } = await adminClient.from(table).delete().eq(column, userId);
  if (error) throw new Error(`Failed to delete ${table}.${column}: ${error.message}`);
}

async function updateRows(
  adminClient: AdminClient,
  table: string,
  values: Record<string, string | null | boolean | number>,
  column: string,
  userId: string,
) {
  const { error } = await adminClient.from(table).update(values).eq(column, userId);
  if (error) throw new Error(`Failed to update ${table}.${column}: ${error.message}`);
}

async function deleteAppRecordsForUser(adminClient: AdminClient, userId: string, email: string) {
  await deleteRows(adminClient, "reviews", "student_id", userId);
  await deleteRows(adminClient, "reviews", "tutor_id", userId);
  await deleteRows(adminClient, "reviews", "reviewed_by", userId);
  await updateRows(adminClient, "messages", { reviewed_by: null }, "reviewed_by", userId);

  await deleteRows(adminClient, "student_missions", "student_id", userId);
  await deleteRows(adminClient, "student_missions", "tutor_id", userId);
  await deleteRows(adminClient, "class_comments", "author_id", userId);
  await deleteRows(adminClient, "class_posts", "author_id", userId);
  await deleteRows(adminClient, "classes", "student_id", userId);
  await deleteRows(adminClient, "classes", "tutor_id", userId);
  await deleteRows(adminClient, "messages", "sender_id", userId);
  await deleteRows(adminClient, "conversations", "participant_1_id", userId);
  await deleteRows(adminClient, "conversations", "participant_2_id", userId);
  await deleteRows(adminClient, "disputes", "reporter_id", userId);
  await deleteRows(adminClient, "bookings", "student_id", userId);
  await deleteRows(adminClient, "bookings", "tutor_id", userId);
  await deleteRows(adminClient, "payouts", "tutor_id", userId);
  await deleteRows(adminClient, "subscriptions", "user_id", userId);
  await deleteRows(adminClient, "account_memberships", "user_id", userId);
  await deleteRows(adminClient, "tutor_availability", "tutor_id", userId);
  await deleteRows(adminClient, "applications", "user_id", userId);
  await deleteRows(adminClient, "lead_sources", "user_id", userId);
  await deleteRows(adminClient, "lead_sources", "referrer_tutor_id", userId);
  await deleteRows(adminClient, "lead_sources", "landing_tutor_id", userId);
  await updateRows(adminClient, "assessment_leads", { referrer_tutor_id: null }, "referrer_tutor_id", userId);
  await updateRows(adminClient, "assessment_leads", { landing_tutor_id: null }, "landing_tutor_id", userId);
  await updateRows(adminClient, "bookings", { referrer_tutor_id: null }, "referrer_tutor_id", userId);
  await updateRows(adminClient, "bookings", { landing_tutor_id: null }, "landing_tutor_id", userId);
  await updateRows(adminClient, "feature_flags", { updated_by: null }, "updated_by", userId);
  await updateRows(adminClient, "announcements", { sender_id: null }, "sender_id", userId);
  await deleteRows(adminClient, "tutors", "id", userId);

  if (email) {
    const { error: internalError } = await adminClient
      .from("internal_team_members")
      .delete()
      .or(`user_id.eq.${userId},email.ilike.${email}`);

    if (internalError) {
      throw new Error(`Failed to delete internal team rows: ${internalError.message}`);
    }
  } else {
    await deleteRows(adminClient, "internal_team_members", "user_id", userId);
  }
}

function revalidateUserLifecyclePaths() {
  for (const path of USER_RELATED_REVALIDATION_PATHS) {
    revalidatePath(path);
  }
}

export async function deactivateUserAccount(targetUserId: string) {
  const currentUser = await requireAdminUser();

  if (currentUser.id === targetUserId) {
    throw new Error("You cannot deactivate yourself.");
  }

  const adminClient = createAdminClient();
  const { profile, authUser } = await getTargetContext(adminClient, targetUserId);

  if (isAdminRole(profile?.role || authUser?.user_metadata?.role)) {
    throw new Error("Admin accounts cannot be deactivated here.");
  }

  const { error: profileError } = await adminClient
    .from("profiles")
    .update({ is_suspended: true })
    .eq("id", targetUserId);

  if (profileError) {
    throw new Error(profileError.message);
  }

  await updateRows(adminClient, "account_memberships", { status: "inactive" }, "user_id", targetUserId);
  await updateRows(adminClient, "tutors", { is_available_now: false }, "id", targetUserId);
  await updateRows(adminClient, "internal_team_members", { status: "inactive" }, "user_id", targetUserId);

  const { error: authError } = await adminClient.auth.admin.updateUserById(targetUserId, {
    user_metadata: {
      ...authUser?.user_metadata,
      is_suspended: true,
    },
  });

  if (authError) {
    throw new Error(`Profile was suspended, but auth metadata could not be updated: ${authError.message}`);
  }

  revalidateUserLifecyclePaths();
  return { success: true };
}

export async function permanentlyDeleteTestUserAccount(targetUserId: string, confirmationEmail: string) {
  const currentUser = await requireAdminUser();

  if (currentUser.id === targetUserId) {
    throw new Error("You cannot permanently delete yourself.");
  }

  const adminClient = createAdminClient();
  const { profile, authUser, email } = await getTargetContext(adminClient, targetUserId);

  if (!email) {
    throw new Error("This user has no email address to verify against.");
  }

  if (normalizeEmail(confirmationEmail) !== email) {
    throw new Error("Type the user's exact email address to permanently delete this test account.");
  }

  if (isAdminRole(profile?.role || authUser?.user_metadata?.role)) {
    throw new Error("Admin accounts cannot be permanently deleted here.");
  }

  const storageTargets = await collectStorageTargets(adminClient, targetUserId, profile);
  const storageFailures = await removeStorageTargets(adminClient, storageTargets);

  await deleteAppRecordsForUser(adminClient, targetUserId, email);

  const { error: profileIdError } = await adminClient
    .from("profiles")
    .delete()
    .eq("id", targetUserId);

  if (profileIdError) {
    throw new Error(`Failed to delete profile: ${profileIdError.message}`);
  }

  const { error: profileEmailError } = await adminClient
    .from("profiles")
    .delete()
    .ilike("email", email);

  if (profileEmailError) {
    throw new Error(`Failed to delete matching profile email rows: ${profileEmailError.message}`);
  }

  const authUsers = await listAuthUsersByEmail(adminClient, email);
  const authIds = uniqueValues([targetUserId, ...authUsers.map((user) => user.id)]);

  for (const authId of authIds) {
    await deleteAuthUserIfPresent(adminClient, authId);
  }

  const remainingAuthUsers = await listAuthUsersByEmail(adminClient, email);
  if (remainingAuthUsers.length > 0) {
    throw new Error("A matching Supabase Auth user still exists after permanent deletion.");
  }

  const { data: remainingProfiles, error: remainingProfileError } = await adminClient
    .from("profiles")
    .select("id")
    .or(`id.eq.${targetUserId},email.ilike.${email}`);

  if (remainingProfileError) {
    throw new Error(remainingProfileError.message);
  }

  if ((remainingProfiles || []).length > 0) {
    throw new Error("A matching profile row still exists after permanent deletion.");
  }

  revalidateUserLifecyclePaths();
  return {
    success: true,
    storageFailures,
    deletedStorageObjectCount: storageTargets.length,
  };
}
