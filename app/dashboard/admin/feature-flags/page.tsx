import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  FEATURE_FLAG_CATEGORIES,
  getFeatureFlags,
  type FeatureFlag,
} from "@/lib/feature-flags";
import { toggleFeatureFlag } from "./actions";

export const metadata = {
  title: "Feature Flags | ScienceDojo Admin",
};

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin" && user.user_metadata?.role !== "admin") {
    redirect("/dashboard");
  }
}

function formatUpdatedAt(value: string | null) {
  if (!value) return "Using safe default";

  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function FlagToggle({ flag }: { flag: FeatureFlag }) {
  const nextEnabled = !flag.enabled;

  return (
    <form action={toggleFeatureFlag}>
      <input type="hidden" name="key" value={flag.key} />
      <input type="hidden" name="enabled" value={String(nextEnabled)} />
      <button
        type="submit"
        className={`inline-flex min-h-10 items-center gap-3 rounded-2xl border px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
          flag.enabled ? "border-primary bg-primary/5 text-primary" : "border-secondary/15 bg-secondary/5 text-secondary/55"
        }`}
        aria-label={`${flag.enabled ? "Disable" : "Enable"} ${flag.label}`}
      >
        <span
          className={`relative inline-flex h-6 w-11 items-center rounded-full border p-0.5 transition-colors ${
            flag.enabled ? "border-primary bg-primary" : "border-secondary/15 bg-secondary/10"
          }`}
          aria-hidden="true"
        >
          <span
            className={`h-4.5 w-4.5 rounded-full bg-white shadow-sm transition-transform ${
              flag.enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </span>
        <span
          className="min-w-16 text-left text-[10px] font-black uppercase tracking-[0.12em]"
        >
          {flag.enabled ? "Enabled" : "Disabled"}
        </span>
      </button>
    </form>
  );
}

export default async function AdminFeatureFlagsPage() {
  await requireAdmin();
  const flags = await getFeatureFlags();
  const flagsByCategory = FEATURE_FLAG_CATEGORIES.map((category) => ({
    category,
    flags: flags.filter((flag) => flag.category === category),
  })).filter((group) => group.flags.length > 0);

  const enabledCount = flags.filter((flag) => flag.enabled).length;

  return (
    <div className="mx-auto max-w-5xl px-3 py-5 sm:px-4 md:p-8">
      <div className="mb-6 rounded-[1.5rem] border border-secondary/10 bg-white p-5 shadow-sm md:rounded-[2rem] md:p-7">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary/60">ScienceDojo admin</p>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-secondary md:text-4xl">Feature Flags</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-7 text-secondary/60">
              Control unfinished surfaces without deleting code or redeploying manually.
            </p>
          </div>
          <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/60">Enabled</p>
            <p className="text-2xl font-black text-primary">{enabledCount}/{flags.length}</p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {flagsByCategory.map(({ category, flags: categoryFlags }) => (
          <section key={category} className="rounded-[1.5rem] border border-secondary/10 bg-white p-4 shadow-sm md:rounded-[2rem] md:p-5">
            <div className="mb-4 flex items-center justify-between gap-4 border-b border-secondary/8 pb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-secondary/35">Category</p>
                <h2 className="mt-1 text-xl font-black text-secondary">{category}</h2>
              </div>
              <span className="rounded-full bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-secondary/45">
                {categoryFlags.length} flags
              </span>
            </div>

            <div className="divide-y divide-secondary/8">
              {categoryFlags.map((flag) => (
                <div key={flag.key} className="grid gap-4 py-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-black text-secondary">{flag.label}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${
                        flag.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}>
                        {flag.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium leading-6 text-secondary/58">{flag.description}</p>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-secondary/35">
                      {flag.key} · {formatUpdatedAt(flag.updated_at)}
                    </p>
                  </div>
                  <FlagToggle flag={flag} />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
