import SeoConversionCtas from "@/components/SeoConversionCtas";
import { getPublicFeatureFlagMap } from "@/lib/feature-flags";

export default async function PublicSeoConversionCtas() {
  const flags = await getPublicFeatureFlagMap();
  return <SeoConversionCtas enabled={flags.free_assessment_enabled} />;
}
