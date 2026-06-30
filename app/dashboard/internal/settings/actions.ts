"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getActiveInternalMemberByUserId, repairLinkedInternalUserRole } from "@/lib/internal-auth";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function readText(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function normalizeUploadExtension(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

async function requireActiveInternalUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login/internal");
  }

  const member = await getActiveInternalMemberByUserId(supabase, user.id);

  if (!member) {
    redirect(`/login/internal/denied?error=${encodeURIComponent("Your internal access is inactive or has not been linked yet.")}`);
  }

  try {
    await repairLinkedInternalUserRole(user.id);
  } catch (repairError) {
    console.error("[internal-settings-action] Internal role repair failed:", repairError);
  }

  return { supabase, user, memberId: member.id };
}

export async function updateInternalSettings(formData: FormData) {
  const { supabase, user, memberId } = await requireActiveInternalUser();
  const name = readText(formData, "name");
  const title = readText(formData, "title");
  const bio = readText(formData, "bio");
  const avatar = formData.get("avatar");

  if (!name) {
    redirect(`/dashboard/internal/settings?error=${encodeURIComponent("Display name is required.")}`);
  }

  const profileUpdate: Record<string, string | null> = {
    full_name: name,
    bio: bio || null,
  };

  if (avatar instanceof File && avatar.size > 0) {
    if (!ALLOWED_AVATAR_TYPES.has(avatar.type)) {
      redirect(`/dashboard/internal/settings?error=${encodeURIComponent("Upload a JPG, PNG, or WebP image.")}`);
    }

    if (avatar.size > MAX_AVATAR_SIZE) {
      redirect(`/dashboard/internal/settings?error=${encodeURIComponent("Profile photo must be 2MB or smaller.")}`);
    }

    const extension = normalizeUploadExtension(avatar.type);
    const filePath = `avatars/internal-${user.id}-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, avatar, {
        contentType: avatar.type,
        upsert: false,
      });

    if (uploadError) {
      redirect(`/dashboard/internal/settings?error=${encodeURIComponent(uploadError.message)}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    profileUpdate.avatar_url = publicUrl;
  }

  let { error: profileError } = await supabase
    .from("profiles")
    .update(profileUpdate)
    .eq("id", user.id);

  if (profileError?.message?.includes("profiles.bio")) {
    const { bio: _bio, ...profileUpdateWithoutBio } = profileUpdate;
    const retry = await supabase
      .from("profiles")
      .update(profileUpdateWithoutBio)
      .eq("id", user.id);
    profileError = retry.error;
  }

  if (profileError) {
    redirect(`/dashboard/internal/settings?error=${encodeURIComponent(profileError.message)}`);
  }

  const metadataUpdate: Record<string, string> = {
    full_name: name,
  };

  if (typeof profileUpdate.avatar_url === "string") {
    metadataUpdate.avatar_url = profileUpdate.avatar_url;
  }

  const { error: metadataError } = await supabase.auth.updateUser({
    data: metadataUpdate,
  });

  if (metadataError) {
    redirect(`/dashboard/internal/settings?error=${encodeURIComponent(metadataError.message)}`);
  }

  const adminClient = createAdminClient();
  const { error: teamError } = await adminClient
    .from("internal_team_members")
    .update({
      name,
      title: title || null,
    })
    .eq("id", memberId)
    .eq("user_id", user.id)
    .eq("status", "active");

  if (teamError) {
    redirect(`/dashboard/internal/settings?error=${encodeURIComponent(teamError.message)}`);
  }

  revalidatePath("/dashboard/internal");
  revalidatePath("/dashboard/internal/settings");
  revalidatePath("/", "layout");
  redirect(`/dashboard/internal/settings?message=${encodeURIComponent("Profile updated successfully.")}`);
}
