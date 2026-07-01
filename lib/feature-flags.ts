import { createClient } from "@/utils/supabase/server";

export const FEATURE_FLAG_CATEGORIES = [
  "Public Website",
  "Tutor Marketplace",
  "Booking & Payments",
  "Dashboards",
  "AI / Practice Tools",
  "Growth / Beta",
  "System",
] as const;

export type FeatureFlagCategory = (typeof FEATURE_FLAG_CATEGORIES)[number];

export const FEATURE_FLAG_DEFINITIONS = [
  {
    key: "tutor_marketplace_enabled",
    label: "Tutor marketplace",
    description: "Show public and dashboard tutor discovery surfaces.",
    category: "Tutor Marketplace",
    defaultEnabled: false,
  },
  {
    key: "tutor_profiles_enabled",
    label: "Tutor profiles",
    description: "Allow public tutor profile pages to be viewed by families.",
    category: "Tutor Marketplace",
    defaultEnabled: false,
  },
  {
    key: "booking_enabled",
    label: "Booking",
    description: "Allow families and students to request tutor bookings.",
    category: "Booking & Payments",
    defaultEnabled: false,
  },
  {
    key: "free_assessment_enabled",
    label: "Free assessment",
    description: "Show the free learning assessment form and related CTAs.",
    category: "Public Website",
    defaultEnabled: false,
  },
  {
    key: "practice_dojo_enabled",
    label: "PracticeDojo",
    description: "Show PracticeDojo public learning tools and CTAs.",
    category: "AI / Practice Tools",
    defaultEnabled: false,
  },
  {
    key: "focus_dojo_enabled",
    label: "FocusDojo",
    description: "Show the public FocusDojo timer and study atmosphere tool.",
    category: "AI / Practice Tools",
    defaultEnabled: true,
  },
  {
    key: "ai_practice_generator_enabled",
    label: "AI practice generator",
    description: "Allow AI-backed practice question generation routes.",
    category: "AI / Practice Tools",
    defaultEnabled: false,
  },
  {
    key: "learning_hub_enabled",
    label: "Learning Hub",
    description: "Show public Learning Hub articles and index pages.",
    category: "Public Website",
    defaultEnabled: false,
  },
  {
    key: "parent_dashboard_enabled",
    label: "Parent dashboard",
    description: "Allow parent users to access the parent dashboard experience.",
    category: "Dashboards",
    defaultEnabled: false,
  },
  {
    key: "student_dashboard_enabled",
    label: "Student dashboard",
    description: "Allow student users to access the student dashboard experience.",
    category: "Dashboards",
    defaultEnabled: false,
  },
  {
    key: "tutor_dashboard_enabled",
    label: "Tutor dashboard",
    description: "Allow tutors to access the tutor dashboard experience.",
    category: "Dashboards",
    defaultEnabled: false,
  },
  {
    key: "tutor_applications_enabled",
    label: "Tutor applications",
    description: "Allow new tutor onboarding applications.",
    category: "Tutor Marketplace",
    defaultEnabled: false,
  },
  {
    key: "stripe_payments_enabled",
    label: "Stripe payments",
    description: "Allow checkout sessions for accepted bookings.",
    category: "Booking & Payments",
    defaultEnabled: false,
  },
  {
    key: "reviews_enabled",
    label: "Reviews",
    description: "Show review collection and public review surfaces.",
    category: "Growth / Beta",
    defaultEnabled: true,
  },
  {
    key: "maintenance_mode_enabled",
    label: "Maintenance mode",
    description: "Show a premium maintenance screen for public pages while admin access remains open.",
    category: "System",
    defaultEnabled: false,
  },
  {
    key: "beta_mode_enabled",
    label: "Beta mode",
    description: "Reserve beta-only product messaging and access controls.",
    category: "Growth / Beta",
    defaultEnabled: false,
  },
] as const;

export type FeatureFlagKey = (typeof FEATURE_FLAG_DEFINITIONS)[number]["key"];

export type FeatureFlag = {
  id?: string;
  key: FeatureFlagKey;
  label: string;
  description: string | null;
  enabled: boolean;
  category: FeatureFlagCategory;
  updated_at: string | null;
  updated_by: string | null;
};

const definitionMap = Object.fromEntries(
  FEATURE_FLAG_DEFINITIONS.map((definition) => [definition.key, definition]),
) as Record<FeatureFlagKey, (typeof FEATURE_FLAG_DEFINITIONS)[number]>;

function isDynamicServerError(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: unknown }).digest).includes("DYNAMIC_SERVER_USAGE"),
  );
}

function isFeatureFlagKey(key: string): key is FeatureFlagKey {
  return key in definitionMap;
}

function fallbackFlag(key: FeatureFlagKey): FeatureFlag {
  const definition = definitionMap[key];

  return {
    key,
    label: definition.label,
    description: definition.description,
    enabled: definition.defaultEnabled,
    category: definition.category,
    updated_at: null,
    updated_by: null,
  };
}

function normalizeFlag(row: Partial<FeatureFlag> & { key: string }): FeatureFlag | null {
  if (!isFeatureFlagKey(row.key)) return null;

  const fallback = fallbackFlag(row.key);

  return {
    id: row.id,
    key: row.key,
    label: row.label || fallback.label,
    description: row.description ?? fallback.description,
    enabled: typeof row.enabled === "boolean" ? row.enabled : fallback.enabled,
    category: row.category || fallback.category,
    updated_at: row.updated_at ?? null,
    updated_by: row.updated_by ?? null,
  };
}

export function getDefaultFeatureFlags() {
  return FEATURE_FLAG_DEFINITIONS.map((definition) => fallbackFlag(definition.key));
}

export async function getFeatureFlags(): Promise<FeatureFlag[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("feature_flags")
      .select("id, key, label, description, enabled, category, updated_at, updated_by")
      .order("category", { ascending: true })
      .order("label", { ascending: true });

    if (error) {
      console.warn("[feature-flags] Falling back to defaults:", error.message);
      return getDefaultFeatureFlags();
    }

    const dbFlags = new Map<FeatureFlagKey, FeatureFlag>();
    for (const row of data || []) {
      const flag = normalizeFlag(row as Partial<FeatureFlag> & { key: string });
      if (flag) dbFlags.set(flag.key, flag);
    }

    return FEATURE_FLAG_DEFINITIONS.map((definition) => dbFlags.get(definition.key) || fallbackFlag(definition.key));
  } catch (error) {
    if (isDynamicServerError(error)) {
      throw error;
    }

    console.warn("[feature-flags] Falling back to defaults:", error);
    return getDefaultFeatureFlags();
  }
}

export async function getFeatureFlag(key: FeatureFlagKey): Promise<FeatureFlag> {
  const flags = await getFeatureFlags();
  return flags.find((flag) => flag.key === key) || fallbackFlag(key);
}

export async function isFeatureEnabled(key: FeatureFlagKey): Promise<boolean> {
  const flag = await getFeatureFlag(key);
  return flag.enabled;
}

export async function getFeatureFlagMap() {
  const flags = await getFeatureFlags();
  return Object.fromEntries(flags.map((flag) => [flag.key, flag.enabled])) as Record<FeatureFlagKey, boolean>;
}
