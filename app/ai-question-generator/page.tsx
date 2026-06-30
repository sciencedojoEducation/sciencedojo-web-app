import { permanentRedirect } from "next/navigation";
import FeatureUnavailable from "@/components/FeatureUnavailable";
import { isFeatureEnabled } from "@/lib/feature-flags";

export default async function AiQuestionGeneratorRedirect() {
  const enabled = await isFeatureEnabled("ai_practice_generator_enabled");
  if (!enabled) {
    return (
      <FeatureUnavailable
        eyebrow="Question generator"
        title="The question generator is being prepared."
        message="We are refining this experience before opening it more widely."
      />
    );
  }

  permanentRedirect("/ai-practice-studio");
}
