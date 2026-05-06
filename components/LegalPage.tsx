type LegalSection = {
  title: string;
  body?: string;
  items?: string[];
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  sections: LegalSection[];
};

export default function LegalPage({ eyebrow, title, subtitle, sections }: LegalPageProps) {
  return (
    <main className="bg-background text-secondary">
      <section className="border-b border-secondary/10 bg-white px-4 py-16 md:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">{eyebrow}</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">{title}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-secondary/65">{subtitle}</p>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-secondary/35">Last updated: May 6, 2026</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        <div className="space-y-5">
          {sections.map((section) => (
            <article key={section.title} className="rounded-3xl border border-secondary/10 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black tracking-tight">{section.title}</h2>
              {section.body && <p className="mt-4 leading-7 text-secondary/65">{section.body}</p>}
              {section.items && (
                <ul className="mt-5 space-y-3">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-3 leading-7 text-secondary/65">
                      <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
