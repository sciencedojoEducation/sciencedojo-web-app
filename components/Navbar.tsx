import NavbarClient from "@/components/NavbarClient";
import PublicNavigationBoundary from "@/components/PublicNavigationBoundary";
import { getPublicFeatureFlagMap } from "@/lib/feature-flags";

export default async function Navbar() {
  const flags = await getPublicFeatureFlagMap();
  return <PublicNavigationBoundary><NavbarClient flags={flags} /></PublicNavigationBoundary>;
}
