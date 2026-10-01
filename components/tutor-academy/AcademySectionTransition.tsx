export default function AcademySectionTransition({ label }: { label: string }) {
  const numbered = label.match(/^(\d+(?:\.\d+)*)\s+(.+)$/);
  return (
    <section className="academy-section-transition relative overflow-hidden rounded-2xl border border-[#C7D9E9] bg-linear-to-br from-[#EAF3FB] via-[#F2F7FC] to-[#EDF5F1] px-6 py-7 shadow-[0_4px_18px_rgba(23,58,99,0.04)] sm:px-8 sm:py-9">
      <div className="absolute inset-y-0 left-0 w-1.5 bg-[var(--academy-accent)]" aria-hidden="true" />
      <div className="flex items-center gap-4 sm:gap-6">
        {numbered ? (
          <span className="flex min-h-14 min-w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--academy-accent)] px-3 text-xl font-bold text-white shadow-sm sm:min-h-16 sm:min-w-16 sm:text-2xl" aria-hidden="true">
            {numbered[1]}
          </span>
        ) : null}
        <h2 className="min-w-0 text-2xl font-bold leading-tight tracking-[-0.02em] text-[#173A63] [overflow-wrap:anywhere] sm:text-[30px]">
          {numbered ? <><span className="sr-only">{numbered[1]} </span>{numbered[2]}</> : label}
        </h2>
      </div>
    </section>
  );
}
