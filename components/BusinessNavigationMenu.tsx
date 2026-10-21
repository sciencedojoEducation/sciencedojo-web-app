import PublicNavigationDisclosure from "@/components/PublicNavigationDisclosure";
import { businessNavigationItems } from "@/lib/business-navigation";

export default function BusinessNavigationMenu() {
  return <PublicNavigationDisclosure label="For Business" items={businessNavigationItems} />;
}
