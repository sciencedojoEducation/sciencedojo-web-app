import { createClient } from "@/utils/supabase/server";
import FeeForm from "./FeeForm";
import IntegrationsList from "./IntegrationsList";

export default async function AdminSettings() {
  const supabase = await createClient();
  
  const { data: settings } = await supabase
    .from("platform_settings")
    .select("platform_fee_percent")
    .limit(1)
    .single();

  const { data: integrations } = await supabase
    .from("platform_integrations")
    .select("*");

  const currentFee = settings?.platform_fee_percent ?? 25;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-10">
         <h1 className="text-3xl font-bold text-secondary mb-2">Platform Settings</h1>
         <p className="text-secondary/60">Configure global platform behavior and API integrations.</p>
      </div>

      <div className="space-y-8">
         {/* Financial Config */}
         <div className="bg-white p-8 rounded-3xl border border-secondary/10 shadow-sm">
            <h2 className="text-xl font-bold text-secondary mb-2">Financial Configuration</h2>
            <p className="text-sm text-secondary/60 mb-6">Set the global commission rate that the platform takes from every booking before routing the payout to the tutor.</p>
            
            <FeeForm currentFee={currentFee} />
         </div>

         {/* API Integrations */}
         <div className="bg-white p-8 rounded-3xl border border-secondary/10 shadow-sm">
            <h2 className="text-xl font-bold text-secondary mb-6">Live API Integrations</h2>
            <IntegrationsList integrations={integrations || []} />
         </div>
      </div>
    </div>
  );
}
