import type { FeatureFlagKey } from "@/lib/feature-flags";

type ResourceFlags = Pick<Record<FeatureFlagKey, boolean>, "learning_hub_enabled" | "practice_dojo_enabled" | "focus_dojo_enabled" | "community_enabled">;

export function getPublicResourceNavigation(flags: ResourceFlags) {
  return [
    ...(flags.learning_hub_enabled ? [{ label: "Learning Hub", href: "/learning-hub", description: "Guides and resources for learning." }] : []),
    ...(flags.practice_dojo_enabled ? [{ label: "Free Practice", href: "/ai-practice-studio", description: "Focused questions by subject." }] : []),
    ...(flags.focus_dojo_enabled ? [{ label: "FocusDojo", href: "/focus-dojo", description: "Tools for focused study sessions." }] : []),
    ...(flags.community_enabled ? [{ label: "Exam Community", href: "/community", description: "Exam discussions and updates." }] : []),
  ];
}
