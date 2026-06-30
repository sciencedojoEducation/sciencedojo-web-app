import Link from "next/link";

type FeatureUnavailableProps = {
  title?: string;
  message?: string;
  eyebrow?: string;
  ctaHref?: string;
  ctaLabel?: string;
};

export default function FeatureUnavailable({
  title = "This part of ScienceDojo is almost ready.",
  message = "We are preparing this experience carefully before opening it to families.",
  eyebrow = "Coming soon",
  ctaHref = "/",
  ctaLabel = "Back to ScienceDojo",
}: FeatureUnavailableProps) {
  return (
    <main className="min-h-[70vh] bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] px-4 py-16 text-secondary md:px-8 md:py-24">
      <section className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {eyebrow}
        </div>
        <div className="rounded-[2rem] border border-secondary/10 bg-white p-7 shadow-[0_24px_80px_rgba(0,26,68,0.06)] md:rounded-[2.5rem] md:p-10">
          <h1 className="text-3xl font-black leading-tight tracking-tight text-secondary md:text-5xl">
            {title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base font-medium leading-7 text-secondary/62 md:text-lg md:leading-8">
            {message}
          </p>
          <Link
            href={ctaHref}
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-2xl bg-primary px-6 text-sm font-black uppercase tracking-[0.12em] text-white shadow-lg shadow-primary/15 transition-colors hover:bg-primary-hover"
          >
            {ctaLabel}
          </Link>
        </div>
      </section>
    </main>
  );
}
