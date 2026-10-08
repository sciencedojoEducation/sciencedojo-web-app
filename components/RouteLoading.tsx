export default function RouteLoading() {
  return <div role="status" aria-live="polite" aria-busy="true" className="mx-auto w-full max-w-5xl space-y-6 p-6 text-slate-500 sm:p-10">
    <p className="flex items-center gap-3 text-sm font-medium"><span aria-hidden="true" className="h-4 w-4 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin" />Loading…</p>
    <div aria-hidden="true" className="space-y-5 motion-safe:animate-pulse">
      <div className="h-8 w-2/3 rounded-lg bg-slate-200/60" />
      <div className="h-40 rounded-2xl bg-slate-200/40" />
      <div className="h-4 w-full rounded bg-slate-200/50" />
      <div className="h-4 w-4/5 rounded bg-slate-200/50" />
    </div>
  </div>;
}
