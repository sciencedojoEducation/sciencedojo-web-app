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
  const activeIntegrations = (integrations || []).filter((integration) => integration.is_active).length;

  return (
    <div className="mx-auto max-w-4xl px-3 py-5 sm:px-4 md:p-8">
      <div className="mb-5 md:mb-8">
         <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-secondary/40">Platform control center</p>
         <h1 className="mb-2 text-2xl font-black tracking-tight text-secondary md:text-3xl">Platform Settings</h1>
         <p className="max-w-2xl text-sm font-medium leading-relaxed text-secondary/60 md:text-base">
           Configure financial rules and live integrations with calm operational control.
         </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:mb-8 md:grid-cols-3">
         <div className="rounded-2xl border border-secondary/10 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-secondary/40">Platform fee</p>
            <p className="mt-1 text-2xl font-black tracking-tight text-secondary">{currentFee}%</p>
         </div>
         <div className="rounded-2xl border border-secondary/10 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-secondary/40">Tutor share</p>
            <p className="mt-1 text-2xl font-black tracking-tight text-green-700">{100 - currentFee}%</p>
         </div>
         <div className="col-span-2 rounded-2xl border border-secondary/10 bg-white p-4 shadow-sm md:col-span-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-secondary/40">Live integrations</p>
            <p className="mt-1 text-2xl font-black tracking-tight text-primary">{activeIntegrations}</p>
         </div>
      </div>

      <div className="space-y-4 md:space-y-8">
         {/* Financial Config */}
         <div className="rounded-[1.5rem] border border-secondary/10 bg-white p-4 shadow-sm md:rounded-3xl md:p-8">
            <div className="mb-5 md:mb-6">
              <h2 className="text-lg font-black text-secondary md:text-xl">Financial configuration</h2>
              <p className="mt-1 text-sm font-medium leading-relaxed text-secondary/60">
                Set the platform commission applied before tutor payout calculations.
              </p>
            </div>
            
            <FeeForm currentFee={currentFee} />
         </div>

         {/* API Integrations */}
         <div className="rounded-[1.5rem] border border-secondary/10 bg-white p-4 shadow-sm md:rounded-3xl md:p-8">
            <div className="mb-5 md:mb-6">
              <h2 className="text-lg font-black text-secondary md:text-xl">Live API integrations</h2>
              <p className="mt-1 text-sm font-medium leading-relaxed text-secondary/60">
                Review connected services and configure live platform infrastructure.
              </p>
            </div>
            <IntegrationsList integrations={integrations || []} />
         </div>
      </div>
    </div>
  );
}
