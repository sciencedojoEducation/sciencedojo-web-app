export default function MaintenancePage() {
  return (
    <div className="fixed inset-0 z-[100000] bg-[#020617] text-white overflow-hidden flex items-center justify-center px-6 py-16">
      <div className="absolute top-[-20%] left-[-10%] w-[520px] h-[520px] bg-[#6FE3D6]/20 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[520px] h-[520px] bg-[#1E5AA8]/20 blur-[140px] rounded-full pointer-events-none" />

      <main className="relative z-10 w-full max-w-2xl text-center space-y-9">
        <img
          src="/images/sciencedojo-logo-brand.jpg"
          alt="ScienceDojo"
          className="w-24 h-24 mx-auto rounded-3xl border border-white/10 shadow-2xl shadow-[#1E5AA8]/30"
        />

        <section className="space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6FE3D6]/10 border border-[#6FE3D6]/20 text-[#6FE3D6] text-[10px] font-black uppercase tracking-[0.25em]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6FE3D6] animate-pulse" />
            Under Construction
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none">
            ScienceDojo is getting an upgrade.
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl mx-auto font-medium">
            We are updating the platform right now. Classes, dashboards, and booking tools will be back shortly.
          </p>
        </section>

        <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left shadow-2xl shadow-black/20">
          <div className="flex items-start gap-4">
            <div className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.8)]" />
            <div className="space-y-1">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-white">
                Temporary Maintenance
              </p>
              <p className="text-sm leading-relaxed text-slate-400">
                If you have a scheduled lesson, please check your email or contact ScienceDojo support for updates.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
