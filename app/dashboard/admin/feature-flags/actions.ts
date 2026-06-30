"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { FEATURE_FLAG_DEFINITIONS, type FeatureFlagKey } from "@/lib/feature-flags";

const featureFlagKeys = new Set<string>(FEATURE_FLAG_DEFINITIONS.map((definition) => definition.key));

function isFeatureFlagKey(key: string): key is FeatureFlagKey {
  return featureFlagKeys.has(key);
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, error: "Unauthorized" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const metadataRole = user.user_metadata?.role;
  if (profile?.role !== "admin" && metadataRole !== "admin") {
    return { supabase, user: null, error: "Unauthorized" };
  }

  return { supabase, user, error: null };
}

export async function toggleFeatureFlag(formData: FormData) {
  const key = String(formData.get("key") || "");
  const enabled = String(formData.get("enabled") || "") === "true";

  if (!isFeatureFlagKey(key)) {
    console.error("[feature-flags] Unknown key:", key);
    return;
  }

  const { user, error: authError } = await requireAdmin();
  if (authError || !user) {
    console.error("[feature-flags] Unauthorized toggle attempt.");
    return;
  }

  const definition = FEATURE_FLAG_DEFINITIONS.find((flag) => flag.key === key);
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("feature_flags")
    .upsert({
      key,
      label: definition?.label || key,
      description: definition?.description || null,
      category: definition?.category || "System",
      enabled,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });

  if (error) {
    console.error("[feature-flags] Toggle failed:", error.message);
    return;
  }

  [
    "/",
    "/dashboard/admin/feature-flags",
    "/dashboard/admin",
    "/dashboard/parent",
    "/dashboard/student",
    "/dashboard/tutor",
    "/dashboard/parent/tutors",
    "/dashboard/student/tutors",
    "/free-assessment",
    "/learning-hub",
    "/ai-practice-studio",
  ].forEach((path) => revalidatePath(path));

  return;
}
