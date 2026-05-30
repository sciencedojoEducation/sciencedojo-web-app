import Link from "next/link";
import type { ReactNode } from "react";

type SupportInfoSection = {
  title: string;
  body?: ReactNode;
  items?: ReactNode[];
};

type SupportInfoPageProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  sections: SupportInfoSection[];
};

export default function SupportInfoPage({ eyebrow, title, subtitle, sections }: SupportInfoPageProps) {
  return (
    <div className="bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_48%,#ffffff_100%)] text-secondary">
      <section className="relative overflow-hidden border-b border-secondary/10 px-4 py-16 md:px-8 md:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(0,102,255,0.08),transparent_30%),radial-gradient(circle_at_82%_22%,rgba(0,245,212,0.05),transparent_28%)]" />
        <div className="relative mx-auto max-w-5xl">
          <nav aria-label="Breadcrumb" className="text-xs font-black uppercase tracking-[0.18em] text-secondary/40">
            <Link href="/" className="transition-colors hover:text-primary">Home</Link>
            <span className="mx-2" aria-hidden="true">&gt;</span>
            <span className="text-primary">{title}</span>
          </nav>
          <p className="mt-8 text-xs font-black uppercase tracking-[0.28em] text-primary">{eyebrow}</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">{title}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-secondary/65">{subtitle}</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 md:px-8 md:py-16">
        <div className="grid gap-5">
          {sections.map((section) => (
            <article key={section.title} className="rounded-3xl border border-secondary/10 bg-white/95 p-6 shadow-xl shadow-secondary/5 md:p-8">
              <h2 className="text-2xl font-black tracking-tight">{section.title}</h2>
              {section.body && <p className="mt-4 leading-7 text-secondary/65">{section.body}</p>}
              {section.items && (
                <ul className="mt-5 space-y-3">
                  {section.items.map((item, index) => (
                    <li key={index} className="flex gap-3 leading-7 text-secondary/65">
                      <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>

        <div className="mt-12 rounded-[2rem] bg-[linear-gradient(135deg,#06172f_0%,#0a4d95_58%,#0066ff_100%)] p-8 text-center shadow-2xl shadow-secondary/15 md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100/75">Ready to find your tutor?</p>
          <h2 className="mt-3 text-3xl font-black text-white md:text-4xl">Book a free session</h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/65">
            Tell us what support you need and we will help you find the right learning path.
          </p>
          <Link
            href="/free-assessment"
            className="mt-7 inline-flex rounded-full bg-white px-7 py-3.5 text-sm font-black text-primary shadow-lg shadow-black/10 transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Book Free Assessment
          </Link>
        </div>
      </section>
    </div>
  );
}
