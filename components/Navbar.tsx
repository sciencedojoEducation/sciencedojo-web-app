import NavbarClient from "@/components/NavbarClient";
import { getPublicFeatureFlagMap } from "@/lib/feature-flags";

export default async function Navbar() {
  const flags = await getPublicFeatureFlagMap();
  return <NavbarClient flags={flags} />;
}
