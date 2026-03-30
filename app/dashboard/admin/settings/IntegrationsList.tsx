"use client"

import { useState, useTransition } from "react";
import { updateIntegrationKeys } from "./integration-actions";

type IntegrationStatus = { provider: string, is_active: boolean, key_1: string, key_2: string, key_3: string };

export default function IntegrationsList({ integrations }: { integrations: IntegrationStatus[] }) {
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const stripeData = integrations.find(i => i.provider === 'stripe') || { is_active: false, key_1: '', key_2: '', key_3: '' };
  const zoomData = integrations.find(i => i.provider === 'zoom') || { is_active: false, key_1: '', key_2: '', key_3: '' };
  const googleData = integrations.find(i => i.provider === 'google_calendar') || { is_active: false, key_1: '', key_2: '', key_3: '' };

  const handleUpdate = (provider: 'stripe' | 'zoom' | 'google_calendar', e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      key_1: formData.get("key_1") as string,
      key_2: formData.get("key_2") as string,
      key_3: formData.get("key_3") as string,
      is_active: formData.get("is_active") === "on",
    };

    startTransition(async () => {
      const res = await updateIntegrationKeys(provider, data);
      if (res.error) alert(res.error);
      else {
        alert(`${provider} configuration saved successfully!`);
        setActivePanel(null); // Close panel on success
      }
    });
  };

  return (
    <div className="space-y-6">
       {/* Stripe */}
       <div className={`p-5 border rounded-2xl transition-all ${stripeData.is_active ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex justify-between items-center">
             <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                   <div className={`w-2 h-2 rounded-full ${stripeData.is_active ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                   <h3 className={`font-bold ${stripeData.is_active ? 'text-green-900' : 'text-slate-500'}`}>Stripe Payments</h3>
                </div>
                <p className={`text-xs ${stripeData.is_active ? 'text-green-800/70' : 'text-slate-400'}`}>
                   {stripeData.is_active ? 'Connected securely via Webhooks.' : 'API keys required for live transactions.'}
                </p>
             </div>
             <button 
                onClick={() => setActivePanel(activePanel === 'stripe' ? null : 'stripe')}
                className={`px-4 py-1.5 border text-xs font-bold rounded-lg shadow-sm transition-colors ${stripeData.is_active ? 'bg-white border-green-200 text-green-700 hover:bg-green-100' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}
             >
                Configure
             </button>
          </div>
          
          {activePanel === 'stripe' && (
             <form onSubmit={(e) => handleUpdate('stripe', e)} className="mt-6 pt-6 border-t border-black/5 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4">
                <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Secret Key (sk_live...)</label>
                   <input type="password" name="key_1" defaultValue={stripeData.key_1 || ""} className="w-full text-sm p-3 rounded-lg border border-slate-300 bg-white" placeholder="sk_live_..." />
                </div>
                <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Webhook Secret (whsec...)</label>
                   <input type="password" name="key_2" defaultValue={stripeData.key_2 || ""} className="w-full text-sm p-3 rounded-lg border border-slate-300 bg-white" placeholder="whsec_..." />
                </div>
                <div className="flex items-center gap-3">
                   <input type="checkbox" name="is_active" id="stripe_active" defaultChecked={stripeData.is_active} className="w-4 h-4" />
                   <label htmlFor="stripe_active" className="text-sm font-bold text-slate-700">Enable Live Stripe Mode</label>
                </div>
                <div className="flex justify-end mt-2">
                   <button disabled={isPending} type="submit" className="px-6 py-2 bg-slate-800 text-white font-bold text-sm rounded-lg hover:bg-slate-700 disabled:opacity-50">Save Configuration</button>
                </div>
             </form>
          )}
       </div>

       {/* Zoom */}
       <div className={`p-5 border rounded-2xl transition-all ${zoomData.is_active ? 'border-primary/20 bg-primary/5' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex justify-between items-center">
             <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                   <div className={`w-2 h-2 rounded-full ${zoomData.is_active ? 'bg-primary' : 'bg-slate-300'}`}></div>
                   <h3 className={`font-bold ${zoomData.is_active ? 'text-primary-dark' : 'text-slate-500'}`}>Zoom Server-to-Server OAuth</h3>
                </div>
                <p className={`text-xs ${zoomData.is_active ? 'text-primary/70' : 'text-slate-400'}`}>
                   {zoomData.is_active ? 'Autogenerating unique meeting IDs.' : 'Fallback mocked meeting URLs currently deployed.'}
                </p>
             </div>
             <button 
                onClick={() => setActivePanel(activePanel === 'zoom' ? null : 'zoom')}
                className={`px-4 py-1.5 border text-xs font-bold rounded-lg shadow-sm transition-colors ${zoomData.is_active ? 'bg-white border-primary/20 text-primary hover:bg-primary/10' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}
             >
                Configure
             </button>
          </div>

          {activePanel === 'zoom' && (
             <form onSubmit={(e) => handleUpdate('zoom', e)} className="mt-6 pt-6 border-t border-black/5 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4">
                <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Account ID</label>
                   <input type="password" name="key_1" defaultValue={zoomData.key_1 || ""} className="w-full text-sm p-3 rounded-lg border border-slate-300 bg-white" placeholder="Zoom Account ID" />
                </div>
                <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Client ID</label>
                   <input type="password" name="key_2" defaultValue={zoomData.key_2 || ""} className="w-full text-sm p-3 rounded-lg border border-slate-300 bg-white" placeholder="Zoom Server-to-Server Client ID" />
                </div>
                <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Client Secret</label>
                   <input type="password" name="key_3" defaultValue={zoomData.key_3 || ""} className="w-full text-sm p-3 rounded-lg border border-slate-300 bg-white" placeholder="Zoom Server-to-Server Client Secret" />
                </div>
                <div className="flex items-center gap-3">
                   <input type="checkbox" name="is_active" id="zoom_active" defaultChecked={zoomData.is_active} className="w-4 h-4" />
                   <label htmlFor="zoom_active" className="text-sm font-bold text-slate-700">Enable Live Zoom Generation</label>
                </div>
                <div className="flex justify-end mt-2">
                   <button disabled={isPending} type="submit" className="px-6 py-2 bg-slate-800 text-white font-bold text-sm rounded-lg hover:bg-slate-700 disabled:opacity-50">Save Configuration</button>
                </div>
             </form>
          )}
       </div>

       {/* Google Calendar */}
       <div className={`p-5 border rounded-2xl transition-all ${googleData.is_active ? 'border-orange-200 bg-orange-50' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex justify-between items-center">
             <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                   <div className={`w-2 h-2 rounded-full ${googleData.is_active ? 'bg-orange-500' : 'bg-slate-300'}`}></div>
                   <h3 className={`font-bold ${googleData.is_active ? 'text-orange-900' : 'text-slate-500'}`}>Google Calendar API</h3>
                </div>
                <p className={`text-xs ${googleData.is_active ? 'text-orange-800/70' : 'text-slate-400'}`}>
                   {googleData.is_active ? 'Automating calendar invites via Service Account.' : 'Fallback .ics dynamic links currently used.'}
                </p>
             </div>
             <button 
                onClick={() => setActivePanel(activePanel === 'google' ? null : 'google')}
                className={`px-4 py-1.5 border text-xs font-bold rounded-lg shadow-sm transition-colors ${googleData.is_active ? 'bg-white border-orange-200 text-orange-700 hover:bg-orange-100' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}
             >
                Configure
             </button>
          </div>

          {activePanel === 'google' && (
             <form onSubmit={(e) => handleUpdate('google_calendar', e)} className="mt-6 pt-6 border-t border-black/5 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4">
                <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Service Account Email (client_email)</label>
                   <input type="text" name="key_1" defaultValue={googleData.key_1 || ""} className="w-full text-sm p-3 rounded-lg border border-slate-300 bg-white" placeholder="your-service@project-id.iam.gserviceaccount.com" />
                </div>
                <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Private Key (BEGIN PRIVATE KEY...)</label>
                   <textarea name="key_2" defaultValue={googleData.key_2 || ""} className="w-full text-sm p-3 rounded-lg border border-slate-300 bg-white font-mono h-24" placeholder="-----BEGIN PRIVATE KEY-----\n..." />
                </div>
                <div className="flex items-center gap-3">
                   <input type="checkbox" name="is_active" id="google_active" defaultChecked={googleData.is_active} className="w-4 h-4" />
                   <label htmlFor="google_active" className="text-sm font-bold text-slate-700">Enable Live Calendar Invites</label>
                </div>
                <div className="flex justify-end mt-2">
                   <button disabled={isPending} type="submit" className="px-6 py-2 bg-slate-800 text-white font-bold text-sm rounded-lg hover:bg-slate-700 disabled:opacity-50">Save Configuration</button>
                </div>
             </form>
          )}
       </div>
    </div>
  );
}
